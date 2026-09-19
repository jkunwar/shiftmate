import { useAppState } from '@/lib/app-state';
import { formatCurrency, formatTime } from '@/utils/timeCalculations';

/** Money and time formatting that follows the user's Settings (currency symbol, 12h/24h clock). */
export function useFormat() {
  const { preferences } = useAppState();
  const { currency, timeFormat } = preferences;

  return {
    currency,
    money: (amount: number) => formatCurrency(amount, currency),
    time: (timeStr: string) => formatTime(timeStr, timeFormat),
  };
}
