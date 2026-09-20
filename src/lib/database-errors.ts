/**
 * Sorting database errors into ones worth a Sentry event and ones that are only context.
 *
 * Offline, timeouts, expired sessions and server hiccups are normal for a phone app that retries,
 * so they must not create issues. A constraint, permission or schema error means something is
 * broken (or a change was lost), so those do.
 */
export type DatabaseErrorKind = 'report' | 'breadcrumb';

export interface ClassifiedDatabaseError {
  kind: DatabaseErrorKind;
  /** Postgres/PostgREST code, or a short label such as "network". Safe to send: never row data. */
  code: string;
}

// PostgREST: JWT expired, JWT invalid, anonymous access disabled
const AUTH_CODES = new Set(['PGRST301', 'PGRST302', 'PGRST303']);

const NETWORK_PATTERN = /network request failed|failed to fetch|network error|timed? ?out|aborted|load failed/i;

function read(error: unknown): { code?: string; status?: number; message: string; name: string } {
  const e = (error ?? {}) as { code?: unknown; status?: unknown; message?: unknown; name?: unknown };
  return {
    code: typeof e.code === 'string' && e.code ? e.code : undefined,
    status: typeof e.status === 'number' ? e.status : undefined,
    message: typeof e.message === 'string' ? e.message : String(error ?? ''),
    name: typeof e.name === 'string' ? e.name : '',
  };
}

export function classifyDatabaseError(error: unknown): ClassifiedDatabaseError {
  const { code, status, message, name } = read(error);

  if (name === 'AbortError' || NETWORK_PATTERN.test(message)) {
    return { kind: 'breadcrumb', code: 'network' };
  }
  if ((code && AUTH_CODES.has(code)) || status === 401) {
    return { kind: 'breadcrumb', code: 'auth' };
  }
  if (status !== undefined && status >= 500) {
    return { kind: 'breadcrumb', code: `http_${status}` };
  }
  if (code) return { kind: 'report', code };
  if (status !== undefined && status > 0) return { kind: 'report', code: `http_${status}` };
  return { kind: 'report', code: 'unknown' };
}

/** Returns a function that is true the first time it sees a key and false after that. */
export function createOncePerKey() {
  const seen = new Set<string>();
  return (key: string) => {
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };
}
