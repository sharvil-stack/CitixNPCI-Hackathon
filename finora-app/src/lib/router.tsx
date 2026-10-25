import { createContext, useContext, useEffect, useMemo, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';

// Minimal History-API router (no external dependency). Supports :params, Link, navigate and search params.
type Ctx = { path: string; search: string; navigate: (to: string, opts?: { replace?: boolean }) => void };
const RouterCtx = createContext<Ctx>({ path: '/', search: '', navigate: () => {} });

export function Router({ children }: { children: ReactNode }) {
  const [loc, setLoc] = useState({ path: window.location.pathname, search: window.location.search });
  useEffect(() => {
    const on = () => setLoc({ path: window.location.pathname, search: window.location.search });
    window.addEventListener('popstate', on);
    return () => window.removeEventListener('popstate', on);
  }, []);
  const navigate = (to: string, opts: { replace?: boolean } = {}) => {
    const url = new URL(to, window.location.origin);
    const same = url.pathname === window.location.pathname && url.search === window.location.search;
    if (!same) window.history[opts.replace ? 'replaceState' : 'pushState']({}, '', url.pathname + url.search + url.hash);
    setLoc({ path: url.pathname, search: url.search });
    if (url.pathname !== loc.path) window.scrollTo({ top: 0 });
  };
  const value = useMemo(() => ({ ...loc, navigate }), [loc.path, loc.search]); // eslint-disable-line
  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>;
}

export const useRouter = () => useContext(RouterCtx);
export const useNavigate = () => useContext(RouterCtx).navigate;
export const useSearchParams = () => new URLSearchParams(useContext(RouterCtx).search);

export function Link({ to, onClick, children, ...rest }: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      {...rest}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || rest.target === '_blank') return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split('/').filter(Boolean);
  const b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

export type RouteDef = { path: string; element: (params: Record<string, string>) => ReactNode };
export function Routes({ routes, fallback }: { routes: RouteDef[]; fallback: ReactNode }) {
  const { path } = useRouter();
  for (const r of routes) {
    const params = matchPath(r.path, path);
    if (params) return <>{r.element(params)}</>;
  }
  return <>{fallback}</>;
}
