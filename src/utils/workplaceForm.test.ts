import { workplace } from '@/__fixtures__/shifts';
import {
  DEFAULT_SCHEDULE,
  initialWorkplaceValues,
  PRESET_COLORS,
  setScheduleTime,
  toggleScheduleDay,
  validateWorkplaceForm,
} from './workplaceForm';

describe('initialWorkplaceValues', () => {
  it('starts a new workplace blank, with the default rate, colour and schedule', () => {
    expect(initialWorkplaceValues(null, 18)).toEqual({
      name: '',
      address: '',
      hourlyRate: '18.00',
      notes: '',
      color: PRESET_COLORS[0],
      schedule: DEFAULT_SCHEDULE,
    });
  });

  it('leaves the rate blank when there is no default', () => {
    expect(initialWorkplaceValues(null).hourlyRate).toBe('');
    expect(initialWorkplaceValues(null, 0).hourlyRate).toBe('');
  });

  it('fills the form from the workplace being edited, not from the default rate', () => {
    const editing = workplace({ name: 'Cafe', address: '1 High St', hourlyRate: 22, notes: 'Side door', color: '#123456' });
    expect(initialWorkplaceValues(editing, 18)).toMatchObject({
      name: 'Cafe',
      address: '1 High St',
      hourlyRate: '22.00',
      notes: 'Side door',
      color: '#123456',
      schedule: DEFAULT_SCHEDULE,
    });
  });

  it('shows an old bright preset colour as its earthy replacement', () => {
    expect(initialWorkplaceValues(workplace({ color: '#3B82F6' })).color).toBe('#3E6B99');
  });
});

describe('validateWorkplaceForm', () => {
  const ok = { name: 'Cafe', hourlyRate: '18.50', schedule: DEFAULT_SCHEDULE };

  it('returns the parsed rate for a good form', () => {
    expect(validateWorkplaceForm(ok)).toEqual({ ok: true, rate: 18.5 });
    expect(validateWorkplaceForm({ ...ok, hourlyRate: '18,5' })).toEqual({ ok: true, rate: 18.5 });
  });

  it('allows a blank rate', () => {
    expect(validateWorkplaceForm({ ...ok, hourlyRate: '  ' })).toEqual({ ok: true, rate: undefined });
  });

  it('requires a name', () => {
    expect(validateWorkplaceForm({ ...ok, name: '   ' })).toEqual({ ok: false, error: 'Workplace name is required' });
  });

  it('rejects a rate that is not a non-negative number', () => {
    for (const hourlyRate of ['abc', '-2']) {
      expect(validateWorkplaceForm({ ...ok, hourlyRate })).toEqual({ ok: false, error: 'Please enter a valid hourly rate' });
    }
  });

  it('names the first active day with badly formed times', () => {
    const schedule = DEFAULT_SCHEDULE.map((d) => (d.dayName === 'Wednesday' ? { ...d, startTime: '9am' } : d));
    expect(validateWorkplaceForm({ ...ok, schedule })).toEqual({
      ok: false,
      error: "Enter Wednesday's times as HH:mm (24-hour), e.g. 16:00",
    });
  });

  it('ignores bad times on days that are switched off', () => {
    const schedule = DEFAULT_SCHEDULE.map((d) => (d.dayName === 'Tuesday' ? { ...d, startTime: 'x' } : d));
    expect(validateWorkplaceForm({ ...ok, schedule }).ok).toBe(true);
  });
});

describe('schedule edits', () => {
  it('toggles one day without touching the others or the original', () => {
    const next = toggleScheduleDay(DEFAULT_SCHEDULE, 1);
    expect(next[1].active).toBe(true);
    expect(next.filter((d, i) => i !== 1 && d.active !== DEFAULT_SCHEDULE[i].active)).toEqual([]);
    expect(DEFAULT_SCHEDULE[1].active).toBe(false);
  });

  it('changes one day’s start or end time', () => {
    const next = setScheduleTime(DEFAULT_SCHEDULE, 0, 'endTime', '22:00');
    expect(next[0].endTime).toBe('22:00');
    expect(next[0].startTime).toBe('16:00');
    expect(DEFAULT_SCHEDULE[0].endTime).toBe('21:00');
  });
});
