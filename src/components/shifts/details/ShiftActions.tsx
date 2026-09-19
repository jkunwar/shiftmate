import { CheckCircle2, Edit3, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ShiftActionsProps {
  isPaid: boolean;
  onEdit: () => void;
  onMarkPaid: () => void;
  onMarkUnpaid: () => void;
  onDelete: () => void;
}

/** Edit, flip the payment status, or delete the shift. */
export function ShiftActions({
  isPaid,
  onEdit,
  onMarkPaid,
  onMarkUnpaid,
  onDelete,
}: ShiftActionsProps) {
  const theme = useTheme();

  return (
    <View style={styles.actions}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          onPress={onEdit}
          style={({ pressed }) => [
            styles.button,
            styles.column,
            {
              backgroundColor: pressed ? theme.backgroundElement : theme.surface,
              borderColor: theme.border,
            },
          ]}>
          <Edit3 color={theme.text} size={14} />
          <Text style={[styles.text, { color: theme.text }]}>Edit Shift</Text>
        </Pressable>

        {isPaid ? (
          <Pressable
            accessibilityRole="button"
            onPress={onMarkUnpaid}
            style={({ pressed }) => [
              styles.button,
              styles.column,
              { backgroundColor: theme.warningSoft, borderColor: `${theme.warning}55` },
              pressed && styles.pressed,
            ]}>
            <Text style={[styles.text, { color: theme.warning }]}>Mark as Unpaid</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={onMarkPaid}
            style={({ pressed }) => [
              styles.button,
              styles.column,
              { backgroundColor: theme.success, borderColor: theme.success },
              pressed && styles.pressed,
            ]}>
            <CheckCircle2 color={theme.onAccent} size={14} />
            <Text style={[styles.text, { color: theme.onAccent }]}>Mark as Paid</Text>
          </Pressable>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onDelete}
        style={({ pressed }) => [
          styles.button,
          styles.deleteButton,
          pressed && { backgroundColor: theme.dangerSoft },
        ]}>
        <Trash2 color={theme.danger} size={14} />
        <Text style={[styles.text, { color: theme.danger }]}>Delete Shift</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 8,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  column: {
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteButton: {
    borderColor: 'transparent',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.7,
  },
});
