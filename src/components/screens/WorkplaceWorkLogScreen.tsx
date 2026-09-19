import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListFilter,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmationDialog } from '@/components/common/ConfirmationDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ShiftRow } from '@/components/shifts/ShiftRow';
import { BottomTabInset } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useRefreshControl } from '@/components/common/refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { Shift, Workplace } from '@/types';
import { monthName } from '@/utils/dateRanges';
import { formatDuration, groupShiftsByMonthAndWeek } from '@/utils/timeCalculations';
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

function monthLabelFor(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  return `${monthName(month - 1) || monthKey} ${year}`;
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
  const { money } = useFormat();
  const insets = useSafeAreaInsets();

  // Starts on the current month
  const todayMonthKey = useToday().slice(0, 7);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(todayMonthKey);
  const [viewMode, setViewMode] = useState<'log' | 'calendar'>('log');
  const [showDeleteWpConfirm, setShowDeleteWpConfirm] = useState(false);

  // Keep track of collapsed weeks
  const [collapsedWeeks, setCollapsedWeeks] = useState<Record<number, boolean>>({});

  // Filter shifts specifically for this workplace
  const workplaceShifts = useMemo(() => {
    return shifts.filter((s) => s.workplaceId === workplace.id);
  }, [shifts, workplace.id]);

  // Group by month -> week -> shifts
  const monthGroups = useMemo(() => {
    return groupShiftsByMonthAndWeek(workplaceShifts, workplace, weekStartsOn);
  }, [workplaceShifts, workplace, weekStartsOn]);

  // Current month group
  const currentMonthGroup = monthGroups.find((m) => m.monthKey === selectedMonthKey) || {
    monthKey: selectedMonthKey,
    monthLabel: monthLabelFor(selectedMonthKey),
    totalMinutes: 0,
    totalEarnings: 0,
    shiftCount: 0,
    unpaidMinutes: 0,
    unpaidEarnings: 0,
    weeks: [],
  };

  const toggleWeekCollapse = (weekNum: number) => {
    setCollapsedWeeks((prev) => ({ ...prev, [weekNum]: !prev[weekNum] }));
  };

  // Month navigation
  const shiftMonth = (delta: -1 | 1) => {
    const [yearStr, monthStr] = selectedMonthKey.split('-');
    let y = parseInt(yearStr, 10);
    let m = parseInt(monthStr, 10) + delta;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedMonthKey(`${y}-${String(m).padStart(2, '0')}`);
  };

  const cardStyle = { backgroundColor: theme.surface, borderColor: theme.border };

  return (
    <>
      <ScrollView
        refreshControl={refreshControl}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: BottomTabInset + insets.bottom + 16 },
        ]}>
        {/* Top header navigation */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            hitSlop={8}
            style={styles.backButton}>
            <ArrowLeft color={theme.textSecondary} size={16} />
            <Text style={[styles.backText, { color: theme.textSecondary }]}>Workplaces</Text>
          </Pressable>

          {/* View mode toggle: log vs calendar */}
          <SegmentedControl
            options={[
              { value: 'log', label: 'Work Log', icon: ListFilter },
              { value: 'calendar', label: 'Calendar', icon: CalendarIcon },
            ]}
            value={viewMode}
            onChange={setViewMode}
          />
        </View>

        {/* Workplace summary hero card */}
        <View style={[styles.hero, cardStyle]}>
          <View style={styles.heroTop}>
            <View style={styles.heroTitle}>
              <View
                style={[styles.colorBar, { backgroundColor: workplace.color || theme.accent }]}
              />
              <View style={styles.flex}>
                <Text numberOfLines={1} style={[styles.workplaceName, { color: theme.text }]}>
                  {workplace.name}
                </Text>
                {workplace.address ? (
                  <View style={styles.address}>
                    <MapPin color={theme.textSecondary} size={12} />
                    <Text
                      numberOfLines={1}
                      style={[styles.addressText, { color: theme.textSecondary }]}>
                      {workplace.address}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {onEditWorkplace ? (
              <Pressable
                accessibilityLabel="Edit workplace"
                onPress={() => onEditWorkplace(workplace)}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && { backgroundColor: theme.backgroundElement },
                ]}>
                <Pencil color={theme.textSecondary} size={16} />
              </Pressable>
            ) : null}

            <Pressable
              accessibilityLabel="Delete workplace"
              onPress={() => setShowDeleteWpConfirm(true)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && { backgroundColor: theme.dangerSoft },
              ]}>
              {({ pressed }) => (
                <Trash2 color={pressed ? theme.danger : theme.textSecondary} size={16} />
              )}
            </Pressable>
          </View>

          {/* Month selector bar */}
          <View style={[styles.monthBar, { borderTopColor: theme.border }]}>
            <Pressable
              accessibilityLabel="Previous month"
              onPress={() => shiftMonth(-1)}
              hitSlop={8}
              style={styles.monthButton}>
              <ChevronLeft color={theme.textSecondary} size={16} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: theme.text }]}>
              {currentMonthGroup.monthLabel}
            </Text>
            <Pressable
              accessibilityLabel="Next month"
              onPress={() => shiftMonth(1)}
              hitSlop={8}
              style={styles.monthButton}>
              <ChevronRight color={theme.textSecondary} size={16} />
            </Pressable>
          </View>

          {/* Month stats */}
          <View style={[styles.stats, { borderTopColor: theme.border }]}>
            <View style={styles.flex}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Worked</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {formatDuration(currentMonthGroup.totalMinutes)}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Shifts</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {currentMonthGroup.shiftCount}
              </Text>
            </View>
            <View style={styles.flex}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Estimated</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {money(currentMonthGroup.totalEarnings)}
              </Text>
            </View>
          </View>

          {/* Unpaid line inside summary */}
          {currentMonthGroup.unpaidMinutes > 0 ? (
            <View style={[styles.unpaid, { borderTopColor: theme.border }]}>
              <View style={styles.unpaidLabel}>
                <Clock color={theme.warning} size={14} />
                <Text style={[styles.unpaidText, { color: theme.warning }]}>
                  {formatDuration(currentMonthGroup.unpaidMinutes)} unpaid
                </Text>
              </View>
              <Text style={[styles.unpaidAmount, { color: theme.warning }]}>
                {money(currentMonthGroup.unpaidEarnings)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Primary action: add shift for this workplace */}
        <Pressable
          accessibilityRole="button"
          onPress={() => onAddShift(workplace.id)}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: pressed ? theme.accentPressed : theme.accent },
          ]}>
          <Plus color={theme.onAccent} size={16} />
          <Text style={[styles.addText, { color: theme.onAccent }]}>
            Add Shift to {workplace.name}
          </Text>
        </Pressable>

        {/* Main content: hierarchical log or calendar */}
        {viewMode === 'calendar' ? (
          <CalendarView
            shifts={workplaceShifts}
            workplace={workplace}
            currentYearMonth={selectedMonthKey}
            onChangeMonth={setSelectedMonthKey}
            onSelectShift={onSelectShift}
          />
        ) : (
          <View style={styles.weeks}>
            {currentMonthGroup.weeks.length === 0 ? (
              <EmptyState
                type="shifts"
                title={`No shifts in ${currentMonthGroup.monthLabel}`}
                description="Record your hours to see your weekly breakdown."
                actionLabel="Add Shift"
                onAction={() => onAddShift(workplace.id)}
              />
            ) : (
              currentMonthGroup.weeks.map((week) => {
                const isCollapsed = !!collapsedWeeks[week.weekNumber];
                return (
                  <View key={week.weekNumber} style={[styles.week, cardStyle]}>
                    {/* Collapsible week header */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ expanded: !isCollapsed }}
                      onPress={() => toggleWeekCollapse(week.weekNumber)}
                      style={({ pressed }) => [
                        styles.weekHeader,
                        {
                          backgroundColor: pressed
                            ? theme.backgroundSelected
                            : theme.backgroundElement,
                        },
                      ]}>
                      <View style={styles.weekTitle}>
                        {isCollapsed ? (
                          <ChevronRight color={theme.textSecondary} size={16} />
                        ) : (
                          <ChevronDown color={theme.textSecondary} size={16} />
                        )}
                        <Text style={[styles.weekLabel, { color: theme.text }]}>
                          {week.weekLabel}
                          <Text style={[styles.weekRange, { color: theme.textSecondary }]}>
                            {'  '}({week.dateRangeLabel})
                          </Text>
                        </Text>
                      </View>
                      <Text style={[styles.weekTotal, { color: theme.text }]}>
                        {formatDuration(week.totalMinutes)}
                      </Text>
                    </Pressable>

                    {/* Individual shifts in week */}
                    {!isCollapsed ? (
                      <View style={styles.weekShifts}>
                        {week.shifts.map((shift) => (
                          <ShiftRow
                            key={shift.id}
                            shift={shift}
                            workplace={workplace}
                            showWorkplace={false}
                            onClick={() => onSelectShift(shift)}
                          />
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Delete workplace confirmation dialog */}
      <ConfirmationDialog
        isOpen={showDeleteWpConfirm}
        title={`Delete ${workplace.name}?`}
        message="This workplace and all its associated shift records will be permanently removed."
        confirmLabel="Delete Workplace"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => {
          setShowDeleteWpConfirm(false);
          onDeleteWorkplace(workplace.id);
        }}
        onCancel={() => setShowDeleteWpConfirm(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    fontSize: 12,
    fontWeight: '600',
  },
  hero: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  heroTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorBar: {
    width: 14,
    height: 40,
    borderRadius: 999,
  },
  workplaceName: {
    fontSize: 20,
    fontWeight: '700',
  },
  address: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    flexShrink: 1,
    fontSize: 12,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  monthButton: {
    padding: 4,
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  unpaid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  unpaidLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unpaidText: {
    fontSize: 12,
    fontWeight: '500',
  },
  unpaidAmount: {
    fontSize: 12,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  weeks: {
    gap: 16,
  },
  week: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  weekTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  weekRange: {
    fontSize: 11,
    fontWeight: '400',
  },
  weekTotal: {
    fontSize: 12,
    fontWeight: '700',
  },
  weekShifts: {
    padding: 8,
    gap: 6,
  },
});
