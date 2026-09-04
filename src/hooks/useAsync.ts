import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/http';

export interface AsyncState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  /** Re-run the request — used after a mutation changes the data. */
  reload: () => void;
}

/**
 * Load something from the API, with the two things every such hook needs and
 * most forget: it does not write to state after unmount, and a slow earlier
 * request cannot overwrite a fresher one.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const seq = useRef(0);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    const mine = ++seq.current;
    setLoading(true);

    loader()
      .then((result) => {
        if (!alive.current || mine !== seq.current) return;
        setData(result);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!alive.current || mine !== seq.current) return;
        setData(null);
        setError(
          e instanceof ApiError ? e : new ApiError('Something went wrong', 'unknown', 0),
        );
      })
      .finally(() => {
        if (alive.current && mine === seq.current) setLoading(false);
      });
    // The caller owns the dependency list; `loader` is deliberately not in it,
    // because an inline arrow would re-run this on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { data, error, loading, reload };
}
