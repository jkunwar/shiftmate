import { StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { User } from '@/types';
import { initialsOf } from '@/utils/settings';

/** The signed-in person: an initials avatar, their name and email. */
export function ProfileSummary({ user }: { user: User }) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
        <Text style={[styles.avatarText, { color: theme.accent }]}>{initialsOf(user.name)}</Text>
      </View>
      <View style={styles.text}>
        <Text numberOfLines={1} style={[styles.name, { color: theme.text }]}>
          {user.name}
        </Text>
        <Text numberOfLines={1} style={[styles.email, { color: theme.textSecondary }]}>
          {user.email}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  text: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  email: {
    fontSize: FontSize.xs,
  },
});
