import { initialsOf, parseDefaultRate, syncLabel } from './settings';

describe('initialsOf', () => {
  it('takes the first letters of up to two words, in capitals', () => {
    expect(initialsOf('Ada Lovelace')).toBe('AL');
    expect(initialsOf('ada')).toBe('A');
    expect(initialsOf('Jean Luc Picard')).toBe('JL');
  });

  it('ignores extra spaces and falls back to a question mark', () => {
    expect(initialsOf('  Ada   Lovelace ')).toBe('AL');
    expect(initialsOf('')).toBe('?');
    expect(initialsOf('   ')).toBe('?');
  });
});

describe('parseDefaultRate', () => {
  it('saves a new positive rate, accepting a decimal comma', () => {
    expect(parseDefaultRate('20', 18)).toEqual({ kind: 'save', rate: 20 });
    expect(parseDefaultRate('18,5', 18)).toEqual({ kind: 'save', rate: 18.5 });
  });

  it('changes nothing when the rate is the same', () => {
    expect(parseDefaultRate('18', 18)).toEqual({ kind: 'unchanged' });
  });

  it('reverts on empty, non-numeric, zero or negative input', () => {
    for (const input of ['', 'abc', '0', '-3']) {
      expect(parseDefaultRate(input, 18)).toEqual({ kind: 'revert' });
    }
  });
});

describe('syncLabel', () => {
  it('shows how many changes are waiting', () => {
    expect(syncLabel(0)).toBe('Sync Now');
    expect(syncLabel(1)).toBe('Sync Now (1 change waiting)');
    expect(syncLabel(3)).toBe('Sync Now (3 changes waiting)');
  });
});
