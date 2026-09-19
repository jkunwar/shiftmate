import { looksLikeEmail, validateResetEmail, validateSignIn, validateSignUp } from './authForm';

const good = { name: 'Ada', email: 'ada@example.com', password: 'secret1', confirmPassword: 'secret1' };

describe('validateSignUp', () => {
  it('accepts a complete form', () => {
    expect(validateSignUp(good)).toBeNull();
  });

  it('reports the first problem, in order', () => {
    expect(validateSignUp({ ...good, name: '  ' })).toBe('Name is required');
    expect(validateSignUp({ ...good, name: '', email: 'nope' })).toBe('Name is required');
    expect(validateSignUp({ ...good, email: 'nope' })).toBe('Please enter a valid email address');
    expect(validateSignUp({ ...good, password: '12345', confirmPassword: '12345' })).toBe(
      'Password must be at least 6 characters',
    );
    expect(validateSignUp({ ...good, confirmPassword: 'different' })).toBe('Passwords do not match');
  });

  it('allows a password of exactly six characters', () => {
    expect(validateSignUp({ ...good, password: '123456', confirmPassword: '123456' })).toBeNull();
  });
});

describe('validateSignIn', () => {
  it('needs an email and a password', () => {
    expect(validateSignIn({ email: 'a@b.co', password: 'x' })).toBeNull();
    expect(validateSignIn({ email: ' ', password: 'x' })).toBe('Please enter your email');
    expect(validateSignIn({ email: 'a@b.co', password: '' })).toBe('Please enter your password');
  });
});

describe('validateResetEmail', () => {
  it('needs something that looks like an email', () => {
    expect(validateResetEmail('a@b.co')).toBeNull();
    expect(validateResetEmail('')).toBe('Enter the email address of your account');
    expect(validateResetEmail('ab.co')).toBe('Enter the email address of your account');
  });
});

describe('looksLikeEmail', () => {
  it('requires text with an @', () => {
    expect(looksLikeEmail('a@b')).toBe(true);
    expect(looksLikeEmail('   ')).toBe(false);
    expect(looksLikeEmail('abc')).toBe(false);
  });
});
