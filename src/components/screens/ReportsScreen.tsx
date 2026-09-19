import { FileText } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common/EmptyState';
import { ListSeparator } from '@/components/common/list-separator';
import { useRefreshControl } from '@/components/common/refresh-control';
import { Toast } from '@/components/common/Toast';
import { ReportFilters } from '@/components/reports/ReportFilters';
import { ReportSummaryCard } from '@/components/reports/ReportSummaryCard';
import { ShiftRow } from '@/components/shifts/ShiftRow';
import { BottomTabInset, FontSize, ScreenTitle } from '@/constants/theme';
import { useReportExport } from '@/hooks/use-report-export';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/hooks/use-toast';
import { useToday } from '@/hooks/use-today';
import { Shift, User, Workplace } from '@/types';
import { getMonthRange } from '@/utils/dateRanges';
import {
  DatePreset,
  filterShifts,
  PaymentFilter,
  resolveDateRange,
  summarizeShifts,
} from '@/utils/reportFilters';
import { ReportDetailModal } from './ReportDetailModal';

interface ReportsScreenProps {
  user: User;
  workplaces: Workplace[];
  shifts: Shift[];
  onSelectShift: (shift: Shift) => void;
  /** Which day weeks start on in the shared summary and the PDF. Defaults to Monday. */
  weekStartsOn?: 'monday' | 'sunday';
  /** Pull-to-refresh handler (syncs with the cloud). Omit to turn the gesture off. */
  onRefresh?: () => Promise<void>;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  onRefresh,
  user,
  workplaces,
  shifts,
  onSelectShift,
  weekStartsOn = 'monday',
}) => {
  const theme = useTheme();
  const refreshControl = useRefreshControl(onRefresh);
  const insets = useSafeAreaInsets();
  const today = useToday();
  const { message: toastMessage, showToast } = useToast();

  const [datePreset, setDatePreset] = useState<DatePreset>('this-month');
  const [workplaceId, setWorkplaceId] = useState('all');
  const [payment, setPayment] = useState<PaymentFilter>('all');
  // The custom range starts as "this month so far"
  const [customStart, setCustomStart] = useState(() => getMonthRange(today).start);
  const [customEnd, setCustomEnd] = useState(today);
  const [showFullTimesheet, setShowFullTimesheet] = useState(false);

  const dateRange = useMemo(
    () =>
      resolveDateRange(datePreset, today, weekStartsOn, { start: customStart, end: customEnd }),
    [datePreset, today, weekStartsOn, customStart, customEnd],
  );

  const filteredShifts = useMemo(
    () => filterShifts(shifts, { range: dateRange, workplaceId, payment }),
    [shifts, dateRange, workplaceId, payment],
  );

  const totals = useMemo(
    () => summarizeShifts(filteredShifts, workplaces),
    [filteredShifts, workplaces],
  );

  const activeWorkplace =
    workplaceId === 'all' ? null : workplaces.find((w) => w.id === workplaceId) || null;

  const { exportCSV, share, exportPDF } = useReportExport({
    user,
    workplaces,
    shifts: filteredShifts,
    workplace: activeWorkplace,
    range: dateRange,
    weekStartsOn,
    showToast,
  });

  return (
    <View style={styles.flex}>
      <FlatList
        data={filteredShifts}
        keyExtractor={(shift) => shift.id}
        refreshControl={refreshControl}
        ItemSeparatorComponent={ListSeparator}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: BottomTabInset + insets.bottom + 16 },
        ]}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={[styles.heading, { color: theme.text }]}>Reports</Text>
                <Text style={[styles.subheading, { color: theme.textSecondary }]}>
                  Generate and export employer-ready timesheets
                </Text>
              </View>

              <Pressable
                accessibilityLabel="Timesheet preview"
                onPress={() => setShowFullTimesheet(true)}
                style={({ pressed }) => [
                  styles.previewButton,
                  {
                    backgroundColor: pressed ? theme.backgroundElement : theme.surface,
                    borderColor: theme.border,
                  },
                ]}>
                <FileText color={theme.accent} size={20} />
              </Pressable>
            </View>

            <ReportFilters
              datePreset={datePreset}
              onDatePresetChange={setDatePreset}
              customStart={customStart}
              customEnd={customEnd}
              onCustomStartChange={setCustomStart}
              onCustomEndChange={setCustomEnd}
              workplaces={workplaces}
              workplaceId={workplaceId}
              onWorkplaceChange={setWorkplaceId}
              payment={payment}
              onPaymentChange={setPayment}
            />

            <ReportSummaryCard
              workplaceName={activeWorkplace ? activeWorkplace.name : 'All Workplaces'}
              rangeLabel={dateRange.label}
              totalMinutes={totals.minutes}
              shiftCount={filteredShifts.length}
              earnings={totals.earnings}
              onOpenFullForm={() => setShowFullTimesheet(true)}
              onShare={share}
              onExportPDF={exportPDF}
              onExportCSV={exportCSV}
            />

            <Text style={[styles.listTitle, { color: theme.textSecondary }]}>
              Included Shifts ({filteredShifts.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            type="reports"
            description="No shifts match the selected filters or date range."
          />
        }
        renderItem={({ item: shift }) => (
          <ShiftRow
            shift={shift}
            workplace={workplaces.find((w) => w.id === shift.workplaceId)}
            showWorkplace={workplaceId === 'all'}
            onClick={() => onSelectShift(shift)}
          />
        )}
      />

      <Toast message={toastMessage} />

      {/* Formal timesheet document modal */}
      <ReportDetailModal
        isOpen={showFullTimesheet}
        onClose={() => setShowFullTimesheet(false)}
        user={user}
        workplace={activeWorkplace}
        shifts={filteredShifts}
        dateRangeLabel={dateRange.label}
        totalMinutes={totals.minutes}
        onShare={share}
        onExportCSV={exportCSV}
        onPrint={exportPDF}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
  },
  headerBlock: {
    gap: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  heading: {
    ...ScreenTitle,
  },
  subheading: {
    fontSize: FontSize.xs,
  },
  previewButton: {
    padding: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  listTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
