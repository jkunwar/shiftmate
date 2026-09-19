import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { toLocalDateString } from '@/utils/timeCalculations';

/**
 * Today's date (YYYY-MM-DD, device timezone). It updates when the app returns to the foreground
 * and at midnight, so "this week" and "this month" stay right in an app that's left open.
 */
export function useToday(): string {
  const [today, setToday] = useState(() => toLocalDateString());

  useEffect(() => {
    const refresh = () => {
      const now = toLocalDateString();
      setToday((previous) => (previous === now ? previous : now));
    };

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });

    let timer: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(() => {
        refresh();
        scheduleMidnight();
      }, nextMidnight.getTime() - now.getTime());
    };
    scheduleMidnight();

    return () => {
      appStateSub.remove();
      clearTimeout(timer);
    };
  }, []);

  return today;
}
