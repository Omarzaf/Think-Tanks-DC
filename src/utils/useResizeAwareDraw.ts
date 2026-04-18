import { useEffect, useRef, useCallback } from 'react';

/**
 * Attaches a ResizeObserver to containerRef and calls drawFn whenever the
 * container size changes. On each observation it uses requestAnimationFrame
 * to defer the call until after the browser has finished layout, so
 * clientWidth/clientHeight are always non-zero when drawFn runs.
 *
 * Also fires once on mount (and whenever drawFn identity changes).
 */
export function useResizeAwareDraw(
  containerRef: React.RefObject<HTMLElement | null>,
  drawFn: () => void,
) {
  // Keep a stable ref to the latest drawFn so the observer never goes stale
  const drawRef = useRef(drawFn);
  useEffect(() => { drawRef.current = drawFn; }, [drawFn]);

  const scheduleRef = useRef<number | null>(null);

  const schedule = useCallback(() => {
    if (scheduleRef.current !== null) cancelAnimationFrame(scheduleRef.current);
    scheduleRef.current = requestAnimationFrame(() => {
      scheduleRef.current = null;
      drawRef.current();
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial draw
    schedule();

    const ro = new ResizeObserver(() => schedule());
    ro.observe(container);

    return () => {
      ro.disconnect();
      if (scheduleRef.current !== null) cancelAnimationFrame(scheduleRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schedule]); // `schedule` is stable; re-run only if ref changes identity
}
