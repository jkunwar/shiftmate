import { Check, Clock } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { PaymentStatus } from '@/types';
import { FontSize } from '@/constants/theme';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const theme = useTheme();
  const isPaid = status === 'paid';
  const isSmall = size === 'sm';

  const color = isPaid ? theme.success : theme.warning;
  const backgroundColor = isPaid ? theme.successSoft : theme.warningSoft;
  const Icon = isPaid ? Check : Clock;

  return (
    <View
      style={[
        styles.badge,
        isSmall ? styles.badgeSmall : styles.badgeMedium,
        // Appending `55` to the 6-digit hex gives the border ~33% opacity
        { backgroundColor, borderColor: `${color}55` },
      ]}>
      {showIcon ? <Icon color={color} size={isSmall ? 12 : 14} /> : null}
      <Text style={[styles.label, { color }]}>{isPaid ? 'Paid' : 'Unpaid'}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  badgeMedium: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
});
