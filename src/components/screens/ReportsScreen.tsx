import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Download, ExternalLink, FileText, Printer, Share2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  FlatList,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateField } from '@/components/common/DateTimeFields';
import { EmptyState } from '@/components/common/EmptyState';
import { ShiftRow } from '@/components/shifts/ShiftRow';
import { BottomTabInset } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { Chip } from '@/components/common/Chip';
import { ListSeparator } from '@/components/common/list-separator';
import { useRefreshControl } from '@/components/common/refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { Shift, User, Workplace } from '@/types';
import { formatDuration, generateTimesheetCSV, shiftEarnings } from '@/utils/timeCalculations';
import { base64ToBytes } from '@/utils/base64';
import { formatRange, getMonthRange, getWeekRange } from '@/utils/dateRanges';
import { buildShareText, buildTimesheetHtml } from '@/utils/timesheet';
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

type DatePreset = 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom';
type PaymentFilter = 'all' | 'paid' | 'unpaid';

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'this-week', label: 'This Week' },
  { key: 'last-week', label: 'Last Week' },
  { key: 'this-month', label: 'This Month' },
  { key: 'last-month', label: 'Last Month' },
  { key: 'custom', label: 'Custom' },
];

const PAYMENT_FILTERS: { key: PaymentFilter; label: string }[] = [
  { key: 'all', label: 'All Statuses' },
  { key: 'unpaid', label: 'Unpaid Only' },
  { key: 'paid', label: 'Paid Only' },
];

/** ": <reason>" for a toast, or nothing when the error has no useful message. */
const errorDetail = (error: unknown): string => {
  const message = error instanceof Error ? error.message : '';
  return message ? `: ${message.slice(0, 80)}` : '';
};

interface ExportFile {
  /** e.g. "Timesheet PDF", used in the prompt and the toast. */
  label: string;
  name: string;
  mimeType: string;
  /** iOS uniform type identifier for the share sheet. */
  uti: string;
  data: string | Uint8Array;
}

