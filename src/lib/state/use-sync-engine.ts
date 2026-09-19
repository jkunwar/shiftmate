import NetInfo from '@react-native-community/netinfo';
import { randomUUID } from 'expo-crypto';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { readStored, STORAGE_KEYS, writeStored } from '@/lib/storage';
import { supabaseDb } from '@/lib/supabase';
import { applyOps, enqueueOp, isPermanentError, type SyncOp, type SyncOpBody } from '@/lib/sync';
import { Shift, Workplace } from '@/types';

const RETRY_DELAY_MS = 20_000;

/** Sends one queued change to Supabase. 'retry' leaves it queued; 'done' removes it (sent or hopeless). */
async function runOp(userId: string, op: SyncOp): Promise<'done' | 'retry'> {
  try {
    switch (op.type) {
      case 'upsert_workplace':
        await supabaseDb.upsertWorkplace(userId, op.workplace);
        break;
      case 'delete_workplace':
        await supabaseDb.deleteWorkplace(op.workplaceId);
        break;
      case 'upsert_shift':
        await supabaseDb.upsertShift(userId, op.shift);
        break;
      case 'delete_shift':
        await supabaseDb.deleteShift(op.shiftId);
        break;
    }
    return 'done';
  } catch (err) {
    if (isPermanentError(err)) {
      console.warn('Dropping a change Supabase rejected:', op.type, err);
      return 'done';
    }
    return 'retry';
  }
}

interface SyncEngineOptions {
  /** The signed-in account. Without one nothing is queued or synced. */
  userId: string | undefined;
  setWorkplaces: Dispatch<SetStateAction<Workplace[]>>;
  setShifts: Dispatch<SetStateAction<Shift[]>>;
}

/**
 * Offline-first sync. Changes are applied locally by the caller and queued here (persisted, so they
 * survive a restart); the queue is sent to Supabase when online and the cloud copy is pulled back
 * with any still-pending changes applied on top.
 */
export function useSyncEngine({ userId, setWorkplaces, setShifts }: SyncEngineOptions) {
  const [ops, setOps] = useState<SyncOp[]>(() => {
    if (!userId) return [];
    const saved = readStored<{ userId: string; ops: SyncOp[] } | null>(STORAGE_KEYS.outbox, null);
    return saved && saved.userId === userId ? saved.ops : [];
  });
  const opsRef = useRef(ops); // always the latest queue, for async code that outlives a render
  const [isOnline, setIsOnline] = useState(true);
  const onlineRef = useRef(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const flushingRef = useRef(false);
  const pullingRef = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncNowRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    if (userId) writeStored(STORAGE_KEYS.outbox, { userId, ops });
  }, [ops, userId]);

  const commitOps = useCallback((next: SyncOp[]) => {
    opsRef.current = next;
    setOps(next);
  }, []);

  /** Sends queued changes in order until the queue is empty or one can't be sent yet. */
  const flush = useCallback(async () => {
    // A pull in progress applies the queue itself; it flushes again when it finishes
    if (!userId || flushingRef.current || pullingRef.current) return;

    flushingRef.current = true;
    setIsSyncing(true);
    if (retryTimer.current) clearTimeout(retryTimer.current);

    let complete = true;
    try {
      while (opsRef.current.length > 0) {
        const op = opsRef.current[0];
        if ((await runOp(userId, op)) === 'retry') {
          complete = false;
          break;
        }
        commitOps(opsRef.current.filter((o) => o.id !== op.id));
      }
    } finally {
      flushingRef.current = false;
      setIsSyncing(false);
    }

    if (!complete) {
      retryTimer.current = setTimeout(() => void syncNowRef.current(), RETRY_DELAY_MS);
    }
  }, [userId, commitOps]);

  /** Sends pending changes, then refreshes from the cloud with any still-pending changes applied on top. */
  const syncNow = useCallback(async () => {
    if (!userId) return;

    await flush();

    pullingRef.current = true;
    setIsSyncing(true);
    try {
      const [cloudWorkplaces, cloudShifts] = await Promise.all([
        supabaseDb.fetchWorkplaces(userId),
        supabaseDb.fetchShifts(userId),
      ]);
      const merged = applyOps(
        { workplaces: cloudWorkplaces, shifts: cloudShifts },
        opsRef.current,
      );
      setWorkplaces(merged.workplaces);
      setShifts(merged.shifts);
    } catch (err) {
      // Offline or unreachable: keep working from the local copy
      console.warn('Could not refresh from Supabase:', err);
    } finally {
      pullingRef.current = false;
      setIsSyncing(false);
      setHasSynced(true);
    }

    if (opsRef.current.length > 0) void flush();
  }, [userId, flush, setWorkplaces, setShifts]);

  useEffect(() => {
    syncNowRef.current = syncNow;
  }, [syncNow]);

  // Sync on sign-in, when the connection returns, and when the app comes back to the foreground
  useEffect(() => {
    if (!userId) return;
    void syncNowRef.current();

    const unsubscribeNet = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected) && state.isInternetReachable !== false;
      const wasOnline = onlineRef.current;
      onlineRef.current = online;
      setIsOnline(online);
      if (online && !wasOnline) void syncNowRef.current();
    });

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncNowRef.current();
    });

    return () => {
      unsubscribeNet();
      appStateSub.remove();
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [userId]);

  /** Queues a change for Supabase (signed in only) and starts sending it. */
  const enqueue = (body: SyncOpBody) => {
    if (!userId) return;
    commitOps(enqueueOp(opsRef.current, body, randomUUID()));
    void flush();
  };

  const clearQueue = () => commitOps([]);

  return { pendingChanges: ops.length, isOnline, isSyncing, hasSynced, syncNow, enqueue, clearQueue };
}
