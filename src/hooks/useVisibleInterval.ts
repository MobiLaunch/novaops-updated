import { useEffect, useRef } from "react";

/** Runs `fn` now and then every `ms`, but only while the tab is visible; refreshes when it comes back. */
export function useVisibleInterval(fn: () => void, ms: number) {
  const saved = useRef(fn);

  saved.current = fn;
  useEffect(() => {
    const run = () => { if (!document.hidden) saved.current(); };

    run();
    const t = setInterval(run, ms);

    document.addEventListener("visibilitychange", run);

    return () => { clearInterval(t); document.removeEventListener("visibilitychange", run); };
  }, [ms]);
}
