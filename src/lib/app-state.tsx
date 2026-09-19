import type { User as SupabaseAuthUser } from '@supabase/supabase-js';
import { randomUUID } from 'expo-crypto';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

import { demoPreferences, demoShifts, demoUser, demoWorkplaces } from '@/data/demo';
import { useAuth } from '@/lib/auth';
import { readStored, STORAGE_KEYS, writeStored } from '@/lib/storage';
import { useModalState, type ShiftEditorState, type WorkplaceEditorState } from '@/lib/state/use-modal-state';
import { useReminders } from '@/lib/state/use-reminders';
import { useSyncEngine } from '@/lib/state/use-sync-engine';
import { useUndo, type UndoState } from '@/lib/state/use-undo';
import { useThemeMode } from '@/lib/theme-mode';
import { supabaseDb } from '@/lib/supabase';
import { PaymentStatus, Shift, User, UserPreferences, Workplace } from '@/types';
import { toLocalDateString } from '@/utils/timeCalculations';


interface AppStateValue {
  // Data
  user: User;
  preferences: UserPreferences;
  workplaces: Workplace[];
  shifts: Shift[];

  // Supabase
  supabaseUser: SupabaseAuthUser | null;
  /** Offline-first sync: changes apply locally at once and are sent to Supabase when online. */
  isOnline: boolean;
  isSyncing: boolean;
  /** Changes made on this device that haven't reached Supabase yet. */
  pendingChanges: number;
  syncNow: () => Promise<void>;
  /** True while signed in, before the first load from the cloud, with nothing cached to show yet. */
  isInitialLoading: boolean;
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

  /** The last delete, which can be undone for a few seconds. */
  undo: UndoState | null;
  dismissUndo: () => void;

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
  shiftEditor: ShiftEditorState;
  openAddShift: (workplaceId?: string) => void;
  openEditShift: (shift: Shift) => void;
  closeShiftEditor: () => void;
  workplaceEditor: WorkplaceEditorState;
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

  const supabaseUserId = supabaseUser?.id;
  const { undo, showUndo, dismissUndo } = useUndo();
  const modals = useModalState();
  const { setActiveWorkplaceId, setShowPaymentTracking } = modals;

  const sync = useSyncEngine({ userId: supabaseUserId, setWorkplaces, setShifts });
  const { enqueue } = sync;

  // ---- Persistence to local storage --------------------------------------------------------
  useEffect(() => writeStored(STORAGE_KEYS.user, user), [user]);
  useEffect(() => writeStored(STORAGE_KEYS.workplaces, workplaces), [workplaces]);
  useEffect(() => writeStored(STORAGE_KEYS.shifts, shifts), [shifts]);

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

  useReminders(preferences, workplaces, shifts);

  // ---- Supabase cloud data & offline sync ---------------------------------------------------
  const supabaseUserName = supabaseUser ? nameFromSession(supabaseUser) : undefined;
  const supabaseUserEmail = supabaseUser?.email;

  // Mirror the signed-in account into the local profile. Done while rendering (React's "adjust state
  // when inputs change" pattern) instead of in an effect, so there's no extra render pass.
  const profileKey = supabaseUserId
    ? `${supabaseUserId}|${supabaseUserName}|${supabaseUserEmail}`
    : null;
  const [appliedProfileKey, setAppliedProfileKey] = useState<string | null>(null);
  if (profileKey !== appliedProfileKey) {
    setAppliedProfileKey(profileKey);
    if (supabaseUserId) {
      setUser((prev) => ({
        ...prev,
        id: supabaseUserId,
        name: supabaseUserName ?? prev.name,
        email: supabaseUserEmail || prev.email,
      }));
    }
  }


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
      sync.clearQueue();
    }
    await signOut();
    return null;
  };

  // ---- Data actions ------------------------------------------------------------------------
  // Each one updates the screen immediately and queues the change for Supabase (signed in only).

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
    const removed = shifts.find((s) => s.id === id);
    setShifts((prev) => prev.filter((s) => s.id !== id));
    enqueue({ type: 'delete_shift', shiftId: id });

    if (removed) {
      showUndo('Shift deleted', () => {
        setShifts((prev) => (prev.some((s) => s.id === removed.id) ? prev : [removed, ...prev]));
        enqueue({ type: 'upsert_shift', shift: removed });
      });
    }
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
    const removedWorkplace = workplaces.find((w) => w.id === id);
    const removedShifts = shifts.filter((s) => s.workplaceId === id);

    setWorkplaces((prev) => prev.filter((w) => w.id !== id));
    // Also remove associated shifts (the database cascades on delete)
    setShifts((prev) => prev.filter((s) => s.workplaceId !== id));
    setActiveWorkplaceId(null);
    enqueue({ type: 'delete_workplace', workplaceId: id });

    if (removedWorkplace) {
      showUndo(`${removedWorkplace.name} deleted`, () => {
        setWorkplaces((prev) =>
          prev.some((w) => w.id === removedWorkplace.id) ? prev : [...prev, removedWorkplace],
        );
        setShifts((prev) => [...removedShifts, ...prev.filter((s) => !removedShifts.some((r) => r.id === s.id))]);
        // The workplace first, then its shifts, so the shifts always have something to point at
        enqueue({ type: 'upsert_workplace', workplace: removedWorkplace });
        removedShifts.forEach((shift) => enqueue({ type: 'upsert_shift', shift }));
      });
    }
  };

  const resetDemoData = () => {
    setUser(demoUser);
    setPreferences(defaultPreferences());
    setWorkplaces(demoWorkplaces);
    setShifts(demoShifts);
    setActiveWorkplaceId(null);
    setShowPaymentTracking(false);
  };

  const value: AppStateValue = {
    user,
    preferences,
    workplaces,
    shifts,

    supabaseUser,
    isOnline: sync.isOnline,
    isSyncing: sync.isSyncing,
    pendingChanges: sync.pendingChanges,
    syncNow: sync.syncNow,
    isInitialLoading:
      Boolean(supabaseUserId) && !sync.hasSynced && workplaces.length === 0 && shifts.length === 0,
    undo,
    dismissUndo,
    signOutSupabase: signOut,
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

    ...modals,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used inside <AppStateProvider>');
  return context;
}
