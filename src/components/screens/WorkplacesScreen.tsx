import { Plus } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common/EmptyState';
import { WorkplaceCard } from '@/components/workplaces/WorkplaceCard';
import { BottomTabInset } from '@/constants/theme';
import { useRefreshControl } from '@/components/common/refresh-control';
import { useTheme } from '@/hooks/use-theme';
import { useToday } from '@/hooks/use-today';
import { Shift, Workplace } from '@/types';
import { getMonthRange, monthName } from '@/utils/dateRanges';

interface WorkplacesScreenProps {
  workplaces: Workplace[];
  shifts: Shift[];
  onSelectWorkplace: (workplaceId: string) => void;
  onAddWorkplace: () => void;
  /** Pull-to-refresh handler (syncs with the cloud). Omit to turn the gesture off. */
  onRefresh?: () => Promise<void>;
}

export const WorkplacesScreen: React.FC<WorkplacesScreenProps> = ({
  onRefresh,
  workplaces,
  shifts,
  onSelectWorkplace,
  onAddWorkplace,
}) => {
  const theme = useTheme();
  const refreshControl = useRefreshControl(onRefresh);
  const insets = useSafeAreaInsets();

  const today = useToday();
  const { monthKey: currentMonthKey } = getMonthRange(today);
  const currentMonthName = monthName(Number(currentMonthKey.slice(5)) - 1);

  return (
    <ScrollView
        refreshControl={refreshControl}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: BottomTabInset + insets.bottom + 16 },
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.heading, { color: theme.text }]}>Workplaces</Text>
          <Text style={[styles.subheading, { color: theme.textSecondary }]}>
            {workplaces.length} {workplaces.length === 1 ? 'workplace' : 'workplaces'} configured
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onAddWorkplace}
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: pressed ? theme.accentPressed : theme.accent },
          ]}>
          <Plus color={theme.onAccent} size={16} />
          <Text style={[styles.addText, { color: theme.onAccent }]}>Add Workplace</Text>
        </Pressable>
      </View>

      {/* Workplace cards list */}
      {workplaces.length === 0 ? (
        <EmptyState type="workplaces" onAction={onAddWorkplace} />
      ) : (
        <View style={styles.list}>
          {workplaces.map((wp) => (
            <WorkplaceCard
              key={wp.id}
              workplace={wp}
              shifts={shifts}
              currentMonthKey={currentMonthKey}
              monthName={currentMonthName}
              onClick={() => onSelectWorkplace(wp.id)}
            />
          ))}
        </View>
      )}
    </ScrollView>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addText: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    gap: 12,
  },
});
