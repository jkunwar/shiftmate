import { Info } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { SectionCard } from '@/components/settings/SectionCard';
import { FontSize } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ROWS = [
  ['App Version', 'v1.0.0'],
  ['Data Privacy', 'Only you can see your data'],
];

/** Version and privacy notes. */
export function AboutSection() {
  const theme = useTheme();

  return (
    <SectionCard icon={Info} title="About">
      {ROWS.map(([label, value], index) => (
        <View
          key={label}
          style={[
            styles.row,
            index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
          ]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
          <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
        </View>
      ))}
    </SectionCard>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  label: {
    fontSize: FontSize.xs,
  },
  value: {
    flexShrink: 1,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textAlign: 'right',
  },
});
