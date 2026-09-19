import { Download, Printer, Share2, X } from 'lucide-react-native';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { Shift, User, Workplace } from '@/types';
import { formatDate, formatDuration } from '@/utils/timeCalculations';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  workplace: Workplace | null;
  shifts: Shift[];
  dateRangeLabel: string;
  totalMinutes: number;
  onShare: () => void;
  onExportCSV: () => void;
  /** Creates and shares the PDF; the PDF buttons only show when this is provided. */
  onPrint?: () => void;
}

// Relative column widths for the shifts table
const COLUMNS = {
  date: 1.2,
  day: 0.8,
  start: 1.35,
  end: 1.35,
  break: 0.8,
  hours: 1.1,
} as const;

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  isOpen,
  onClose,
  user,
  workplace,
  shifts,
  dateRangeLabel,
  totalMinutes,
  onShare,
  onExportCSV,
  onPrint,
}) => {
  const theme = useTheme();
  const { time } = useFormat();

  if (!isOpen) return null;

  const headerCell = [styles.cell, styles.headerCell, { color: theme.textSecondary }];

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        {/* Tapping outside the sheet closes it. It is a sibling rather than a parent of the sheet so it never competes with scrolling inside. */}
        <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Header actions */}
          <View
            style={[
              styles.toolbar,
              { backgroundColor: theme.backgroundElement, borderBottomColor: theme.border },
            ]}>
            <Text numberOfLines={1} style={[styles.toolbarTitle, { color: theme.textSecondary }]}>
              Formal Timesheet Document
            </Text>
            <View style={styles.toolbarActions}>
              <Pressable
                accessibilityLabel="Share"
                onPress={onShare}
                hitSlop={4}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && { backgroundColor: theme.backgroundSelected },
                ]}>
                <Share2 color={theme.textSecondary} size={16} />
              </Pressable>
              <Pressable
                accessibilityLabel="Export CSV"
                onPress={onExportCSV}
                hitSlop={4}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && { backgroundColor: theme.backgroundSelected },
                ]}>
                <Download color={theme.textSecondary} size={16} />
              </Pressable>
              {onPrint ? (
                <Pressable
                  accessibilityLabel="Print timesheet"
                  onPress={onPrint}
                  hitSlop={4}
                  style={({ pressed }) => [
                    styles.iconButton,
                    pressed && { backgroundColor: theme.backgroundSelected },
                  ]}>
                  <Printer color={theme.textSecondary} size={16} />
                </Pressable>
              ) : null}
              <Pressable
                accessibilityLabel="Close"
                onPress={onClose}
                hitSlop={4}
                style={styles.iconButton}>
                <X color={theme.textSecondary} size={20} />
              </Pressable>
            </View>
          </View>

          {/* Formal timesheet sheet */}
          <ScrollView contentContainerStyle={styles.sheet}>
            {/* Title banner */}
            <View style={[styles.banner, { borderBottomColor: theme.text }]}>
              <View style={styles.bannerLeft}>
                <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>
                  Official Work Record
                </Text>
                <Text style={[styles.docTitle, { color: theme.text }]}>TIMESHEET</Text>
                <Text numberOfLines={1} style={[styles.workplaceName, { color: theme.accent }]}>
                  {workplace ? workplace.name : 'All Workplaces'}
                </Text>
              </View>

              <View style={styles.bannerRight}>
                <Text style={[styles.smallMuted, { color: theme.textSecondary }]}>Pay Period</Text>
                <Text style={[styles.period, { color: theme.text }]}>{dateRangeLabel}</Text>
                <Text style={[styles.smallMuted, styles.employee, { color: theme.textSecondary }]}>
                  Employee:{' '}
                  <Text style={[styles.employeeName, { color: theme.text }]}>{user.name}</Text>
                </Text>
              </View>
            </View>

            {/* Table of shifts */}
            <View>
              <View style={[styles.row, styles.headerRow, { borderBottomColor: theme.border }]}>
                <Text style={[headerCell, { flex: COLUMNS.date }]}>Date</Text>
                <Text style={[headerCell, { flex: COLUMNS.day }]}>Day</Text>
                <Text style={[headerCell, { flex: COLUMNS.start }]}>Start</Text>
                <Text style={[headerCell, { flex: COLUMNS.end }]}>End</Text>
                <Text style={[headerCell, { flex: COLUMNS.break }]}>Break</Text>
                <Text style={[headerCell, styles.right, { flex: COLUMNS.hours }]}>Hours</Text>
              </View>

              {shifts.map((shift, index) => (
                <View
                  key={shift.id}
                  style={[
                    styles.row,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
                  ]}>
                  <Text
                    style={[styles.cell, styles.dateCell, { flex: COLUMNS.date, color: theme.text }]}>
                    {formatDate(shift.date, 'short')}
                  </Text>
                  <Text style={[styles.cell, { flex: COLUMNS.day, color: theme.textSecondary }]}>
                    {formatDate(shift.date, 'dayOfWeek').substring(0, 3)}
                  </Text>
                  <Text style={[styles.cell, { flex: COLUMNS.start, color: theme.text }]}>
                    {time(shift.startTime)}
                  </Text>
                  <Text style={[styles.cell, { flex: COLUMNS.end, color: theme.text }]}>
                    {time(shift.endTime)}
                  </Text>
                  <Text style={[styles.cell, { flex: COLUMNS.break, color: theme.textSecondary }]}>
                    {shift.breakMinutes > 0 ? `${shift.breakMinutes}m` : '—'}
                  </Text>
                  <Text
                    style={[
                      styles.cell,
                      styles.right,
                      styles.hoursCell,
                      { flex: COLUMNS.hours, color: theme.text },
                    ]}>
                    {formatDuration(shift.workedMinutes)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Grand totals */}
            <View
              style={[
                styles.totals,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <View>
                <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
                  Total Worked Time
                </Text>
                <Text style={[styles.totalValue, { color: theme.text }]}>
                  {formatDuration(totalMinutes)}
                </Text>
                <Text style={[styles.shiftCount, { color: theme.textSecondary }]}>
                  ({shifts.length} {shifts.length === 1 ? 'shift' : 'shifts'})
                </Text>
              </View>

            </View>

            {/* Verification signature lines */}
            <View style={[styles.signatures, { borderTopColor: theme.border }]}>
              <View style={styles.flex}>
                <View style={[styles.signatureLine, { borderBottomColor: theme.border }]} />
                <Text style={[styles.signatureLabel, { color: theme.textSecondary }]}>
                  Employee Signature / Date
                </Text>
              </View>
              <View style={styles.flex}>
                <View style={[styles.signatureLine, { borderBottomColor: theme.border }]} />
                <Text style={[styles.signatureLabel, { color: theme.textSecondary }]}>
                  Supervisor Approval / Date
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Bottom actions */}
          <View
            style={[
              styles.footer,
              { backgroundColor: theme.backgroundElement, borderTopColor: theme.border },
            ]}>
            <Pressable
              accessibilityRole="button"
              onPress={onExportCSV}
              style={({ pressed }) => [
                styles.footerButton,
                {
                  backgroundColor: pressed ? theme.backgroundSelected : theme.surface,
                  borderColor: theme.border,
                },
              ]}>
              <Download color={theme.text} size={14} />
              <Text style={[styles.footerText, { color: theme.text }]}>Export CSV</Text>
            </Pressable>
            {onPrint ? (
              <Pressable
                accessibilityRole="button"
                onPress={onPrint}
                style={({ pressed }) => [
                  styles.footerButton,
                  {
                    backgroundColor: pressed ? theme.accentPressed : theme.accent,
                    borderColor: 'transparent',
                  },
                ]}>
                <Printer color={theme.onAccent} size={14} />
                <Text style={[styles.footerText, { color: theme.onAccent }]}>
                  Export PDF
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  card: {
    width: '100%',
    maxWidth: 576,
    maxHeight: '92%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  toolbarTitle: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
  },
  sheet: {
    padding: 16,
    gap: 20,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 2,
  },
  bannerLeft: {
    flexShrink: 1,
  },
  bannerRight: {
    alignItems: 'flex-end',
    flexShrink: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  docTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  workplaceName: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
  },
  smallMuted: {
    fontSize: 12,
  },
  period: {
    fontSize: 12,
    fontWeight: '700',
  },
  employee: {
    marginTop: 4,
  },
  employeeName: {
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  headerRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  cell: {
    fontSize: 11,
    paddingHorizontal: 2,
  },
  headerCell: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontSize: 10,
  },
  dateCell: {
    fontWeight: '500',
  },
  hoursCell: {
    fontWeight: '700',
  },
  right: {
    textAlign: 'right',
  },
  totals: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  shiftCount: {
    marginTop: 2,
    fontSize: 11,
  },
  signatures: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  signatureLine: {
    height: 32,
    marginBottom: 4,
    borderBottomWidth: 1,
  },
  signatureLabel: {
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
