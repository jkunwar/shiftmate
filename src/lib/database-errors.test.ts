import { classifyDatabaseError, createOncePerKey } from './database-errors';

describe('classifyDatabaseError', () => {
  it('treats being offline or timing out as context only', () => {
    expect(classifyDatabaseError(new TypeError('Network request failed'))).toEqual({
      kind: 'breadcrumb',
      code: 'network',
    });
    expect(classifyDatabaseError({ message: 'TypeError: Failed to fetch' }).kind).toBe('breadcrumb');
    expect(classifyDatabaseError({ message: 'The request timed out' }).kind).toBe('breadcrumb');
    const abort = Object.assign(new Error('x'), { name: 'AbortError' });
    expect(classifyDatabaseError(abort)).toEqual({ kind: 'breadcrumb', code: 'network' });
  });

  it('treats expired or missing sessions as context only', () => {
    expect(classifyDatabaseError({ code: 'PGRST301', message: 'JWT expired' })).toEqual({
      kind: 'breadcrumb',
      code: 'auth',
    });
    expect(classifyDatabaseError({ status: 401, message: 'Unauthorized' }).code).toBe('auth');
  });

  it('treats server hiccups as context only', () => {
    expect(classifyDatabaseError({ status: 503, message: 'Service Unavailable' })).toEqual({
      kind: 'breadcrumb',
      code: 'http_503',
    });
  });

  it('reports data, permission and schema errors with their code', () => {
    for (const code of ['23514', '23503', '22P02', '42501', '42703', '42P01', 'PGRST204', 'PGRST202']) {
      expect(classifyDatabaseError({ code, message: 'boom' })).toEqual({ kind: 'report', code });
    }
  });

  it('reports what it does not recognise, without inventing a code', () => {
    expect(classifyDatabaseError({ status: 400, message: 'Bad request' })).toEqual({
      kind: 'report',
      code: 'http_400',
    });
    expect(classifyDatabaseError(new Error('weird'))).toEqual({ kind: 'report', code: 'unknown' });
    expect(classifyDatabaseError(null)).toEqual({ kind: 'report', code: 'unknown' });
  });

  it('never puts the error message into the code', () => {
    const result = classifyDatabaseError({
      code: '23514',
      message: 'Failing row contains (Cafe, 24.00, secret notes)',
      details: 'Key (user_id)=(abc) ...',
    });
    expect(JSON.stringify(result)).not.toMatch(/secret|Failing|abc/);
  });
});

describe('createOncePerKey', () => {
  it('lets a key through once', () => {
    const once = createOncePerKey();
    expect(once('a')).toBe(true);
    expect(once('a')).toBe(false);
    expect(once('b')).toBe(true);
  });
});
