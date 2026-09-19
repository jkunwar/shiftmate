import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { toLocalDateString } from '@/utils/timeCalculations';

/**
 * Tap-to-pick date and time fields. Values stay plain strings ("YYYY-MM-DD" and "HH:mm") so they
 * drop straight into the existing form state.
 *  - Android: the system date/time dialog.
 *  - iOS: a bottom sheet with a spinner and a Done button.
 *  - Web: the native pickers aren't available, so it falls back to a typed field.
 */

interface FieldProps {
  value: string;
  onChange: (value: string) => void;
  /** Turns the border red (only reachable on web, where the value is typed). */
  invalid?: boolean;
  /** Smaller field without an icon, for dense rows. */
  compact?: boolean;
  accessibilityLabel?: string;
}

type Mode = 'date' | 'time';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return new Date();
  const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function parseTime(value: string): Date {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  const result = new Date();
  result.setHours(match ? Number(match[1]) : 9, match ? Number(match[2]) : 0, 0, 0);
  return result;
}

function toTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function displayDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const date = parseDate(value);
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function PickerField({
  mode,
  value,
  onChange,
  invalid,
  compact,
  accessibilityLabel,
}: FieldProps & { mode: Mode }) {
  const theme = useTheme();
  const { time } = useFormat();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(new Date());

  const toValue = (date: Date) => (mode === 'date' ? toLocalDateString(date) : toTimeString(date));
  const toDate = (v: string) => (mode === 'date' ? parseDate(v) : parseTime(v));

  const fieldStyle = [
    styles.field,
    compact && styles.fieldCompact,
    {
      backgroundColor: theme.surface,
      borderColor: invalid ? theme.danger : theme.border,
    },
  ];

  // Web: no native picker, so keep a typed field
  if (Platform.OS === 'web') {
    return (
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={mode === 'date' ? 'YYYY-MM-DD' : 'HH:mm'}
        placeholderTextColor={theme.textSecondary}
        maxLength={mode === 'date' ? 10 : 5}
        accessibilityLabel={accessibilityLabel}
        style={[...fieldStyle, styles.text, compact && styles.textCompact, { color: theme.text }]}
      />
    );
  }

  const label = mode === 'date' ? displayDate(value) : value ? time(value) : '';
  const Icon = mode === 'date' ? Calendar : Clock;

  const open = () => {
    const current = toDate(value);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode,
        is24Hour: false,
        // Only fires when the user confirms; dismissing the dialog changes nothing
        onValueChange: (_event, selected) => onChange(toValue(selected)),
      });
    } else {
      setDraft(current);
      setSheetOpen(true);
    }
  };

  const closeSheet = () => setSheetOpen(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={open}
        style={({ pressed }) => [...fieldStyle, pressed && { backgroundColor: theme.backgroundElement }]}>
        <Text
          numberOfLines={1}
          style={[
            styles.text,
            compact && styles.textCompact,
            { color: label ? theme.text : theme.textSecondary },
          ]}>
          {label || (mode === 'date' ? 'Select date' : 'Select time')}
        </Text>
        {compact ? null : <Icon color={theme.textSecondary} size={16} />}
      </Pressable>

      {/* iOS only: Android uses the system dialog above */}
      <Modal
        visible={sheetOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeSheet}>
        <View style={styles.backdrop}>
          {/* Tapping outside the sheet closes it. It is a sibling rather than a parent of the sheet so it never competes with scrolling inside. */}
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={closeSheet} />
          <View style={[
              styles.sheet,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                paddingBottom: insets.bottom + 12,
              },
            ]}>
            <View style={styles.sheetHeader}>
              <Pressable accessibilityRole="button" onPress={closeSheet} hitSlop={8}>
                <Text style={[styles.sheetAction, { color: theme.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>
                {mode === 'date' ? 'Select Date' : 'Select Time'}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onChange(toValue(draft));
                  closeSheet();
                }}
                hitSlop={8}>
                <Text style={[styles.sheetAction, styles.sheetDone, { color: theme.accent }]}>
                  Done
                </Text>
              </Pressable>
            </View>

            <DateTimePicker
              value={draft}
              mode={mode}
              display="spinner"
              themeVariant={scheme}
              textColor={theme.text}
              onValueChange={(_event, selected) => setDraft(selected)}
              style={styles.picker}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

export function DateField(props: FieldProps) {
  return <PickerField mode="date" {...props} />;
}

export function TimeField(props: FieldProps) {
  return <PickerField mode="time" {...props} />;
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  fieldCompact: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  text: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  textCompact: {
    fontSize: 12,
    textAlign: 'center',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  sheetAction: {
    fontSize: 14,
  },
  sheetDone: {
    fontWeight: '700',
  },
  picker: {
    alignSelf: 'center',
    width: '100%',
  },
});
