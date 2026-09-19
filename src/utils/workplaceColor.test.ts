import { workplaceColor } from './workplaceColor';

describe('workplaceColor', () => {
  it('maps the old preset colours to the new ones, ignoring case', () => {
    expect(workplaceColor('#3B82F6', '#000000')).toBe('#3E6B99');
    expect(workplaceColor('#10b981', '#000000')).toBe('#5F8A5B');
  });

  it('keeps colours the user picked themselves', () => {
    expect(workplaceColor('#123456', '#000000')).toBe('#123456');
  });

  it('falls back when there is no colour', () => {
    expect(workplaceColor(undefined, '#abcdef')).toBe('#abcdef');
    expect(workplaceColor('', '#abcdef')).toBe('#abcdef');
  });
});
