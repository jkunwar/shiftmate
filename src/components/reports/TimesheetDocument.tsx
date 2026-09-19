import { StyleSheet, Text, View } from 'react-native';

import { TimesheetTable } from '@/components/reports/TimesheetTable';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Shift } from '@/types';
import { formatDuration } from '@/utils/timeCalculations';

interface TimesheetDocumentProps {
  employeeName: string;
  workplaceName: string;
  rangeLabel: string;
  shifts: Shift[];
  totalMinutes: number;
}

/** The timesheet as a page: title banner, the shifts, the grand total and signature lines. */
export function TimesheetDocument({
  employeeName,
  workplaceName,
  rangeLabel,
  shifts,
  totalMinutes,
}: TimesheetDocumentProps) {
  const theme = useTheme();

  return (
    <>
      <View style={[styles.banner, { borderBottomColor: theme.text }]}>
        <View style={styles.bannerLeft}>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>Official Work Record</Text>
          <Text style={[styles.title, { color: theme.text }]}>TIMESHEET</Text>
          <Text numberOfLines={1} style={[styles.workplace, { color: theme.accent }]}>
            {workplaceName}
          </Text>
        </View>

        <View style={styles.bannerRight}>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>Pay Period</Text>
          <Text style={[styles.period, { color: theme.text }]}>{rangeLabel}</Text>
          <Text style={[styles.muted, styles.employee, { color: theme.textSecondary }]}>
            Employee: <Text style={[styles.employeeName, { color: theme.text }]}>{employeeName}</Text>
          </Text>
        </View>
      </View>

      <TimesheetTable shifts={shifts} />

      <View
        style={[styles.totals, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total Worked Time</Text>
        <Text style={[styles.totalValue, { color: theme.text }]}>{formatDuration(totalMinutes)}</Text>
        <Text style={[styles.shiftCount, { color: theme.textSecondary }]}>
          ({shifts.length} {shifts.length === 1 ? 'shift' : 'shifts'})
        </Text>
      </View>

      <View style={[styles.signatures, { borderTopColor: theme.border }]}>
        <SignatureLine label="Employee Signature / Date" />
        <SignatureLine label="Supervisor Approval / Date" />
      </View>
    </>
  );
}

function SignatureLine({ label }: { label: string }) {
  const theme = useTheme();

  return (
    <View style={styles.signature}>
      <View style={[styles.signatureLine, { borderBottomColor: theme.border }]} />
      <Text style={[styles.signatureLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  workplace: {
    marginTop: 2,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  muted: {
    fontSize: FontSize.xs,
  },
  period: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  employee: {
    marginTop: 4,
  },
  employeeName: {
    fontWeight: '700',
  },
  totals: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  totalLabel: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: FontSize.lg,
    fontWeight: '900',
  },
  shiftCount: {
    marginTop: 2,
    fontSize: FontSize.xs,
  },
  signatures: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  signature: {
    flex: 1,
  },
  signatureLine: {
    height: 32,
    marginBottom: 4,
    borderBottomWidth: 1,
  },
  signatureLabel: {
    fontSize: FontSize.xs,
  },
});
