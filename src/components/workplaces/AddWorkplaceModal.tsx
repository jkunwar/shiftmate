import { AlertCircle, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TimeField } from '@/components/common/DateTimeFields';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { UsualScheduleDay, Workplace } from '@/types';

interface AddWorkplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workplace: Omit<Workplace, 'id'>) => void;
  /** Pre-fills the hourly rate for a new workplace (from Settings). */
  defaultHourlyRate?: number;
  /** When set, the form edits this workplace instead of creating a new one. */
  initialWorkplace?: Workplace | null;
}

const defaultSchedule: UsualScheduleDay[] = [
  { dayOfWeek: 1, dayName: 'Monday', startTime: '16:00', endTime: '21:00', active: true },
  { dayOfWeek: 2, dayName: 'Tuesday', startTime: '16:00', endTime: '21:00', active: false },
  { dayOfWeek: 3, dayName: 'Wednesday', startTime: '16:00', endTime: '21:00', active: true },
  { dayOfWeek: 4, dayName: 'Thursday', startTime: '16:00', endTime: '21:00', active: false },
  { dayOfWeek: 5, dayName: 'Friday', startTime: '16:00', endTime: '21:00', active: true },
  { dayOfWeek: 6, dayName: 'Saturday', startTime: '10:00', endTime: '16:00', active: false },
  { dayOfWeek: 0, dayName: 'Sunday', startTime: '10:00', endTime: '16:00', active: false },
];

