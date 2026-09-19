import NetInfo from '@react-native-community/netinfo';
import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { randomUUID } from 'expo-crypto';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Appearance, AppState } from 'react-native';

import {
  demoPayPeriods,
  demoPreferences,
  demoShifts,
  demoUser,
  demoWorkplaces,
} from '@/data/demo';
import { useAuth } from '@/lib/auth';
import { readStored, STORAGE_KEYS, writeStored } from '@/lib/storage';
import { applyReminderPlan, buildReminderPlan } from '@/lib/notifications';
import { useThemeMode } from '@/lib/theme-mode';
import { supabaseDb } from '@/lib/supabase';
import { applyOps, enqueueOp, isPermanentError, type SyncOp, type SyncOpBody } from '@/lib/sync';
import {
  PayPeriod,
  PaymentStatus,
  Shift,
  User,
  UserPreferences,
  Workplace,
} from '@/types';
import { toLocalDateString } from '@/utils/timeCalculations';

interface AppStateValue {
  // Data
  user: User;
  preferences: UserPreferences;
  workplaces: Workplace[];
  shifts: Shift[];
  payPeriods: PayPeriod[];

  // Supabase
  supabaseUser: SupabaseAuthUser | null;
  /** Offline-first sync: changes apply locally at once and are sent to Supabase when online. */
  isOnline: boolean;
  isSyncing: boolean;
  /** Changes made on this device that haven't reached Supabase yet. */
  pendingChanges: number;
  syncNow: () => Promise<void>;
  signOutSupabase: () => Promise<void>;
  /** Permanently deletes the account and its data, then signs out. Resolves with an error message on failure. */
  deleteAccountData: () => Promise<string | null>;

  // Data actions (optimistic locally, mirrored to Supabase when signed in)
  updateUser: (updates: Partial<User>) => void;
  updatePreferences: (updates: Partial<UserPreferences>) => void;
  addWorkplace: (workplace: Omit<Workplace, 'id'>) => Promise<void>;
  updateWorkplace: (id: string, workplace: Omit<Workplace, 'id'>) => Promise<void>;
  deleteWorkplace: (id: string) => Promise<void>;
  addShift: (shift: Omit<Shift, 'id'>) => Promise<void>;
  updateShift: (id: string, shift: Omit<Shift, 'id'>) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;
  setPaymentStatus: (
    id: string,
    status: PaymentStatus,
    paidDate?: string,
    actualPaidAmount?: number,
  ) => Promise<void>;
  resetDemoData: () => void;

  // Drill-down state for tab screens: which workplace's work log is open on the Workplaces tab,
  // and whether Payment Tracking is open on the Home tab.
  activeWorkplaceId: string | null;
  setActiveWorkplaceId: (id: string | null) => void;
  showPaymentTracking: boolean;
  setShowPaymentTracking: (show: boolean) => void;

  // Global modals (rendered once by <AppModals />)
  selectedShift: Shift | null;
  openShiftDetails: (shift: Shift) => void;
  closeShiftDetails: () => void;
  shiftEditor: { isOpen: boolean; workplaceId?: string; shift: Shift | null };
  openAddShift: (workplaceId?: string) => void;
  openEditShift: (shift: Shift) => void;
  closeShiftEditor: () => void;
  workplaceEditor: { isOpen: boolean; workplace: Workplace | null };
  openAddWorkplace: () => void;
  openEditWorkplace: (workplace: Workplace) => void;
  closeWorkplaceEditor: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

const defaultPreferences = (): UserPreferences => ({
  ...demoPreferences,
  darkMode: Appearance.getColorScheme() === 'dark',
});

const nameFromSession = (sessionUser: SupabaseAuthUser) =>
  sessionUser.user_metadata?.name ||
  sessionUser.email?.split('@')[0] ||
  'User';

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

const RETRY_DELAY_MS = 20_000;

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { isConfigured, user: supabaseUser, signOut } = useAuth();
  const { setDarkMode } = useThemeMode();
  // Signed in to the cloud: start empty and let the database fill the lists (demo ids aren't valid rows)
  const cloudMode = isConfigured;

