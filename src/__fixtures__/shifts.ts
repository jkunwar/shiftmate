import { Shift, Workplace } from '@/types';

export const workplace = (overrides: Partial<Workplace> = {}): Workplace => ({
  id: 'w1',
  name: 'Cafe',
  hourlyRate: 20,
  ...overrides,
});

export const shift = (overrides: Partial<Shift> = {}): Shift => ({
  id: 's1',
  workplaceId: 'w1',
  date: '2026-09-10',
  startTime: '10:00',
  endTime: '12:00',
  breakMinutes: 0,
  workedMinutes: 120,
  paymentStatus: 'unpaid',
  ...overrides,
});
