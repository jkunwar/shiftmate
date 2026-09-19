import { useTheme } from '@/hooks/use-theme';

type Theme = ReturnType<typeof useTheme>;

/** Border and fill for a selectable option in the shift form: soft accent when selected. */
export const softChipStyle = (theme: Theme, selected: boolean) => ({
  backgroundColor: selected ? theme.accentSoft : theme.surface,
  borderColor: selected ? theme.accent : theme.border,
});
