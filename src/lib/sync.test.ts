import { shift, workplace } from '@/__fixtures__/shifts';
import { applyOps, enqueueOp, isPermanentError, type SyncOp } from './sync';

const upsertShift = (id: string, overrides = {}) => ({
  type: 'upsert_shift' as const,
  shift: shift({ id, ...overrides }),
});

describe('enqueueOp', () => {
  it('appends new operations in order', () => {
    let ops: SyncOp[] = [];
    ops = enqueueOp(ops, { type: 'upsert_workplace', workplace: workplace() }, 'op1');
    ops = enqueueOp(ops, upsertShift('s1'), 'op2');
    expect(ops.map((o) => o.type)).toEqual(['upsert_workplace', 'upsert_shift']);
  });

  it('folds a newer upsert of the same row into the old one, in place', () => {
    let ops: SyncOp[] = [];
    ops = enqueueOp(ops, upsertShift('s1', { notes: 'old' }), 'op1');
    ops = enqueueOp(ops, upsertShift('s2'), 'op2');
    ops = enqueueOp(ops, upsertShift('s1', { notes: 'new' }), 'op3');

    expect(ops).toHaveLength(2);
    // Same position, so a shift is never sent before the workplace queued ahead of it
    expect(ops[0].type === 'upsert_shift' && ops[0].shift.notes).toBe('new');
    // Fresh id: finishing the old in-flight request must not remove the newer data
    expect(ops[0].id).toBe('op3');
  });

  it('drops queued upserts of a shift that is then deleted', () => {
    let ops: SyncOp[] = [];
    ops = enqueueOp(ops, upsertShift('s1'), 'op1');
    ops = enqueueOp(ops, upsertShift('s2'), 'op2');
    ops = enqueueOp(ops, { type: 'delete_shift', shiftId: 's1' }, 'op3');

    expect(ops.map((o) => o.type)).toEqual(['upsert_shift', 'delete_shift']);
    expect(ops[0].type === 'upsert_shift' && ops[0].shift.id).toBe('s2');
  });

  it("deleting a workplace drops queued changes to it and its shifts", () => {
    let ops: SyncOp[] = [];
    ops = enqueueOp(ops, { type: 'upsert_workplace', workplace: workplace({ id: 'w1' }) }, 'op1');
    ops = enqueueOp(ops, upsertShift('s1', { workplaceId: 'w1' }), 'op2');
    ops = enqueueOp(ops, upsertShift('s2', { workplaceId: 'w2' }), 'op3');
    ops = enqueueOp(ops, { type: 'delete_workplace', workplaceId: 'w1' }, 'op4');

    expect(ops.map((o) => o.id)).toEqual(['op3', 'op4']);
  });

  it('does not change the list it was given', () => {
    const ops: SyncOp[] = [];
    enqueueOp(ops, upsertShift('s1'), 'op1');
    expect(ops).toHaveLength(0);
  });
});

describe('applyOps', () => {
  const cloud = {
    workplaces: [workplace({ id: 'w1', name: 'Cloud Cafe' })],
    shifts: [shift({ id: 's1', notes: 'cloud' }), shift({ id: 's2' })],
  };

  it('keeps unsynced additions and edits on top of cloud data', () => {
    const ops: SyncOp[] = [
      { id: '1', ...upsertShift('s1', { notes: 'edited offline' }) },
      { id: '2', ...upsertShift('s3') },
      { id: '3', type: 'upsert_workplace', workplace: workplace({ id: 'w2', name: 'New' }) },
    ];
    const result = applyOps(cloud, ops);

    expect(result.shifts.find((s) => s.id === 's1')?.notes).toBe('edited offline');
    expect(result.shifts.map((s) => s.id)).toContain('s3');
    expect(result.workplaces.map((w) => w.id)).toEqual(['w1', 'w2']);
  });

  it('keeps offline deletes from reappearing', () => {
    const ops: SyncOp[] = [{ id: '1', type: 'delete_shift', shiftId: 's2' }];
    expect(applyOps(cloud, ops).shifts.map((s) => s.id)).toEqual(['s1']);
  });

  it("removes a deleted workplace's shifts too", () => {
    const ops: SyncOp[] = [{ id: '1', type: 'delete_workplace', workplaceId: 'w1' }];
    const result = applyOps(cloud, ops);
    expect(result.workplaces).toEqual([]);
    expect(result.shifts).toEqual([]);
  });

  it('returns the cloud data untouched when nothing is pending', () => {
    expect(applyOps(cloud, [])).toEqual(cloud);
  });
});

describe('isPermanentError', () => {
  it('drops data and constraint errors', () => {
    expect(isPermanentError({ code: '23503' })).toBe(true); // foreign key
    expect(isPermanentError({ code: '22P02' })).toBe(true); // bad input
    expect(isPermanentError({ code: '42501' })).toBe(true); // row-level security rejection
  });

  it('retries everything else', () => {
    expect(isPermanentError({ code: 'PGRST301' })).toBe(false); // expired token
    expect(isPermanentError({ code: 'PGRST204' })).toBe(false); // missing column
    expect(isPermanentError(new Error('Network request failed'))).toBe(false);
    expect(isPermanentError(null)).toBe(false);
  });
});
