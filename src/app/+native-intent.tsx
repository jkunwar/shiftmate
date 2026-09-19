/**
 * Email links (confirm sign-up, reset password) open the app at `<scheme>://auth-callback#tokens`.
 * The tokens are consumed by AuthProvider; this keeps Expo Router from treating the link as an
 * unmatched route and sends it to the home route instead.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (path.includes('auth-callback')) return '/';
    return path;
  } catch {
    return '/';
  }
}
