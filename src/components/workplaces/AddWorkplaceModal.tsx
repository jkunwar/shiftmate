import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/common/BottomSheet';
import { FormField } from '@/components/common/FormField';
import { InlineNotice } from '@/components/common/InlineNotice';
import { MoneyInput } from '@/components/common/MoneyInput';
import { SheetHeader } from '@/components/common/SheetHeader';
import { ColorSwatches } from '@/components/workplaces/form/ColorSwatches';
import { UsualScheduleEditor } from '@/components/workplaces/form/UsualScheduleEditor';
import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { useWorkplaceForm } from '@/hooks/use-workplace-form';
import { Workplace } from '@/types';

interface AddWorkplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workplace: Omit<Workplace, 'id'>) => void;
  /** Pre-fills the hourly rate for a new workplace (from Settings). */
  defaultHourlyRate?: number;
  /** When set, the form edits this workplace instead of creating a new one. */
  initialWorkplace?: Workplace | null;
}

const AddWorkplaceForm: React.FC<Omit<AddWorkplaceModalProps, 'isOpen'>> = ({
  onClose,
  onSave,
  defaultHourlyRate,
  initialWorkplace,
}) => {
  const theme = useTheme();
  const { currency } = useFormat();
  const insets = useSafeAreaInsets();
  const form = useWorkplaceForm({ initialWorkplace, defaultHourlyRate, onSave, onClose });

  const inputStyle = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    color: theme.text,
  };

  return (
    <BottomSheet onClose={onClose}>
      <SheetHeader
        title={initialWorkplace ? 'Edit Workplace' : 'Add Workplace'}
        subtitle="Organize hours and custom hourly rates"
        onClose={onClose}
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.body, { paddingBottom: 20 + insets.bottom }]}>
        {form.errorMsg ? <InlineNotice tone="error" message={form.errorMsg} /> : null}

        <FormField label="Workplace Name *">
          <TextInput
            value={form.name}
            onChangeText={form.setName}
            placeholder="e.g. XYZ Restaurant, Coffee House, Library"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, inputStyle]}
          />
        </FormField>

        <FormField label={`Hourly Rate (${currency})`}>
          <MoneyInput value={form.hourlyRate} onChangeText={form.setHourlyRate} placeholder="18.00" />
        </FormField>

        <FormField label="Color Badge">
          <ColorSwatches value={form.color} onChange={form.setColor} />
        </FormField>

        <FormField label="Address (Optional)">
          <TextInput
            value={form.address}
            onChangeText={form.setAddress}
            placeholder="e.g. 142 Market St, Suite 200"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, inputStyle]}
          />
        </FormField>

        <FormField label="Notes (Optional)">
          <TextInput
            value={form.notes}
            onChangeText={form.setNotes}
            placeholder="e.g. Manager contact, locker number, dress code"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, inputStyle]}
          />
        </FormField>

        <FormField
          label="Usual Schedule (Template)"
          description="Pre-fills shift times for fast logging">
          <UsualScheduleEditor
            schedule={form.schedule}
            onToggleDay={form.toggleDay}
            onChangeTime={form.setDayTime}
          />
        </FormField>

        <View style={styles.buttons}>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: pressed ? theme.backgroundElement : 'transparent',
                borderColor: theme.border,
              },
            ]}>
            <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={form.submit}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: pressed ? theme.accentPressed : theme.accent,
                borderColor: 'transparent',
              },
            ]}>
            <Text style={[styles.buttonText, styles.saveText, { color: theme.onAccent }]}>
              {initialWorkplace ? 'Save Changes' : 'Save Workplace'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  body: {
    padding: 20,
    gap: 16,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  saveText: {
    fontWeight: '600',
  },
});

export const AddWorkplaceModal: React.FC<AddWorkplaceModalProps> = ({ isOpen, ...props }) =>
  isOpen ? <AddWorkplaceForm {...props} /> : null;
