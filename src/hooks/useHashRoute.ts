import { useCallback, useEffect, useState } from "react";

/**
 * Tiny hash router (`#/story`, `#/web`, …). No dependency, works on any static host,
 * and every view is deep-linkable. `routes` must be a stable (module-level) array.
 */
export function useHashRoute<T extends string>(routes: readonly T[], fallback: T) {
  const read = useCallback((): T => {
    const hash = window.location.hash.replace(/^#\/?/, "");
    return routes.find((r) => r === hash) ?? fallback;
  }, [routes, fallback]);

  const [route, setRoute] = useState<T>(read);

  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, [read]);

  const navigate = useCallback((next: T) => {
    window.location.hash = `/${next}`;
  }, []);

  return [route, navigate] as const;
}
