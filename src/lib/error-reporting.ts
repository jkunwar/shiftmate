/**
 * Single place every unexpected error passes through. It only logs for now; to add crash reporting
 * (Sentry, Bugsnag…), initialise the SDK in `installGlobalErrorHandler` and forward from `reportError`.
 */
export function reportError(error: unknown, context?: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(context ? `[${context}]` : '[error]', err);
}

type GlobalErrorHandler = (error: unknown, isFatal?: boolean) => void;

interface ErrorUtilsShape {
  getGlobalHandler: () => GlobalErrorHandler;
  setGlobalHandler: (handler: GlobalErrorHandler) => void;
}

let installed = false;

/** Reports uncaught JS errors, then hands them to React Native's default handler. */
export function installGlobalErrorHandler(): void {
  const errorUtils = (globalThis as { ErrorUtils?: ErrorUtilsShape }).ErrorUtils;
  if (installed || !errorUtils) return;
  installed = true;

  const previous = errorUtils.getGlobalHandler();
  errorUtils.setGlobalHandler((error, isFatal) => {
    reportError(error, isFatal ? 'fatal' : 'uncaught');
    previous(error, isFatal);
  });
}
