import type { Session, User as SupabaseAuthUser } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { cancelAllReminders } from '@/lib/notifications';
import { clearStoredAccountData } from '@/lib/storage';
import { setErrorReportingUser } from '@/lib/error-reporting';

/** `error` is a user-facing message, or null on success. */
export interface AuthResult {
  error: string | null;
}

export interface SignUpResult extends AuthResult {
  /** True when the account was created but the email must be confirmed before signing in. */
  needsConfirmation: boolean;
}

interface AuthValue {
  /** False when the Supabase env vars are missing: the app then runs in local-only mode. */
  isConfigured: boolean;
  /** True until the stored session has been read. */
  isLoading: boolean;
  session: Session | null;
  user: SupabaseAuthUser | null;
  /** True after opening a password-reset link, until a new password is set. */
  isRecovery: boolean;
  /** Error from an email link (expired, already used, ...), shown on the sign-in screen. */
  linkError: string | null;
  clearLinkError: () => void;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (name: string, email: string, password: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
  updateProfile: (updates: { name?: string; email?: string }) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthValue | null>(null);

const REDIRECT_PATH = 'auth-callback';
const NOT_CONFIGURED: AuthResult = { error: 'Supabase is not configured.' };

// Must be listed under Authentication -> URL Configuration -> Redirect URLs in the Supabase dashboard
const redirectUrl = () => Linking.createURL(REDIRECT_PATH);

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

/** Reads key=value pairs from both the query string and the #fragment of a deep link. */
function parseAuthParams(url: string): Record<string, string> {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const fragment = hashIndex >= 0 ? url.slice(hashIndex + 1) : '';
  const query =
    queryIndex >= 0
      ? url.slice(queryIndex + 1, hashIndex > queryIndex ? hashIndex : undefined)
      : '';

  const params: Record<string, string> = {};
  for (const part of [fragment, query]) {
    for (const pair of part.split('&')) {
      if (!pair) continue;
      const [key, ...rest] = pair.split('=');
      params[safeDecode(key)] = safeDecode(rest.join('='));
    }
  }
  return params;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isConfigured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(isConfigured);
  const [isRecovery, setIsRecovery] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const handledUrls = useRef(new Set<string>());

  // Restore the stored session and follow auth changes
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;

    sb.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null))
      .finally(() => setIsLoading(false));

    // Keep this callback synchronous: awaiting Supabase calls inside it can deadlock the client
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
      if (event === 'PASSWORD_RECOVERY') setIsRecovery(true);
      if (event === 'SIGNED_OUT') {
        setIsRecovery(false);
        clearStoredAccountData();
        void cancelAllReminders();
      }
    });

    // React Native has no page visibility: pause token refresh while the app is in the background
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') sb.auth.startAutoRefresh();
      else sb.auth.stopAutoRefresh();
    });

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
    };
  }, []);

  // Crash reports are tied to the anonymous account id only, never an email or name
  const userId = session?.user.id ?? null;
  useEffect(() => setErrorReportingUser(userId), [userId]);

  // Email links (confirm sign-up, reset password) reopen the app as `auth-callback` URLs carrying
  // session tokens. Each URL is consumed once because the tokens are single-use.
  const consumeAuthUrl = async (url: string | null): Promise<AuthResult> => {
    const sb = getSupabase();
    if (!sb || !url || !url.includes(REDIRECT_PATH) || handledUrls.current.has(url)) {
      return { error: null };
    }
    handledUrls.current.add(url);

    const params = parseAuthParams(url);
    const urlError = params.error_description || params.error;
    if (urlError) return { error: urlError };
    if (!params.access_token || !params.refresh_token) return { error: null };

    const { error } = await sb.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) return { error: error.message };
    if (params.type === 'recovery') setIsRecovery(true);
    return { error: null };
  };

  useEffect(() => {
    if (!getSupabase()) return;

    const handleUrl = async (url: string | null) => {
      const { error } = await consumeAuthUrl(url);
      if (error) setLinkError(error);
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, []);

  const signIn: AuthValue['signIn'] = async (email, password) => {
    const sb = getSupabase();
    if (!sb) return NOT_CONFIGURED;
    try {
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      return { error: error?.message ?? null };
    } catch {
      return { error: 'Could not reach the server. Check your connection and try again.' };
    }
  };

  const signUp: AuthValue['signUp'] = async (name, email, password) => {
    const sb = getSupabase();
    if (!sb) return { ...NOT_CONFIGURED, needsConfirmation: false };
    try {
      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() }, emailRedirectTo: redirectUrl() },
      });
      if (error) return { error: error.message, needsConfirmation: false };
      // No session back means email confirmation is switched on for the project
      return { error: null, needsConfirmation: !data.session };
    } catch {
      return {
        error: 'Could not reach the server. Check your connection and try again.',
        needsConfirmation: false,
      };
    }
  };

  const signOut: AuthValue['signOut'] = async () => {
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.auth.signOut();
    } catch {
      // The local session is cleared even if the server can't be reached
    }
  };

  const resendConfirmation: AuthValue['resendConfirmation'] = async (email) => {
    const sb = getSupabase();
    if (!sb) return NOT_CONFIGURED;
    try {
      const { error } = await sb.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: redirectUrl() },
      });
      return { error: error?.message ?? null };
    } catch {
      return { error: 'Could not reach the server. Check your connection and try again.' };
    }
  };

  const sendPasswordReset: AuthValue['sendPasswordReset'] = async (email) => {
    const sb = getSupabase();
    if (!sb) return NOT_CONFIGURED;
    try {
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl(),
      });
      return { error: error?.message ?? null };
    } catch {
      return { error: 'Could not reach the server. Check your connection and try again.' };
    }
  };

  const updatePassword: AuthValue['updatePassword'] = async (newPassword) => {
    const sb = getSupabase();
    if (!sb) return NOT_CONFIGURED;
    try {
      const { error } = await sb.auth.updateUser({ password: newPassword });
      if (!error) setIsRecovery(false);
      return { error: error?.message ?? null };
    } catch {
      return { error: 'Could not reach the server. Check your connection and try again.' };
    }
  };

  const updateProfile: AuthValue['updateProfile'] = async ({ name, email }) => {
    const sb = getSupabase();
    if (!sb) return NOT_CONFIGURED;
    try {
      const { error } = await sb.auth.updateUser({
        ...(email ? { email: email.trim() } : {}),
        ...(name ? { data: { name: name.trim() } } : {}),
      });
      return { error: error?.message ?? null };
    } catch {
      return { error: 'Could not reach the server. Check your connection and try again.' };
    }
  };

  const value: AuthValue = {
    isConfigured,
    isLoading,
    session,
    user: session?.user ?? null,
    isRecovery,
    linkError,
    clearLinkError: () => setLinkError(null),
    signIn,
    signUp,
    signOut,
    resendConfirmation,
    sendPasswordReset,
    updatePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
