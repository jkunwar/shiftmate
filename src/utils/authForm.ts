/** The first problem with the sign-up form, as a message, or null when it can be submitted. */
export function validateSignUp(values: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): string | null {
  if (!values.name.trim()) return 'Name is required';
  if (!looksLikeEmail(values.email)) return 'Please enter a valid email address';
  if (values.password.length < 6) return 'Password must be at least 6 characters';
  if (values.password !== values.confirmPassword) return 'Passwords do not match';
  return null;
}

export function validateSignIn(values: { email: string; password: string }): string | null {
  if (!values.email.trim()) return 'Please enter your email';
  if (!values.password) return 'Please enter your password';
  return null;
}

export function validateResetEmail(email: string): string | null {
  return looksLikeEmail(email) ? null : 'Enter the email address of your account';
}

/** A light check that catches typos; the server does the real validation. */
export const looksLikeEmail = (email: string) => Boolean(email.trim()) && email.includes('@');
