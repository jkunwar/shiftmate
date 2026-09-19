import { ArrowLeft, Calendar as CalendarIcon, ListFilter } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useRefreshControl } from '@/components/common/refresh-control';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { AddShiftButton } from '@/components/workplaces/AddShiftButton';
import { WeekSection } from '@/components/workplaces/WeekSection';
import { WorkplaceSummaryCard } from '@/components/workplaces/WorkplaceSummaryCard';
import { BottomTabInset, FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { Shift, Workplace } from '@/types';
import { emptyMonthGroup, shiftMonthKey } from '@/utils/monthNav';
import { groupShiftsByMonthAndWeek } from '@/utils/timeCalculations';
import { CalendarView } from './CalendarView';

interface WorkplaceWorkLogScreenProps {
  workplace: Workplace;
  shifts: Shift[];
  onBack: () => void;
  onAddShift: (workplaceId: string) => void;
  onSelectShift: (shift: Shift) => void;
  onDeleteWorkplace: (workplaceId: string) => void;
  onEditWorkplace?: (workplace: Workplace) => void;
  /** Which day weeks start on when grouping shifts. Defaults to Monday. */
  weekStartsOn?: 'monday' | 'sunday';
  /** Pull-to-refresh handler (syncs with the cloud). Omit to turn the gesture off. */
  onRefresh?: () => Promise<void>;
}

export const WorkplaceWorkLogScreen: React.FC<WorkplaceWorkLogScreenProps> = ({
  onRefresh,
  workplace,
  shifts,
  onBack,
  onAddShift,
  onSelectShift,
  onDeleteWorkplace,
  onEditWorkplace,
  weekStartsOn = 'monday',
}) => {
  const theme = useTheme();
  const refreshControl = useRefreshControl(onRefresh);
  const insets = useSafeAreaInsets();

  // Starts on the current month
  const todayMonthKey = useToday().slice(0, 7);
  const [selectedMonthKey, setSelectedMonthKey] = useState(todayMonthKey);
  const [viewMode, setViewMode] = useState<'log' | 'calendar'>('log');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [collapsedWeeks, setCollapsedWeeks] = useState<Record<number, boolean>>({});

  const workplaceShifts = useMemo(
    () => shifts.filter((s) => s.workplaceId === workplace.id),
    [shifts, workplace.id],
  );

  // Month -> week -> shifts
  const monthGroups = useMemo(
    () => groupShiftsByMonthAndWeek(workplaceShifts, workplace, weekStartsOn),
    [workplaceShifts, workplace, weekStartsOn],
  );

  const month =
    monthGroups.find((m) => m.monthKey === selectedMonthKey) ?? emptyMonthGroup(selectedMonthKey);

  const toggleWeek = (weekNumber: number) =>
    setCollapsedWeeks((prev) => ({ ...prev, [weekNumber]: !prev[weekNumber] }));

  return (
    <>
      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: BottomTabInset + insets.bottom + 16 },
        ]}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            hitSlop={8}
            style={styles.backButton}>
            <ArrowLeft color={theme.textSecondary} size={16} />
            <Text style={[styles.backText, { color: theme.textSecondary }]}>Workplaces</Text>
          </Pressable>

          <SegmentedControl
            options={[
              { value: 'log', label: 'Work Log', icon: ListFilter },
              { value: 'calendar', label: 'Calendar', icon: CalendarIcon },
            ]}
            value={viewMode}
            onChange={setViewMode}
          />
        </View>

        <WorkplaceSummaryCard
          workplace={workplace}
          month={month}
          onPreviousMonth={() => setSelectedMonthKey(shiftMonthKey(selectedMonthKey, -1))}
          onNextMonth={() => setSelectedMonthKey(shiftMonthKey(selectedMonthKey, 1))}
          onEdit={onEditWorkplace ? () => onEditWorkplace(workplace) : undefined}
          onDelete={() => setConfirmingDelete(true)}
        />

        <AddShiftButton workplaceName={workplace.name} onPress={() => onAddShift(workplace.id)} />

        {viewMode === 'calendar' ? (
          <CalendarView
            shifts={workplaceShifts}
            workplace={workplace}
            currentYearMonth={selectedMonthKey}
            onChangeMonth={setSelectedMonthKey}
            onSelectShift={onSelectShift}
          />
        ) : month.weeks.length === 0 ? (
          <EmptyState
            type="shifts"
            title={`No shifts in ${month.monthLabel}`}
            description="Record your hours to see your weekly breakdown."
            actionLabel="Add Shift"
            onAction={() => onAddShift(workplace.id)}
          />
        ) : (
          <View>
            {month.weeks.map((week) => (
              <WeekSection
                key={week.weekNumber}
                week={week}
                collapsed={!!collapsedWeeks[week.weekNumber]}
                onToggle={() => toggleWeek(week.weekNumber)}
                onSelectShift={onSelectShift}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmationDialog
        isOpen={confirmingDelete}
        title={`Delete ${workplace.name}?`}
        message="This workplace and all its associated shift records will be permanently removed."
        confirmLabel="Delete Workplace"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => {
          setConfirmingDelete(false);
          onDeleteWorkplace(workplace.id);
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});
