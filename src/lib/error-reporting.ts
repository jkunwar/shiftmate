import * as Sentry from '@sentry/react-native';

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

/** Ties reports to an anonymous account id (never an email or name); null when signed out. */
export function setErrorReportingUser(userId: string | null): void {
  Sentry.setUser(userId ? { id: userId } : null);
}

/** Wraps the root component so Sentry can see crashes in the whole tree. */
export const withErrorReporting = Sentry.wrap;
