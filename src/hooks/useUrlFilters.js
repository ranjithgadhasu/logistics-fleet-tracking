import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Keeps filter state in the URL query string so filtered views can be
 * bookmarked, shared and survive a refresh.
 * @param {Record<string,string>} defaults
 */
export function useUrlFilters(defaults) {
  const [params, setParams] = useSearchParams();

  const filters = useMemo(() => {
    const out = { ...defaults };
    Object.keys(defaults).forEach((k) => {
      const v = params.get(k);
      if (v !== null) out[k] = v;
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const setFilter = useCallback(
    (key, value) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!value || value === defaults[key]) next.delete(key);
          else next.set(key, value);
          next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setParams, defaults],
  );

  const clear = useCallback(() => setParams({}, { replace: true }), [setParams]);

  const activeCount = Object.keys(defaults).filter((k) => filters[k] !== defaults[k]).length;

  return { filters, setFilter, clear, activeCount };
}
