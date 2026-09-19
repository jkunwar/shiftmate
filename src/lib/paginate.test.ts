import { fetchAllPages } from './paginate';

const source = (count: number) => Array.from({ length: count }, (_, i) => i);
const pageOf = (rows: number[]) => async (from: number, to: number) => rows.slice(from, to + 1);

describe('fetchAllPages', () => {
  it('returns everything when it spans several pages', async () => {
    const rows = source(1234);
    expect(await fetchAllPages(pageOf(rows), 500)).toEqual(rows);
  });

  it('stops after one request when the first page is short', async () => {
    const fetchPage = jest.fn(pageOf(source(10)));
    expect(await fetchAllPages(fetchPage, 500)).toHaveLength(10);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('handles an exact multiple of the page size with one extra empty request', async () => {
    const fetchPage = jest.fn(pageOf(source(1000)));
    expect(await fetchAllPages(fetchPage, 500)).toHaveLength(1000);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it('returns an empty list when there are no rows', async () => {
    expect(await fetchAllPages(pageOf([]), 500)).toEqual([]);
  });

  it('asks for inclusive, consecutive ranges', async () => {
    const fetchPage = jest.fn(pageOf(source(120)));
    await fetchAllPages(fetchPage, 50);
    expect(fetchPage.mock.calls).toEqual([[0, 49], [50, 99], [100, 149]]);
  });

  it('passes a failure straight through', async () => {
    await expect(
      fetchAllPages(async () => {
        throw new Error('offline');
      }),
    ).rejects.toThrow('offline');
  });
});
