import { Download, ExternalLink, Printer, Share2 } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontSize } from '@/constants/theme';
import { useFormat } from '@/hooks/use-format';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/utils/timeCalculations';

interface ReportSummaryCardProps {
  workplaceName: string;
  rangeLabel: string;
  totalMinutes: number;
  shiftCount: number;
  earnings: number;
  onOpenFullForm: () => void;
  onShare: () => void;
  onExportPDF: () => void;
  onExportCSV: () => void;
}

/** The report's totals with the share and export actions. The actions are off when it is empty. */
export function ReportSummaryCard({
  workplaceName,
  rangeLabel,
  totalMinutes,
  shiftCount,
  earnings,
  onOpenFullForm,
  onShare,
  onExportPDF,
  onExportCSV,
}: ReportSummaryCardProps) {
  const theme = useTheme();
  const { money } = useFormat();
  const hasShifts = shiftCount > 0;

  const secondaryButton = ({ pressed }: { pressed: boolean }) => [
    styles.actionButton,
    {
      backgroundColor: pressed ? theme.backgroundElement : theme.surface,
      borderColor: theme.border,
    },
    !hasShifts && styles.disabled,
  ];

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>Report Preview</Text>
          <Text numberOfLines={1} style={[styles.title, { color: theme.text }]}>
            {workplaceName}
          </Text>
          <Text style={[styles.range, { color: theme.textSecondary }]}>{rangeLabel}</Text>
        </View>

        <Pressable accessibilityRole="button" onPress={onOpenFullForm} style={styles.fullForm}>
          <Text style={[styles.fullFormText, { color: theme.accent }]}>Full Form</Text>
          <ExternalLink color={theme.accent} size={14} />
        </Pressable>
      </View>

      <View style={[styles.metrics, { borderColor: theme.border }]}>
        <Metric label="Total Hours" value={formatDuration(totalMinutes)} color={theme.text} />
        <Metric label="Shifts" value={String(shiftCount)} color={theme.text} />
        <Metric label="Est. Earnings" value={money(earnings)} color={theme.success} />
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasShifts }}
          disabled={!hasShifts}
          onPress={onShare}
          style={secondaryButton}>
          <Share2 color={theme.text} size={14} />
          <Text style={[styles.actionText, { color: theme.text }]}>Share</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasShifts }}
          disabled={!hasShifts}
          onPress={onExportPDF}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: pressed ? theme.accentPressed : theme.accent,
              borderColor: 'transparent',
            },
            !hasShifts && styles.disabled,
          ]}>
          <Printer color={theme.onAccent} size={14} />
          <Text style={[styles.actionText, { color: theme.onAccent }]}>Export PDF</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasShifts }}
          disabled={!hasShifts}
          onPress={onExportCSV}
          style={secondaryButton}>
          <Download color={theme.text} size={14} />
          <Text style={[styles.actionText, { color: theme.text }]}>Export CSV</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  const theme = useTheme();

  return (
    <View style={styles.metric}>
      <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  range: {
    fontSize: FontSize.xs,
  },
  fullForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fullFormText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: FontSize.xs,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: FontSize.md,
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
  disabled: {
    opacity: 0.4,
  },
  actionText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
