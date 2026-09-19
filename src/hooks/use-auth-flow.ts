import { useState } from 'react';

import { useAuth } from '@/lib/auth';
import { validateResetEmail, validateSignIn, validateSignUp } from '@/utils/authForm';

export type AuthStep = 'welcome' | 'signup' | 'signin' | 'forgot' | 'confirm';

/**
 * The state and actions behind the welcome / sign up / sign in / forgot password / confirm-email
 * screens. Signing in swaps the app in through AuthGate, so there is nothing to navigate to.
 */
export function useAuthFlow() {
  const { signIn, signUp, resendConfirmation, sendPasswordReset, linkError, clearLinkError } =
    useAuth();

  const [step, setStep] = useState<AuthStep>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const goToStep = (next: AuthStep) => {
    setErrorMsg('');
    setInfoMsg('');
    clearLinkError();
    setStep(next);
  };

  const createAccount = async () => {
    const problem = validateSignUp({ name, email, password, confirmPassword });
    if (problem) {
      setErrorMsg(problem);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    const { error, needsConfirmation } = await signUp(name, email, password);
    setIsLoading(false);

    if (error) {
      setErrorMsg(error);
      return;
    }
    // Without confirmation the new session is picked up and AuthGate shows the app
    if (needsConfirmation) setStep('confirm');
  };

  const signInWithPassword = async () => {
    const problem = validateSignIn({ email, password });
    if (problem) {
      setErrorMsg(problem);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    clearLinkError();
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) setErrorMsg(error);
  };

  const requestPasswordReset = async () => {
    const problem = validateResetEmail(email);
    if (problem) {
      setErrorMsg(problem);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');
    const { error } = await sendPasswordReset(email);
    setIsLoading(false);

    if (error) setErrorMsg(error);
    else setInfoMsg('If an account exists for that email, a reset link is on its way.');
  };

  const resendConfirmationEmail = async () => {
    setIsLoading(true);
    setErrorMsg('');
    setInfoMsg('');
    const { error } = await resendConfirmation(email);
    setIsLoading(false);

    if (error) setErrorMsg(error);
    else setInfoMsg('Confirmation email sent again.');
  };

  return {
    step,
    goToStep,
    // fields
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    // feedback
    linkError,
    errorMsg,
    infoMsg,
    isLoading,
    // actions
    createAccount,
    signInWithPassword,
    requestPasswordReset,
    resendConfirmationEmail,
  };
}

export type AuthFlow = ReturnType<typeof useAuthFlow>;