/** Asks whether to save the file on the device or share it. Resolves null when dismissed. */
const askExportAction = (label: string) =>
  new Promise<'save' | 'share' | null>((resolve) => {
    Alert.alert(
      label,
      'How would you like to export it?',
      [
        { text: 'Save to Device', onPress: () => resolve('save') },
        { text: 'Share', onPress: () => resolve('share') },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });

const isCancelled = (error: unknown) => error instanceof Error && /cancel/i.test(error.message);

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
  const { money, time } = useFormat();
  const insets = useSafeAreaInsets();

  const [datePreset, setDatePreset] = useState<DatePreset>('this-month');
  const [selectedWpId, setSelectedWpId] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const today = useToday();
  // The custom range starts as "this month so far"
  const [customStart, setCustomStart] = useState(() => getMonthRange(today).start);
  const [customEnd, setCustomEnd] = useState(today);
  const [showFullTimesheet, setShowFullTimesheet] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // Date boundaries for the selected preset, relative to today
  const dateRange = useMemo(() => {
    switch (datePreset) {
      case 'this-week': {
        const range = getWeekRange(today, weekStartsOn, 0);
        return { ...range, label: `This Week (${formatRange(range)})` };
      }
      case 'last-week': {
        const range = getWeekRange(today, weekStartsOn, -1);
        return { ...range, label: `Last Week (${formatRange(range)})` };
      }
      case 'last-month': {
        const { start, end, label } = getMonthRange(today, -1);
        return { start, end, label };
      }
      case 'custom':
        return { start: customStart, end: customEnd, label: `${customStart} to ${customEnd}` };
      case 'this-month':
      default: {
        const { start, end, label } = getMonthRange(today, 0);
        return { start, end, label };
      }
    }
  }, [datePreset, today, weekStartsOn, customStart, customEnd]);

  // Filter shifts
  const filteredShifts = useMemo(() => {
    return shifts
      .filter((shift) => {
        if (shift.date < dateRange.start || shift.date > dateRange.end) return false;
        if (selectedWpId !== 'all' && shift.workplaceId !== selectedWpId) return false;
        if (paymentFilter === 'paid' && shift.paymentStatus !== 'paid') return false;
        if (paymentFilter === 'unpaid' && shift.paymentStatus !== 'unpaid') return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [shifts, dateRange, selectedWpId, paymentFilter]);

  const totalMinutes = useMemo(() => {
    return filteredShifts.reduce((acc, s) => acc + s.workedMinutes, 0);
  }, [filteredShifts]);

  const totalEarnings = useMemo(() => {
    return filteredShifts.reduce(
      (acc, s) =>
        acc +
        shiftEarnings(
          s,
          workplaces.find((w) => w.id === s.workplaceId),
        ),
      0,
    );
  }, [filteredShifts, workplaces]);

  const activeWorkplace =
    selectedWpId === 'all' ? null : workplaces.find((w) => w.id === selectedWpId) || null;

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000);
  };

  /** Saves the file to a folder the user picks, or opens the share sheet. */
  const deliverFile = async ({ label, name, mimeType, uti, data }: ExportFile) => {
    // The web has no alert dialog or share sheet for files, so it goes straight to sharing
    const action = Platform.OS === 'web' ? 'share' : await askExportAction(label);
    if (!action) return;

    if (action === 'save') {
      try {
        // Folder picker (Android storage access framework / iOS Files): pick e.g. Downloads
        const folder = await Directory.pickDirectoryAsync();
        folder.createFile(name, mimeType).write(data);
        showToast(`${label} saved`);
      } catch (error) {
        if (!isCancelled(error)) throw error;
      }
      return;
    }

    if (await Sharing.isAvailableAsync()) {
      // Written into the app's own cache folder, the only place the share sheet may read from
      const file = new File(Paths.cache, name);
      file.create({ overwrite: true });
      file.write(data);
      await Sharing.shareAsync(file.uri, { mimeType, UTI: uti, dialogTitle: `Export ${label}` });
      showToast(`${label} exported`);
    } else if (typeof data === 'string') {
      // No file sharing on this platform: share the contents as text instead
      await Share.share({ title: label, message: data });
    } else {
      showToast('Sharing is not available on this device');
    }
  };

  const handleExportCSV = async () => {
    const csvContent = generateTimesheetCSV(
      filteredShifts,
      workplaces,
      `${activeWorkplace?.name || 'All Workplaces'} - ${dateRange.label}`,
      time,
    );

    try {
      await deliverFile({
        label: 'Timesheet CSV',
        name: `timesheet_${dateRange.start}_to_${dateRange.end}.csv`,
        mimeType: 'text/csv',
        uti: 'public.comma-separated-values-text',
        data: csvContent,
      });
    } catch (error) {
      console.warn('Timesheet CSV export failed:', error);
      showToast(`Could not export the timesheet CSV${errorDetail(error)}`);
    }
  };

  const handleShare = async () => {
    const summaryText = buildShareText({
      workplaceName: activeWorkplace?.name || 'All Jobs',
      rangeLabel: dateRange.label,
      shifts: filteredShifts,
      weekStartsOn,
    });

    try {
      const result = await Share.share({ title: 'Work Timesheet Report', message: summaryText });
      if (result.action === Share.sharedAction) {
        showToast('Timesheet shared');
      }
    } catch {
      showToast('Could not share the timesheet');
    }
  };

  const handleExportPDF = async () => {
    const html = buildTimesheetHtml({
      user,
      workplaces,
      workplaceName: activeWorkplace?.name || 'All Workplaces',
      rangeLabel: dateRange.label,
      shifts: filteredShifts,
      weekStartsOn,
      showWorkplace: selectedWpId === 'all',
      formatTimeValue: time,
    });

    try {
      // No file to hand over on the web: open the browser's print dialog (Save as PDF)
      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
        return;
      }

      // Asked for as base64 so the app writes the file itself (see deliverFile)
      const { base64 } = await Print.printToFileAsync({ html, base64: true });
      if (!base64) throw new Error('The PDF came back empty');

      await deliverFile({
        label: 'Timesheet PDF',
        name: `timesheet_${dateRange.start}_to_${dateRange.end}.pdf`,
        mimeType: 'application/pdf',
        uti: 'com.adobe.pdf',
        data: base64ToBytes(base64),
      });
    } catch (error) {
      console.warn('Timesheet PDF export failed:', error);
      showToast(`Could not create the timesheet PDF${errorDetail(error)}`);
    }
  };

  const secondaryButton = ({ pressed }: { pressed: boolean }) => [
    styles.actionButton,
    {
      backgroundColor: pressed ? theme.backgroundElement : theme.surface,
      borderColor: theme.border,
    },
  ];

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
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={[styles.heading, { color: theme.text }]}>Reports & Timesheets</Text>
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
                ]}
              >
                <FileText color={theme.accent} size={20} />
              </Pressable>
            </View>

            {/* Quick date presets */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {DATE_PRESETS.map((item) => (
                <Chip
                  key={item.key}
                  label={item.label}
                  selected={datePreset === item.key}
                  onPress={() => setDatePreset(item.key)}
                />
              ))}
            </ScrollView>

            {/* Custom date range */}
            {datePreset === 'custom' ? (
              <View
                style={[
                  styles.customRange,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}
              >
                <View style={styles.flex}>
                  <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>
                    Start Date
                  </Text>
                  <DateField
                    compact
                    value={customStart}
                    onChange={setCustomStart}
                    accessibilityLabel="Start date"
                  />
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>End Date</Text>
                  <DateField
                    compact
                    value={customEnd}
                    onChange={setCustomEnd}
                    accessibilityLabel="End date"
                  />
                </View>
              </View>
            ) : null}

            {/* Workplace & payment status filters */}
            <View style={styles.filter}>
              <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>Workplace</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <Chip
                  label="All Workplaces"
                  selected={selectedWpId === 'all'}
                  onPress={() => setSelectedWpId('all')}
                />
                {workplaces.map((wp) => (
                  <Chip
                    key={wp.id}
                    label={wp.name}
                    selected={selectedWpId === wp.id}
                    onPress={() => setSelectedWpId(wp.id)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.filter}>
              <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>
                Payment Status
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {PAYMENT_FILTERS.map((item) => (
                  <Chip
                    key={item.key}
                    label={item.label}
                    selected={paymentFilter === item.key}
                    onPress={() => setPaymentFilter(item.key)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Report preview hero card */}
            <View
              style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={styles.heroHeader}>
                <View style={styles.headerText}>
                  <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
                    Report Preview
                  </Text>
                  <Text numberOfLines={1} style={[styles.heroTitle, { color: theme.text }]}>
                    {activeWorkplace ? activeWorkplace.name : 'All Workplaces'}
                  </Text>
                  <Text style={[styles.subheading, { color: theme.textSecondary }]}>
                    {dateRange.label}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setShowFullTimesheet(true)}
                  style={styles.fullForm}
                >
                  <Text style={[styles.fullFormText, { color: theme.accent }]}>Full Form</Text>
                  <ExternalLink color={theme.accent} size={14} />
                </Pressable>
              </View>

              {/* 3 metric stats */}
              <View style={[styles.metrics, { borderColor: theme.border }]}>
                <View style={styles.flex}>
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                    Total Hours
                  </Text>
                  <Text style={[styles.metricValue, { color: theme.text }]}>
                    {formatDuration(totalMinutes)}
                  </Text>
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>Shifts</Text>
                  <Text style={[styles.metricValue, { color: theme.text }]}>
                    {filteredShifts.length}
                  </Text>
                </View>
                <View style={styles.flex}>
                  <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                    Est. Earnings
                  </Text>
                  <Text style={[styles.metricValue, { color: theme.success }]}>
                    {money(totalEarnings)}
                  </Text>
                </View>
              </View>

              {/* Actions: share, preview timesheet, export CSV */}
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" onPress={handleShare} style={secondaryButton}>
                  <Share2 color={theme.text} size={14} />
                  <Text style={[styles.actionText, { color: theme.text }]}>Share</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={handleExportPDF}
                  style={({ pressed }) => [
                    styles.actionButton,
                    {
                      backgroundColor: pressed ? theme.accentPressed : theme.accent,
                      borderColor: 'transparent',
                    },
                  ]}
                >
                  <Printer color={theme.onAccent} size={14} />
                  <Text style={[styles.actionText, { color: theme.onAccent }]}>Export PDF</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={handleExportCSV}
                  style={secondaryButton}
                >
                  <Download color={theme.text} size={14} />
                  <Text style={[styles.actionText, { color: theme.text }]}>Export CSV</Text>
                </Pressable>
              </View>
            </View>
            <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
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
            showWorkplace={selectedWpId === 'all'}
            onClick={() => onSelectShift(shift)}
          />
        )}
      />

      {/* Toast notification */}
      {toastMessage ? (
        <View pointerEvents="none" style={[styles.toastWrap, { top: insets.top + 8 }]}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      ) : null}

      {/* Formal timesheet document modal */}
      <ReportDetailModal
        isOpen={showFullTimesheet}
        onClose={() => setShowFullTimesheet(false)}
        user={user}
        workplace={activeWorkplace}
        shifts={filteredShifts}
        dateRangeLabel={dateRange.label}
        totalMinutes={totalMinutes}
        onShare={handleShare}
        onExportCSV={handleExportCSV}
        onPrint={handleExportPDF}
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
    fontSize: 20,
    fontWeight: '700',
  },
  subheading: {
    fontSize: 12,
  },
  previewButton: {
    padding: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  customRange: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  filter: {
    gap: 4,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  hero: {
    padding: 20,
    gap: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  fullForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fullFormText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  metricLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerBlock: {
    gap: 16,
    marginBottom: 8,
  },
  toastWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    maxWidth: '92%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  },
  toastText: {
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
