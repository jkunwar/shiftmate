import * as Sentry from '@sentry/react-native';

import { classifyDatabaseError, createOncePerKey } from '@/lib/database-errors';

const dsn = (process.env.EXPO_PUBLIC_SENTRY_DSN ?? '').trim();

/** Reports go to Sentry only from real builds with a DSN; development just logs to the console. */
const enabled = Boolean(dsn) && !__DEV__;

/**
 * Starts crash reporting. Call once, before anything renders. Sentry also catches uncaught JS
 * errors, unhandled promise rejections and native crashes on its own.
 *
 * ShiftMate holds people's pay data, so nothing personal is sent: no emails or IP addresses, no
 * console output, no screenshots. Reports carry only the error, where it happened and an anonymous
 * account id.
 */
export function initErrorReporting(): void {
  Sentry.init({
    dsn,
    enabled,
    environment: __DEV__ ? 'development' : 'production',
    sendDefaultPii: false,
    attachScreenshot: false,
    // Performance tracing isn't needed for error tracking, and keeps the quota for errors
    tracesSampleRate: 0,
    // Console lines can contain shift or workplace details
    beforeBreadcrumb: (breadcrumb) => (breadcrumb.category === 'console' ? null : breadcrumb),
    beforeSend: (event) => {
      if (event.user) event.user = { id: event.user.id };
      return event;
    },
  });
}

/** Records an unexpected error. `context` says where it happened, e.g. "session-read". */
export function reportError(error: unknown, context?: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(context ? `[${context}]` : '[error]', err);
  if (enabled) Sentry.captureException(err, context ? { tags: { context } } : undefined);
}

const firstTime = createOncePerKey();

/**
 * Records a failed database call. Normal trouble (offline, expired session, server hiccup) becomes
 * a breadcrumb, which only adds context to a later real error. Data, permission and schema errors
 * become one Sentry event per kind per app session.
 *
 * Only the operation and the error code are sent, never the message or details: Postgres errors can
 * quote the offending row, which here could hold shift notes, workplace names or pay amounts.
 */
export function reportDatabaseError(error: unknown, operation: string): void {
  const { kind, code } = classifyDatabaseError(error);
  console.warn(`[database:${operation}]`, error);
  if (!enabled) return;

  Sentry.addBreadcrumb({
    category: 'database',
    level: 'warning',
    message: `${operation} failed (${code})`,
    data: { operation, code },
  });

  if (kind !== 'report' || !firstTime(`${operation}:${code}`)) return;
  Sentry.captureMessage(`Database error ${code} in ${operation}`, {
    level: 'error',
    tags: { context: 'database', operation, code },
    // Group by what failed and how, whatever the wording of the message
    fingerprint: ['database', operation, code],
  });
}

/** Ties reports to an anonymous account id (never an email or name); null when signed out. */
export function setErrorReportingUser(userId: string | null): void {
  Sentry.setUser(userId ? { id: userId } : null);
}

/** Wraps the root component so Sentry can see crashes in the whole tree. */
export const withErrorReporting = Sentry.wrap;