  // Application data, restored from local storage
  const [user, setUser] = useState<User>(() =>
    readStored(
      STORAGE_KEYS.user,
      supabaseUser
        ? { id: supabaseUser.id, name: nameFromSession(supabaseUser), email: supabaseUser.email ?? '' }
        : demoUser,
    ),
  );
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    readStored(STORAGE_KEYS.preferences, defaultPreferences()),
  );
  const [workplaces, setWorkplaces] = useState<Workplace[]>(() =>
    readStored(STORAGE_KEYS.workplaces, cloudMode ? [] : demoWorkplaces),
  );
  const [shifts, setShifts] = useState<Shift[]>(() =>
    readStored(STORAGE_KEYS.shifts, cloudMode ? [] : demoShifts),
  );
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>(() =>
    readStored(STORAGE_KEYS.payPeriods, demoPayPeriods),
  );

  // Offline-first sync
  const supabaseUserId = supabaseUser?.id;
  const [ops, setOps] = useState<SyncOp[]>(() => {
    if (!supabaseUserId) return [];
    const saved = readStored<{ userId: string; ops: SyncOp[] } | null>(STORAGE_KEYS.outbox, null);
    return saved && saved.userId === supabaseUserId ? saved.ops : [];
  });
  const opsRef = useRef(ops); // always the latest queue, for async code that outlives a render
  const [isOnline, setIsOnline] = useState(true);
  const onlineRef = useRef(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const flushingRef = useRef(false);
  const pullingRef = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncNowRef = useRef<() => Promise<void>>(async () => {});

  // Navigation drill-downs and modals
  const [activeWorkplaceId, setActiveWorkplaceId] = useState<string | null>(null);
  const [showPaymentTracking, setShowPaymentTracking] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [shiftEditor, setShiftEditor] = useState<AppStateValue['shiftEditor']>({
    isOpen: false,
    shift: null,
  });
  const [workplaceEditor, setWorkplaceEditor] = useState<AppStateValue['workplaceEditor']>({
    isOpen: false,
    workplace: null,
  });

  // ---- Persistence to local storage --------------------------------------------------------
  useEffect(() => writeStored(STORAGE_KEYS.user, user), [user]);
  useEffect(() => writeStored(STORAGE_KEYS.workplaces, workplaces), [workplaces]);
  useEffect(() => writeStored(STORAGE_KEYS.shifts, shifts), [shifts]);
  useEffect(() => writeStored(STORAGE_KEYS.payPeriods, payPeriods), [payPeriods]);
  useEffect(() => {
    if (supabaseUserId) writeStored(STORAGE_KEYS.outbox, { userId: supabaseUserId, ops });
  }, [ops, supabaseUserId]);

  // The dark-mode preference drives the app's colour scheme
  useEffect(() => {
    writeStored(STORAGE_KEYS.preferences, preferences);
    setDarkMode(preferences.darkMode);
    try {
      // Also switches native chrome (keyboard, alerts, system pickers) to match
      Appearance.setColorScheme(preferences.darkMode ? 'dark' : 'light');
    } catch {
      // Not supported on this platform
    }
  }, [preferences, setDarkMode]);

  // ---- Reminders ---------------------------------------------------------------------------
  // The plan is reduced to a string so the effect only reruns when the reminders actually change
  const reminderPlan = JSON.stringify(
    buildReminderPlan({
      preferences,
      workplaces,
      hasUnpaidShifts: shifts.some((s) => s.paymentStatus === 'unpaid'),
    }),
  );

  useEffect(() => {
    const plan = JSON.parse(reminderPlan);
    void applyReminderPlan(plan);

    // Picks up permission that was granted in the system settings while the app was closed
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void applyReminderPlan(plan);
    });
    return () => appStateSub.remove();
  }, [reminderPlan]);

  // ---- Supabase cloud data & offline sync ---------------------------------------------------
  const supabaseUserName = supabaseUser ? nameFromSession(supabaseUser) : undefined;
  const supabaseUserEmail = supabaseUser?.email;

  // Mirror the signed-in account into the local profile
  useEffect(() => {
    if (!supabaseUserId) return;
    setUser((prev) => ({
      ...prev,
      id: supabaseUserId,
      name: supabaseUserName ?? prev.name,
      email: supabaseUserEmail || prev.email,
    }));
  }, [supabaseUserId, supabaseUserName, supabaseUserEmail]);

  const commitOps = useCallback((next: SyncOp[]) => {
    opsRef.current = next;
    setOps(next);
  }, []);

  /** Sends queued changes in order until the queue is empty or one can't be sent yet. */
  const flush = useCallback(async () => {
    const userId = supabaseUserId;
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
  }, [supabaseUserId, commitOps]);

  /** Sends pending changes, then refreshes from the cloud with any still-pending changes applied on top. */
  const syncNow = useCallback(async () => {
    const userId = supabaseUserId;
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
    }

    if (opsRef.current.length > 0) void flush();
  }, [supabaseUserId, flush]);

  useEffect(() => {
    syncNowRef.current = syncNow;
  }, [syncNow]);

  // Sync on sign-in, when the connection returns, and when the app comes back to the foreground
  useEffect(() => {
    if (!supabaseUserId) return;
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
  }, [supabaseUserId]);

  const signOutSupabase = signOut;

  /** Deletes the account and all its data, then signs out. Returns an error message on failure. */
  const deleteAccountData = async (): Promise<string | null> => {
    if (supabaseUser) {
      try {
        await supabaseDb.deleteAccount();
      } catch (err) {
        console.warn('Failed to delete the account:', err);
        const missing = (err as { code?: string } | null)?.code === 'PGRST202';
        return missing
          ? 'Account deletion is not set up on the server yet. Run the latest SQL schema in Supabase.'
          : 'Could not delete your account. Check your connection and try again.';
      }
      commitOps([]);
    }
    await signOut();
    return null;
  };

  // ---- Data actions ------------------------------------------------------------------------
  // Each one updates the screen immediately and queues the change for Supabase (signed in only).
  const enqueue = (body: SyncOpBody) => {
    if (!supabaseUserId) return;
    commitOps(enqueueOp(opsRef.current, body, randomUUID()));
    void flush();
  };

  const addShift = async (shiftData: Omit<Shift, 'id'>) => {
    const shift: Shift = { ...shiftData, id: randomUUID() };
    setShifts((prev) => [shift, ...prev]);
    enqueue({ type: 'upsert_shift', shift });
  };

  const updateShift = async (id: string, shiftData: Omit<Shift, 'id'>) => {
    const shift: Shift = { ...shiftData, id };
    setShifts((prev) => prev.map((s) => (s.id === id ? shift : s)));
    enqueue({ type: 'upsert_shift', shift });
  };

  const deleteShift = async (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
    enqueue({ type: 'delete_shift', shiftId: id });
  };

  const setPaymentStatus = async (
    id: string,
    status: PaymentStatus,
    paidDate?: string,
    actualPaidAmount?: number,
  ) => {
    const current = shifts.find((s) => s.id === id);
    if (!current) return;

    const shift: Shift = {
      ...current,
      paymentStatus: status,
      paidDate: status === 'paid' ? paidDate || toLocalDateString() : undefined,
      actualPaidAmount: status === 'paid' ? actualPaidAmount : undefined,
    };
    setShifts((prev) => prev.map((s) => (s.id === id ? shift : s)));
    enqueue({ type: 'upsert_shift', shift });
  };

  const addWorkplace = async (workplaceData: Omit<Workplace, 'id'>) => {
    const workplace: Workplace = { ...workplaceData, id: randomUUID() };
    setWorkplaces((prev) => [...prev, workplace]);
    enqueue({ type: 'upsert_workplace', workplace });
  };

  const updateWorkplace = async (id: string, workplaceData: Omit<Workplace, 'id'>) => {
    const workplace: Workplace = { ...workplaceData, id };
    setWorkplaces((prev) => prev.map((w) => (w.id === id ? workplace : w)));
    enqueue({ type: 'upsert_workplace', workplace });
  };

  const deleteWorkplace = async (id: string) => {
    setWorkplaces((prev) => prev.filter((w) => w.id !== id));
    // Also remove associated shifts (the database cascades on delete)
    setShifts((prev) => prev.filter((s) => s.workplaceId !== id));
    setActiveWorkplaceId(null);
    enqueue({ type: 'delete_workplace', workplaceId: id });
  };

  const resetDemoData = () => {
    setUser(demoUser);
    setPreferences(defaultPreferences());
    setWorkplaces(demoWorkplaces);
    setShifts(demoShifts);
    setPayPeriods(demoPayPeriods);
    setActiveWorkplaceId(null);
    setShowPaymentTracking(false);
  };

  const value: AppStateValue = {
    user,
    preferences,
    workplaces,
    shifts,
    payPeriods,

    supabaseUser,
    isOnline,
    isSyncing,
    pendingChanges: ops.length,
    syncNow,
    signOutSupabase,
    deleteAccountData,

    updateUser: (updates) => setUser((prev) => ({ ...prev, ...updates })),
    updatePreferences: (updates) => setPreferences((prev) => ({ ...prev, ...updates })),
    addWorkplace,
    updateWorkplace,
    deleteWorkplace,
    addShift,
    updateShift,
    deleteShift,
    setPaymentStatus,
    resetDemoData,

    activeWorkplaceId,
    setActiveWorkplaceId,
    showPaymentTracking,
    setShowPaymentTracking,

    selectedShift,
    openShiftDetails: setSelectedShift,
    closeShiftDetails: () => setSelectedShift(null),
    shiftEditor,
    openAddShift: (workplaceId) => setShiftEditor({ isOpen: true, workplaceId, shift: null }),
    openEditShift: (shift) => setShiftEditor({ isOpen: true, shift }),
    closeShiftEditor: () => setShiftEditor({ isOpen: false, shift: null }),
    workplaceEditor,
    openAddWorkplace: () => setWorkplaceEditor({ isOpen: true, workplace: null }),
    openEditWorkplace: (workplace) => setWorkplaceEditor({ isOpen: true, workplace }),
    closeWorkplaceEditor: () => setWorkplaceEditor({ isOpen: false, workplace: null }),
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used inside <AppStateProvider>');
  return context;
}
