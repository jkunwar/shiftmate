import { shift, workplace } from '@/__fixtures__/shifts';
import {
  computeWorkedTime,
  initialFormValues,
  isValidDate,
  paidShiftPayChanged,
  parseRate,
  rateToInput,
  validateShiftForm,
} from './shiftForm';

describe('isValidDate', () => {
  it('accepts real dates only', () => {
    expect(isValidDate('2026-09-19')).toBe(true);
    expect(isValidDate('2028-02-29')).toBe(true);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('19-09-2026')).toBe(false);
    expect(isValidDate('')).toBe(false);
  });
});

describe('rates', () => {
  it('parses a rate, accepting a decimal comma and treating bad or negative input as 0', () => {
    expect(parseRate('18.5')).toBe(18.5);
    expect(parseRate('18,5')).toBe(18.5);
    expect(parseRate('')).toBe(0);
    expect(parseRate('abc')).toBe(0);
    expect(parseRate('-4')).toBe(0);
  });

  it('shows a rate to two places, or blank when there is none', () => {
    expect(rateToInput(20)).toBe('20.00');
    expect(rateToInput(0)).toBe('');
    expect(rateToInput(undefined)).toBe('');
  });
});

describe('initialFormValues', () => {
  const cafe = workplace({
    id: 'w1',
    hourlyRate: 20,
    usualSchedule: [
      { dayOfWeek: 1, dayName: 'Monday', startTime: '09:00', endTime: '17:00', active: true },
    ],
  });
  const shop = workplace({ id: 'w2', name: 'Shop', hourlyRate: 12 });

  it('starts a new shift on the first workplace with its usual schedule and rate', () => {
    const values = initialFormValues({ workplaces: [cafe, shop] }, '2026-09-19');
    expect(values).toMatchObject({
      workplaceId: 'w1',
      date: '2026-09-19',
      startTime: '09:00',
      endTime: '17:00',
      paymentStatus: 'unpaid',
      rateInput: '20.00',
    });
  });

  it('uses defaults when the workplace has no schedule, and honours a default workplace', () => {
    const values = initialFormValues({ workplaces: [cafe, shop], defaultWorkplaceId: 'w2' }, '2026-09-19');
    expect(values).toMatchObject({ workplaceId: 'w2', startTime: '16:00', endTime: '21:00', rateInput: '12.00' });
  });

  it('has an empty workplace when there are none', () => {
    expect(initialFormValues({ workplaces: [] }, '2026-09-19').workplaceId).toBe('');
  });

  it('fills the form from the shift being edited, using its own rate first', () => {
    const editing = shift({
      workplaceId: 'w1',
      date: '2026-09-10',
      startTime: '08:00',
      endTime: '12:00',
      breakMinutes: 15,
      hourlyRate: 25,
      paymentStatus: 'paid',
      paidDate: '2026-09-15',
      notes: 'Opening',
    });
    expect(initialFormValues({ initialShift: editing, workplaces: [cafe] }, '2026-09-19')).toEqual({
      workplaceId: 'w1',
      date: '2026-09-10',
      startTime: '08:00',
      endTime: '12:00',
      breakMinutes: 15,
      paymentStatus: 'paid',
      paidDate: '2026-09-15',
      notes: 'Opening',
      rateInput: '25.00',
    });
  });

  it('falls back to the workplace rate for a shift saved without one', () => {
    const editing = shift({ workplaceId: 'w1', hourlyRate: undefined });
    expect(initialFormValues({ initialShift: editing, workplaces: [cafe] }, '2026-09-19').rateInput).toBe('20.00');
  });
});

describe('computeWorkedTime', () => {
  it('subtracts the break', () => {
    expect(computeWorkedTime('09:00', '17:00', 30)).toMatchObject({ workedMinutes: 450, isOvernight: false });
  });

  it('handles a shift past midnight', () => {
    expect(computeWorkedTime('22:00', '06:00', 0)).toMatchObject({ workedMinutes: 480, isOvernight: true });
  });

  it('reports badly formed times', () => {
    expect(computeWorkedTime('9am', '17:00', 0).error).toMatch(/HH:mm/);
    expect(computeWorkedTime('', '17:00', 0).error).toBeDefined();
  });
});

describe('validateShiftForm', () => {
  const ok = {
    workplaceId: 'w1',
    date: '2026-09-19',
    startTime: '09:00',
    endTime: '17:00',
    paymentStatus: 'unpaid' as const,
    paidDate: '2026-09-19',
  };
  const worked = { workedMinutes: 480, isOvernight: false };

  it('passes a good form', () => {
    expect(validateShiftForm(ok, worked)).toBeNull();
  });

  it('checks in a fixed order and returns the first problem', () => {
    expect(validateShiftForm({ ...ok, workplaceId: '' }, worked)).toMatch(/workplace/);
    expect(validateShiftForm({ ...ok, date: '2026-02-30' }, worked)).toMatch(/shift date/);
    expect(validateShiftForm({ ...ok, startTime: '' }, worked)).toMatch(/required/);
    expect(validateShiftForm(ok, { ...worked, error: 'Break is longer than the shift' })).toBe(
      'Break is longer than the shift',
    );
    expect(validateShiftForm(ok, { workedMinutes: 0, isOvernight: false })).toMatch(/greater than 0/);
  });

  it('only checks the paid date for a paid shift', () => {
    expect(validateShiftForm({ ...ok, paidDate: 'nope' }, worked)).toBeNull();
    expect(validateShiftForm({ ...ok, paymentStatus: 'paid', paidDate: 'nope' }, worked)).toMatch(/paid date/);
  });
});

describe('paidShiftPayChanged', () => {
  const cafe = workplace({ id: 'w1', hourlyRate: 20 });
  const paid = shift({ workplaceId: 'w1', workedMinutes: 480, hourlyRate: 20, paymentStatus: 'paid' });
  const same = { workplaceId: 'w1', workedMinutes: 480, hourlyRate: 20 };

  it('is false for a new shift or one that is not paid', () => {
    expect(paidShiftPayChanged(null, 'paid', [cafe], { ...same, workedMinutes: 1 })).toBe(false);
    expect(paidShiftPayChanged({ ...paid, paymentStatus: 'unpaid' }, 'unpaid', [cafe], { ...same, workedMinutes: 1 })).toBe(false);
  });

  it('is false when it is being marked unpaid', () => {
    expect(paidShiftPayChanged(paid, 'unpaid', [cafe], { ...same, workedMinutes: 1 })).toBe(false);
  });

  it('is true only when the hours, rate or workplace change', () => {
    expect(paidShiftPayChanged(paid, 'paid', [cafe], same)).toBe(false);
    expect(paidShiftPayChanged(paid, 'paid', [cafe], { ...same, workedMinutes: 450 })).toBe(true);
    expect(paidShiftPayChanged(paid, 'paid', [cafe], { ...same, hourlyRate: 22 })).toBe(true);
  });

  it('compares against the workplace rate when the shift has none saved', () => {
    const noRate = { ...paid, hourlyRate: undefined };
    expect(paidShiftPayChanged(noRate, 'paid', [cafe], same)).toBe(false);
  });
});
