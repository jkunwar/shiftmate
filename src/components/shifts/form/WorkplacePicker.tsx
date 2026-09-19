import { Sparkles } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { softChipStyle } from '@/components/shifts/form/soft-chip';
import { FormField } from '@/components/common/FormField';
import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Workplace } from '@/types';
import { workplaceColor } from '@/utils/workplaceColor';

interface WorkplacePickerProps {
  workplaces: Workplace[];
  selectedId: string;
  onSelect: (workplace: Workplace) => void;
  /** Offers to fill the times from the selected workplace's usual schedule. */
  canQuickFill: boolean;
  onQuickFill: () => void;
}

/** Choose the workplace for a shift, with a shortcut to its usual hours. */
export function WorkplacePicker({
  workplaces,
  selectedId,
  onSelect,
  canQuickFill,
  onQuickFill,
}: WorkplacePickerProps) {
  const theme = useTheme();
  const { currency } = useFormat();

  return (
    <FormField label="Workplace">
      <View style={styles.wrap}>
        {workplaces.map((wp) => {
          const selected = wp.id === selectedId;
          return (
            <Pressable
              key={wp.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onSelect(wp)}
              style={[styles.chip, softChipStyle(theme, selected)]}>
              <View style={[styles.dot, { backgroundColor: workplaceColor(wp.color, theme.accent) }]} />
              <Text
                style={[
                  styles.chipText,
                  { color: selected ? theme.accent : theme.text },
                  selected && styles.chipTextSelected,
                ]}>
                {wp.name}
                {wp.hourlyRate ? ` (${currency}${wp.hourlyRate.toFixed(2)}/hr)` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {canQuickFill ? (
        <Pressable accessibilityRole="button" onPress={onQuickFill} style={styles.quickFill}>
          <Sparkles color={theme.accent} size={12} />
          <Text style={[styles.quickFillText, { color: theme.accent }]}>
            Quick fill regular schedule
          </Text>
        </Pressable>
      ) : null}
    </FormField>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  chipTextSelected: {
    fontWeight: '600',
  },
  quickFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  quickFillText: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
});
