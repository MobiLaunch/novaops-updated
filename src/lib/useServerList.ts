import { useCallback, useEffect, useRef, useState } from "react";

import type { Page } from "./supabase";
import { LIST_PAGE_SIZE } from "./supabase";
import { useDebounced, useRefetchOnFocus } from "./utils";

/**
 * Drives a list that lives on the server: a search box, a page number, and
 * the rows for that page.
 *
 * The search term is debounced, and changing it — or any of the extra filter
 * values in `filters` — sends you back to the first page, since page 4 of the
 * old result set means nothing in the new one.
 */
export function useServerList<T>(
  fetchPage: (page: number, search: string) => Promise<Page<T>>,
  filters: unknown[] = [],
) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = useDebounced(query, 250);
  const resultKey = `${search}|${JSON.stringify(filters)}`;

  // Reset to the first page during the render that changes the search or a
  // filter, so the fetch below runs once with both new values rather than
  // firing for the old page first.
  const [lastKey, setLastKey] = useState(resultKey);

  if (lastKey !== resultKey) {
    setLastKey(resultKey);
    setPage(0);
  }

  // The caller rebuilds this closure every render; keep the latest without
  // making it a dependency that would refetch on every render.
  const latestFetch = useRef(fetchPage);

  useEffect(() => {
    latestFetch.current = fetchPage;
  });

  // Responses can arrive out of order when requests overtake each other, so
  // only the most recent one is allowed to set state.
  const requestId = useRef(0);

  const run = useCallback(async (nextPage: number, nextSearch: string) => {
    const id = ++requestId.current;

    setLoading(true);
    const result = await latestFetch.current(nextPage, nextSearch);

    if (id !== requestId.current) return;
    setLoading(false);
    setError(result.error);
    setRows(result.rows);
    setTotal(result.total);

    // A page past the end — the result shrank under a new filter, or rows
    // were deleted — falls back to the last page that still exists.
    if (result.rows.length === 0 && result.total > 0) {
      const lastPage = Math.max(0, Math.ceil(result.total / LIST_PAGE_SIZE) - 1);

      if (nextPage > lastPage) setPage(lastPage);
    }
  }, []);

  useEffect(() => {
    run(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, resultKey]);

  const reload = useCallback(() => run(page, search), [run, page, search]);

  // Front desk and bench run this side by side — pick the tab back up and it
  // refreshes instead of showing whatever was there when you left.
  useRefetchOnFocus(reload);

  return { query, setQuery, page, setPage, rows, setRows, total, loading, error, reload };
}
