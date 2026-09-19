import { Shift, Workplace } from '@/types';

/**
 * Offline-first sync: every change is applied locally at once and also queued as an operation.
 * The queue is stored on the device and sent to Supabase in order whenever a connection is available.
 * Each operation is idempotent (upserts and deletes by id), so a retry is always safe.
 */

type OpBody =
  | { type: 'upsert_workplace'; workplace: Workplace }
  | { type: 'delete_workplace'; workplaceId: string }
  | { type: 'upsert_shift'; shift: Shift }
  | { type: 'delete_shift'; shiftId: string };

export type SyncOp = OpBody & { id: string };
export type SyncOpBody = OpBody;

export interface SyncData {
  workplaces: Workplace[];
  shifts: Shift[];
}

const entityId = (op: SyncOp): string => {
  switch (op.type) {
    case 'upsert_workplace':
      return op.workplace.id;
    case 'delete_workplace':
      return op.workplaceId;
    case 'upsert_shift':
      return op.shift.id;
    case 'delete_shift':
      return op.shiftId;
  }
};

/**
 * Adds an operation, folding it into what's already queued:
 *  - a newer upsert replaces an older one for the same row *in place*, so the order stays valid
 *    (a shift is never sent before its workplace). It gets a fresh id so that finishing the
 *    older request in flight can't remove the newer data from the queue.
 *  - a delete makes earlier upserts of the same row pointless.
 *  - deleting a workplace also drops queued changes to its shifts.
 */
export function enqueueOp(ops: SyncOp[], body: OpBody, id: string): SyncOp[] {
  const op = { ...body, id } as SyncOp;

  switch (op.type) {
    case 'upsert_workplace':
    case 'upsert_shift': {
      const index = ops.findIndex((o) => o.type === op.type && entityId(o) === entityId(op));
      if (index >= 0) {
        const next = [...ops];
        next[index] = op;
        return next;
      }
      return [...ops, op];
    }
    case 'delete_shift':
      return [
        ...ops.filter((o) => !(o.type === 'upsert_shift' && o.shift.id === op.shiftId)),
        op,
      ];
    case 'delete_workplace':
      return [
        ...ops.filter((o) => {
          if (o.type === 'upsert_workplace') return o.workplace.id !== op.workplaceId;
          if (o.type === 'upsert_shift') return o.shift.workplaceId !== op.workplaceId;
          return true;
        }),
        op,
      ];
  }
}

/** Replays queued operations on top of data fetched from the cloud, so unsynced changes survive a refresh. */
export function applyOps(data: SyncData, ops: SyncOp[]): SyncData {
  let { workplaces, shifts } = data;

  for (const op of ops) {
    switch (op.type) {
      case 'upsert_workplace': {
        const exists = workplaces.some((w) => w.id === op.workplace.id);
        workplaces = exists
          ? workplaces.map((w) => (w.id === op.workplace.id ? op.workplace : w))
          : [...workplaces, op.workplace];
        break;
      }
      case 'delete_workplace':
        workplaces = workplaces.filter((w) => w.id !== op.workplaceId);
        shifts = shifts.filter((s) => s.workplaceId !== op.workplaceId);
        break;
      case 'upsert_shift': {
        const exists = shifts.some((s) => s.id === op.shift.id);
        shifts = exists
          ? shifts.map((s) => (s.id === op.shift.id ? op.shift : s))
          : [op.shift, ...shifts];
        break;
      }
      case 'delete_shift':
        shifts = shifts.filter((s) => s.id !== op.shiftId);
        break;
    }
  }

  return { workplaces, shifts };
}

/**
 * True for errors a retry can never fix (bad data, deleted parent row). Those operations are dropped
 * so one bad change doesn't block the queue. Everything else (no connection, expired token,
 * missing column, server hiccups) is retried, keeping the data safe until it can be sent.
 */
export function isPermanentError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && (code.startsWith('22') || code.startsWith('23'));
}
