import { Moon, Sliders, Sun } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { SegmentedControl } from '@/components/common/SegmentedControl';
import { PreferenceRow } from '@/components/settings/PreferenceRow';
import { SectionCard } from '@/components/settings/SectionCard';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { UserPreferences } from '@/types';
import { parseDefaultRate } from '@/utils/settings';

interface PreferencesSectionProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
}

/** Rate, week start, clock, currency and theme. Everything saves as soon as it changes. */
export function PreferencesSection({ preferences, onUpdatePreferences }: PreferencesSectionProps) {
  const theme = useTheme();
  const [defaultRate, setDefaultRate] = useState(preferences.defaultHourlyRate.toString());

  // Saved when the field loses focus, so it doesn't depend on any button
  const saveRate = () => {
    const edit = parseDefaultRate(defaultRate, preferences.defaultHourlyRate);
    if (edit.kind === 'save') onUpdatePreferences({ defaultHourlyRate: edit.rate });
    if (edit.kind === 'revert') setDefaultRate(preferences.defaultHourlyRate.toString());
  };

  return (
    <SectionCard icon={Sliders} title="Preferences">
      <PreferenceRow first title="Default Hourly Rate" description="Applied to new workplaces">
        <View style={styles.rateWrap}>
          <Text style={[styles.currency, { color: theme.textSecondary }]}>{preferences.currency}</Text>
          <TextInput
            value={defaultRate}
            onChangeText={setDefaultRate}
            onEndEditing={saveRate}
            keyboardType="decimal-pad"
            style={[
              styles.rateInput,
              { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
            ]}
          />
        </View>
      </PreferenceRow>

      <PreferenceRow title="Week Starts On" description="Calendar and weekly grouping">
        <SegmentedControl
          selectedTone="accent"
          options={[
            { value: 'monday', label: 'Monday' },
            { value: 'sunday', label: 'Sunday' },
          ]}
          value={preferences.weekStartsOn}
          onChange={(weekStartsOn) => onUpdatePreferences({ weekStartsOn })}
        />
      </PreferenceRow>

      <PreferenceRow title="Time Format" description="12-hour or 24-hour clock">
        <SegmentedControl
          selectedTone="accent"
          options={[
            { value: '12h', label: '12h' },
            { value: '24h', label: '24h' },
          ]}
          value={preferences.timeFormat}
          onChange={(timeFormat) => onUpdatePreferences({ timeFormat })}
        />
      </PreferenceRow>

      <PreferenceRow title="Currency" description="Symbol shown next to amounts">
        <SegmentedControl
          selectedTone="accent"
          options={[
            { value: '$', label: '$' },
            { value: '€', label: '€' },
            { value: '£', label: '£' },
            { value: '¥', label: '¥' },
            { value: '₹', label: '₹' },
          ]}
          value={preferences.currency}
          onChange={(currency) => onUpdatePreferences({ currency })}
        />
      </PreferenceRow>

      <PreferenceRow title="Dark Mode" description="Toggle interface color theme">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle dark mode"
          onPress={() => onUpdatePreferences({ darkMode: !preferences.darkMode })}
          style={[
            styles.themeToggle,
            {
              backgroundColor: preferences.darkMode
                ? theme.backgroundSelected
                : theme.backgroundElement,
              borderColor: theme.border,
            },
          ]}>
          {preferences.darkMode ? (
            <Moon color={theme.warning} size={16} />
          ) : (
            <Sun color={theme.textSecondary} size={16} />
          )}
        </Pressable>
      </PreferenceRow>
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  rateWrap: {
    width: 96,
    justifyContent: 'center',
  },
  currency: {
    position: 'absolute',
    left: 10,
    zIndex: 1,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  rateInput: {
    paddingLeft: 24,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textAlign: 'right',
  },
  themeToggle: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
});
