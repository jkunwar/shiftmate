/**
 * Workplaces created before the palette change carry the old bright preset colours. They are shown
 * as the matching earthy tone so they don't clash with the rest of the app; custom colours are kept.
 */
const LEGACY_PRESETS: Record<string, string> = {
  '#3B82F6': '#3E6B99',
  '#10B981': '#5F8A5B',
  '#F59E0B': '#C9892B',
  '#8B5CF6': '#8A5A83',
  '#EC4899': '#B5533C',
  '#06B6D4': '#3F8A87',
};

export function workplaceColor(color: string | undefined | null, fallback: string): string {
  if (!color) return fallback;
  return LEGACY_PRESETS[color.toUpperCase()] ?? color;
}
