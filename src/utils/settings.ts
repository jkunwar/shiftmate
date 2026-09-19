/** Up to two initials from a name, e.g. "Ada Lovelace" -> "AL"; "?" when there is no name. */
export function initialsOf(name: string): string {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || '?'
  );
}

/** What to do with the default hourly rate the user typed. */
export type RateEdit = { kind: 'save'; rate: number } | { kind: 'unchanged' } | { kind: 'revert' };

/**
 * A positive number different from `current` is saved, the same number changes nothing, and
 * anything else (empty, text, zero, negative) goes back to the current value. Some locales'
 * decimal keypads produce "18,5".
 */
export function parseDefaultRate(input: string, current: number): RateEdit {
  const rate = parseFloat(input.replace(',', '.'));
  if (Number.isNaN(rate) || rate <= 0) return { kind: 'revert' };
  return rate === current ? { kind: 'unchanged' } : { kind: 'save', rate };
}

/** The label of the sync row, mentioning how many changes are still waiting to be sent. */
export function syncLabel(pendingChanges: number): string {
  if (pendingChanges <= 0) return 'Sync Now';
  return `Sync Now (${pendingChanges} ${pendingChanges === 1 ? 'change' : 'changes'} waiting)`;
}
