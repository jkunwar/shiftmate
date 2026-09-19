import { Check, User as UserIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { FormField } from '@/components/common/FormField';
import { SectionCard } from '@/components/settings/SectionCard';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useTimedFlag } from '@/hooks/use-timed-flag';
import { User } from '@/types';

interface AccountDetailsSectionProps {
  user: User;
  onUpdateUser: (updates: Partial<User>) => void;
}

/** Edit the name and email, with a brief "Changes saved" confirmation. */
export function AccountDetailsSection({ user, onUpdateUser }: AccountDetailsSectionProps) {
  const theme = useTheme();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [savedNotice, showSavedNotice] = useTimedFlag(2500);

  const save = () => {
    onUpdateUser({ name: name.trim() || user.name, email: email.trim() || user.email });
    showSavedNotice();
  };

  const inputStyle = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    color: theme.text,
  };

  return (
    <SectionCard icon={UserIcon} title="Account Details">
      {savedNotice ? (
        <View
          style={[
            styles.notice,
            { backgroundColor: theme.successSoft, borderColor: `${theme.success}55` },
          ]}>
          <Check color={theme.success} size={16} />
          <Text style={[styles.noticeText, { color: theme.success }]}>Changes saved</Text>
        </View>
      ) : null}

      <FormField label="Name">
        <TextInput
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          style={[styles.input, inputStyle]}
        />
      </FormField>

      <FormField label="Email">
        <TextInput
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, inputStyle]}
        />
      </FormField>

      <Pressable
        accessibilityRole="button"
        onPress={save}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: pressed ? theme.accentPressed : theme.accent },
        ]}>
        <Text style={[styles.buttonText, { color: theme.onAccent }]}>Save Changes</Text>
      </Pressable>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  button: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
