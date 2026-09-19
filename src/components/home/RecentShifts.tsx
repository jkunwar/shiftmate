import { StyleSheet, Text, View } from 'react-native';

import { SectionHeader } from '@/components/home/SectionHeader';
import { ShiftRow } from '@/components/shifts/ShiftRow';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Shift, Workplace } from '@/types';

interface RecentShiftsProps {
  shifts: Shift[];
  workplaces: Workplace[];
  onSelectShift: (shift: Shift) => void;
  onSeeAll: () => void;
}

/** The latest few shifts, or a hint to log the first one. */
export function RecentShifts({ shifts, workplaces, onSelectShift, onSeeAll }: RecentShiftsProps) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Recent shifts"
        actionLabel={shifts.length > 0 ? 'See all' : undefined}
        onAction={onSeeAll}
      />

      {shifts.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            No shifts yet. Tap + to log your first one.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {shifts.map((shift) => (
            <ShiftRow
              key={shift.id}
              shift={shift}
              workplace={workplaces.find((w) => w.id === shift.workplaceId)}
              showWorkplace
              onClick={() => onSelectShift(shift)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  list: {
    gap: 8,
  },
  empty: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
});
