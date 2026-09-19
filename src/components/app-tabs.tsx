import { TabList, TabSlot, Tabs, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SyncBanner } from '@/components/sync-banner';
import { ThemedText } from '@/components/themed-text';
import { AddButtonRaise, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppState } from '@/lib/app-state';

const ADD_BUTTON_SIZE = 58;
const BAR_HEIGHT = 62;

type TabButtonProps = TabTriggerSlotProps & {
  label: string;
  icon: SymbolViewProps['name'];
};

function TabButton({ label, icon, isFocused, ...props }: TabButtonProps) {
  const theme = useTheme();
  const color = isFocused ? theme.accent : theme.textSecondary;

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <SymbolView tintColor={color} name={icon} size={24} />
      <ThemedText type="small" style={{ color }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/**
 * Raised centre button: opens the add-shift modal from any tab instead of switching route.
 * It floats over the tab bar as its own layer instead of living inside it: Android doesn't deliver
 * touches to the part of a child that sticks out of its parent.
 */
function AddButton({ bottom }: { bottom: number }) {
  const theme = useTheme();
  const { openAddShift } = useAppState();

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add shift"
        onPress={() => openAddShift()}
        style={({ pressed }) => [
          styles.addButton,
          { bottom, backgroundColor: theme.accent, borderColor: theme.surface },
          pressed && styles.pressed,
        ]}>
        <SymbolView
          tintColor={theme.onAccent}
          name={{ ios: 'plus', android: 'add', web: 'add' }}
          size={30}
        />
      </Pressable>
    </View>
  );
}

export default function AppTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <Tabs>
        <TabSlot style={{ flex: 1 }} />
        <SyncBanner />
        <TabList
          style={[
            styles.tabList,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.border,
              height: BAR_HEIGHT + insets.bottom,
              paddingBottom: insets.bottom,
            },
          ]}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton label="Home" icon={{ ios: 'house.fill', android: 'home', web: 'home' }} />
          </TabTrigger>
          <TabTrigger name="workplaces" href="/workplaces" asChild>
            <TabButton
              label="Workplaces"
              icon={{ ios: 'building.2.fill', android: 'business', web: 'business' }}
            />
          </TabTrigger>
          {/* Keeps the middle of the bar free for the raised button */}
          <View style={styles.addSpacer} />
          <TabTrigger name="reports" href="/reports" asChild>
            <TabButton
              label="Reports"
              icon={{ ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' }}
            />
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton
              label="Settings"
              icon={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
            />
          </TabTrigger>
        </TabList>
      </Tabs>
    <AddButton bottom={insets.bottom + BAR_HEIGHT - ADD_BUTTON_SIZE + AddButtonRaise} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  tabList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
  },
  addSpacer: {
    flex: 1,
  },
  addButton: {
    position: 'absolute',
    left: '50%',
    marginLeft: -ADD_BUTTON_SIZE / 2,
    width: ADD_BUTTON_SIZE,
    height: ADD_BUTTON_SIZE,
    borderRadius: ADD_BUTTON_SIZE / 2,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)',
  },
  pressed: {
    opacity: 0.7,
  },
});