const PRESET_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const AddWorkplaceModal: React.FC<AddWorkplaceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultHourlyRate,
  initialWorkplace,
}) => {
  const theme = useTheme();
  const { currency } = useFormat();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [schedule, setSchedule] = useState<UsualScheduleDay[]>(defaultSchedule);
  const [errorMsg, setErrorMsg] = useState('');

  // Fill the form every time the modal opens: the workplace being edited, or blank defaults
  useEffect(() => {
    if (isOpen) {
      if (initialWorkplace) {
        setName(initialWorkplace.name);
        setAddress(initialWorkplace.address ?? '');
        setHourlyRate(initialWorkplace.hourlyRate ? initialWorkplace.hourlyRate.toFixed(2) : '');
        setNotes(initialWorkplace.notes ?? '');
        setColor(initialWorkplace.color ?? PRESET_COLORS[0]);
        setSchedule(initialWorkplace.usualSchedule ?? defaultSchedule);
      } else {
        setName('');
        setAddress('');
        setHourlyRate(defaultHourlyRate ? defaultHourlyRate.toFixed(2) : '');
        setNotes('');
        setColor(PRESET_COLORS[0]);
        setSchedule(defaultSchedule);
      }
      setErrorMsg('');
    }
  }, [isOpen, initialWorkplace, defaultHourlyRate]);

  if (!isOpen) return null;

  const toggleDayActive = (index: number) => {
    setSchedule((prev) =>
      prev.map((day, idx) => (idx === index ? { ...day, active: !day.active } : day)),
    );
  };

  const updateDayTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule((prev) =>
      prev.map((day, idx) => (idx === index ? { ...day, [field]: value } : day)),
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setErrorMsg('Workplace name is required');
      return;
    }

    // Some locales' decimal keypads produce "18,5"
    const normalizedRate = hourlyRate.trim().replace(',', '.');
    const rateNum = normalizedRate ? parseFloat(normalizedRate) : undefined;
    if (normalizedRate && (rateNum === undefined || isNaN(rateNum) || rateNum < 0)) {
      setErrorMsg('Please enter a valid hourly rate');
      return;
    }

    const badDay = schedule.find(
      (day) => day.active && !(TIME_PATTERN.test(day.startTime) && TIME_PATTERN.test(day.endTime)),
    );
    if (badDay) {
      setErrorMsg(`Enter ${badDay.dayName}'s times as HH:mm (24-hour), e.g. 16:00`);
      return;
    }

    onSave({
      name: name.trim(),
      address: address.trim() || undefined,
      hourlyRate: rateNum,
      notes: notes.trim() || undefined,
      color,
      usualSchedule: schedule,
    });

    onClose();
  };

  const inputStyle = {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    color: theme.text,
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <View style={styles.backdrop}>
          {/* Tapping outside the sheet closes it. It is a sibling rather than a parent of the sheet so it never competes with scrolling inside. */}
          <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>
                  {initialWorkplace ? 'Edit Workplace' : 'Add Workplace'}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Organize hours and custom hourly rates
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close"
                onPress={onClose}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && { backgroundColor: theme.backgroundElement },
                ]}>
                <X color={theme.textSecondary} size={20} />
              </Pressable>
            </View>

            {/* Form body */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[styles.body, { paddingBottom: 20 + insets.bottom }]}>
              {errorMsg ? (
                <View
                  style={[
                    styles.banner,
                    { backgroundColor: theme.dangerSoft, borderColor: `${theme.danger}55` },
                  ]}>
                  <AlertCircle color={theme.danger} size={16} />
                  <Text style={[styles.bannerText, { color: theme.danger }]}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Workplace name */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.text }]}>Workplace Name *</Text>
                <TextInput
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setErrorMsg('');
                  }}
                  placeholder="e.g. XYZ Restaurant, Coffee House, Library"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, inputStyle]}
                />
              </View>

              {/* Hourly rate */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.text }]}>Hourly Rate ({currency})</Text>
                <View style={styles.amountWrap}>
                  <Text style={[styles.currency, { color: theme.textSecondary }]}>{currency}</Text>
                  <TextInput
                    value={hourlyRate}
                    onChangeText={setHourlyRate}
                    placeholder="18.00"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    style={[styles.input, styles.amountInput, inputStyle]}
                  />
                </View>
              </View>

              {/* Colour badge */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.text }]}>Color Badge</Text>
                <View style={styles.swatches}>
                  {PRESET_COLORS.map((c) => {
                    const selected = color === c;
                    return (
                      <Pressable
                        key={c}
                        accessibilityRole="button"
                        accessibilityLabel={`Color ${c}`}
                        accessibilityState={{ selected }}
                        onPress={() => setColor(c)}
                        style={[
                          styles.swatch,
                          { backgroundColor: c },
                          selected
                            ? { borderColor: theme.text, transform: [{ scale: 1.15 }] }
                            : styles.swatchIdle,
                        ]}
                      />
                    );
                  })}
                </View>
              </View>

              {/* Address */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.text }]}>Address (Optional)</Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="e.g. 142 Market St, Suite 200"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, inputStyle]}
                />
              </View>

              {/* Notes */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: theme.text }]}>Notes (Optional)</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="e.g. Manager contact, locker number, dress code"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, inputStyle]}
                />
              </View>

              {/* Usual schedule (template / convenience) */}
              <View style={styles.field}>
                <View>
                  <Text style={[styles.label, { color: theme.text }]}>Usual Schedule (Template)</Text>
                  <Text style={[styles.hint, { color: theme.textSecondary }]}>
                    Pre-fills shift times for fast logging
                  </Text>
                </View>

                <View
                  style={[
                    styles.scheduleCard,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}>
                  {schedule.map((item, idx) => (
                    <View key={item.dayOfWeek} style={styles.dayRow}>
                      <View style={styles.dayName}>
                        <Switch
                          value={item.active}
                          onValueChange={() => toggleDayActive(idx)}
                          trackColor={{ false: theme.backgroundSelected, true: theme.accent }}
                          thumbColor="#ffffff"
                        />
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.dayText,
                            { color: item.active ? theme.text : theme.textSecondary },
                          ]}>
                          {item.dayName}
                        </Text>
                      </View>

                      {item.active ? (
                        <View style={styles.times}>
                          <View style={styles.timeField}>
                            <TimeField
                              compact
                              value={item.startTime}
                              onChange={(time) => updateDayTime(idx, 'startTime', time)}
                              accessibilityLabel={`${item.dayName} start time`}
                            />
                          </View>
                          <Text style={{ color: theme.textSecondary }}>–</Text>
                          <View style={styles.timeField}>
                            <TimeField
                              compact
                              value={item.endTime}
                              onChange={(time) => updateDayTime(idx, 'endTime', time)}
                              accessibilityLabel={`${item.dayName} end time`}
                            />
                          </View>
                        </View>
                      ) : (
                        <Text style={[styles.off, { color: theme.textSecondary }]}>Off</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.buttons}>
                <Pressable
                  accessibilityRole="button"
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.button,
                    styles.flex,
                    {
                      backgroundColor: pressed ? theme.backgroundElement : 'transparent',
                      borderColor: theme.border,
                    },
                  ]}>
                  <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleSubmit}
                  style={({ pressed }) => [
                    styles.button,
                    styles.flex,
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
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    width: '100%',
    maxWidth: 512,
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  closeButton: {
    padding: 6,
    borderRadius: 999,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  hint: {
    fontSize: 11,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  amountWrap: {
    justifyContent: 'center',
  },
  currency: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  amountInput: {
    paddingLeft: 30,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  swatchIdle: {
    borderColor: 'transparent',
    opacity: 0.8,
  },
  scheduleCard: {
    padding: 12,
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayName: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  times: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeField: {
    width: 76,
  },
  off: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveText: {
    fontWeight: '600',
  },
});
