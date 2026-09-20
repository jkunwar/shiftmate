import { shift, workplace } from '@/__fixtures__/shifts';
import { summarizeWorkplaceShifts } from './workplaceTotals';

const cafe = workplace({ hourlyRate: 20 });

describe('summarizeWorkplaceShifts', () => {
  it('is all zero with no shifts', () => {
    expect(summarizeWorkplaceShifts([], cafe)).toEqual({
      minutes: 0,
      shiftCount: 0,
      estimated: 0,
      received: 0,
      unpaidMinutes: 0,
      unpaidAmount: 0,
    });
  });

  it('adds up hours, shifts and estimated earnings', () => {
    const result = summarizeWorkplaceShifts(
      [shift({ id: 'a', workedMinutes: 120 }), shift({ id: 'b', workedMinutes: 90 })],
      cafe,
    );
    expect(result.minutes).toBe(210);
    expect(result.shiftCount).toBe(2);
    expect(result.estimated).toBeCloseTo(70);
  });

  it('splits what is unpaid from what has been received', () => {
    const result = summarizeWorkplaceShifts(
      [
        shift({ id: 'a', workedMinutes: 120, paymentStatus: 'unpaid' }),
        shift({ id: 'b', workedMinutes: 60, paymentStatus: 'paid' }),
      ],
      cafe,
    );
    expect(result.unpaidMinutes).toBe(120);
    expect(result.unpaidAmount).toBeCloseTo(40);
    expect(result.received).toBeCloseTo(20);
    expect(result.estimated).toBeCloseTo(60);
  });

  it('counts the amount actually received for a paid shift when one was recorded', () => {
    const result = summarizeWorkplaceShifts(
      [shift({ workedMinutes: 60, paymentStatus: 'paid', actualPaidAmount: 25 })],
      cafe,
    );
    expect(result.received).toBe(25);
    expect(result.estimated).toBeCloseTo(20);
  });

  it('keeps a recorded amount of zero instead of falling back to the estimate', () => {
    const result = summarizeWorkplaceShifts(
      [shift({ workedMinutes: 60, paymentStatus: 'paid', actualPaidAmount: 0 })],
      cafe,
    );
    expect(result.received).toBe(0);
  });

  it('uses each shift’s own rate over the workplace rate', () => {
    const result = summarizeWorkplaceShifts([shift({ workedMinutes: 60, hourlyRate: 30 })], cafe);
    expect(result.estimated).toBeCloseTo(30);
  });
});
