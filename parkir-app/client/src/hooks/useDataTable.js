import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getErrorMessage } from '../lib/api';

/**
 * Hook tabel server-side: pencarian (debounce), sorting, paginasi, filter.
 * @param {string} endpoint contoh: '/users'
 * @param {{ defaultSort?: string, defaultOrder?: 'asc'|'desc', limit?: number, filters?: object }} options
 */
export default function useDataTable(endpoint, options = {}) {
  const {
    defaultSort = 'id',
    defaultOrder = 'desc',
    limit: initialLimit = 10,
    filters: initialFilters = {},
  } = options;

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);
  const [search, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState(defaultSort);
  const [order, setOrder] = useState(defaultOrder);
  const [filters, setFilters] = useState(initialFilters);
  const [refreshKey, setRefreshKey] = useState(0);

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(endpoint, {
          params: {
            page,
            limit,
            search: debouncedSearch || undefined,
            sort,
            order,
            ...filters,
          },
          signal: controller.signal,
        });
        if (!active) return;
        setRows(response.data.data || []);
        setMeta(response.data.meta || null);
      } catch (requestError) {
        if (requestError.code === 'ERR_CANCELED' || !active) return;
        setError(getErrorMessage(requestError, 'Gagal memuat data dari server.'));
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchData();
    return () => {
      active = false;
      controller.abort();
    };
    // filterKey mewakili objek filters agar effect tetap stabil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, page, limit, debouncedSearch, sort, order, filterKey, refreshKey]);

  const setSearch = useCallback((value) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const setFilter = useCallback((name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback((nextFilters = {}) => {
    setFilters(nextFilters);
    setPage(1);
  }, []);

  const handleSort = useCallback((column) => {
    setSort((currentSort) => {
      if (currentSort === column) {
        setOrder((currentOrder) => (currentOrder === 'asc' ? 'desc' : 'asc'));
        return currentSort;
      }
      setOrder('asc');
      return column;
    });
    setPage(1);
  }, []);

  const reload = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return {
    rows,
    meta,
    loading,
    error,
    page,
    limit,
    search,
    sort,
    order,
    filters,
    setPage,
    setSearch,
    setFilter,
    resetFilters,
    handleSort,
    reload,
  };
}
