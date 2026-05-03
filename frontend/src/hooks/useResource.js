import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { unwrapCollection } from '../api/resources';

export default function useResource(fetcher, params = {}, options = {}) {
  const paramKey = useMemo(() => JSON.stringify(params ?? {}), [params]);
  const mountedRef = useRef(true);
  const [items, setItems] = useState([]);
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(options.enabled === false ? false : true);
  const [error, setError] = useState('');

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (options.enabled === false) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetcher(JSON.parse(paramKey));

      if (!mountedRef.current) return;

      setData(response.data);
      const normalized = unwrapCollection(response.data);
      setItems(normalized.items);
      setMeta(normalized.meta);
    } catch (err) {
      if (!mountedRef.current) return;

      const message = err.response?.data?.message ?? 'Unable to load data.';
      setError(message);
      setData(null);
      setItems([]);
      setMeta(null);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetcher, options.enabled, paramKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, error, items, loading, meta, refresh, setItems };
}
