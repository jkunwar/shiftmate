import React, { useState } from 'react';
import { RefreshControl } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

/**
 * Pull-to-refresh for a ScrollView: `<ScrollView refreshControl={useRefreshControl(onRefresh)} />`.
 * Returns undefined (no pull gesture) when there's nothing to refresh, e.g. in local-only mode.
 */
export function useRefreshControl(onRefresh?: () => Promise<void>) {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  if (!onRefresh) return undefined;

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }}
      tintColor={theme.textSecondary}
      colors={[theme.accent]}
      progressBackgroundColor={theme.surface}
    />
  );
}
