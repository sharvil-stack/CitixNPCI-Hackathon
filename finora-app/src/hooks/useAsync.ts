import { useCallback, useEffect, useRef, useState } from 'react';
import { errMsg } from '../services/http';

// Runs an async loader when deps change; exposes loading / error / data / reload; ignores stale responses.
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, set] = useState<{ data: T | null; loading: boolean; error: string | null }>({ data: null, loading: true, error: null });
  const tick = useRef(0);
  const run = useCallback(() => {
    const id = ++tick.current;
    set((s) => ({ ...s, loading: true, error: null }));
    fn().then((data) => { if (id === tick.current) set({ data, loading: false, error: null }); })
      .catch((e) => { if (id === tick.current) set({ data: null, loading: false, error: errMsg(e) }); });
  }, deps); // eslint-disable-line
  useEffect(() => { run(); return () => { tick.current++; }; }, [run]);
  return { ...state, reload: run };
}
