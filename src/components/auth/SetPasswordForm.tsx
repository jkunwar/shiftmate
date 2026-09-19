import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner, Field, PrimaryButton } from '@/components/auth/auth-ui';
import { useAuth } from '@/lib/auth';

/** New password + confirmation. Used for password recovery and for changing it from Settings. */
export function SetPasswordForm({
  submitLabel = 'Update Password',
  onSuccess,
}: {
  submitLabel?: string;
  onSuccess?: () => void;
}) {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setSuccessMsg('');
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    const { error } = await updatePassword(password);
    setIsLoading(false);

    if (error) {
      setErrorMsg(error);
      return;
    }
    setPassword('');
    setConfirmPassword('');
    setSuccessMsg('Password updated');
    onSuccess?.();
  };

  return (
    <View style={styles.form}>
      {errorMsg ? <Banner tone="error" message={errorMsg} /> : null}
      {successMsg ? <Banner tone="success" message={successMsg} /> : null}
      <Field
        label="New Password"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
      />
      <Field
        label="Confirm New Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="••••••••"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
      />
      <PrimaryButton
        label={submitLabel}
        loadingLabel="Updating..."
        isLoading={isLoading}
        onPress={handleSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
});
