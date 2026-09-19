/** Supabase returns at most 1,000 rows per request; stay below any server-side cap. */
export const PAGE_SIZE = 500;

/**
 * Loads every row by asking for consecutive pages until one comes back short.
 * `fetchPage(from, to)` gets inclusive row indexes, as Supabase's `.range()` does.
 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  pageSize: number = PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
