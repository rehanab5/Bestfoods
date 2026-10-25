import { useRef, useState, useCallback } from "react";

/**
 * Lightweight pull-to-refresh for a window-scrolled page.
 * Only activates when the page is scrolled to the top so it never fights
 * sticky headers or inner scroll containers.
 *
 * @param {Object} opts
 * @param {Function} opts.onRefresh  async callback invoked when the pull passes the threshold
 * @param {number}   opts.threshold  distance (px) required to trigger a refresh (default 70)
 * @param {number}   opts.max        distance (px) at which the pull is clamped (default 120)
 */
export function usePullToRefresh({ onRefresh, threshold = 70, max = 120 }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (refreshing) return;
    if ((document.scrollingElement?.scrollTop ?? 0) > 0) return;
    // Don't activate when the touch begins on a sticky-positioned element
    // (Navbar, CategoryTabs) so the gesture never fights them.
    if (e.target.closest && e.target.closest(".sticky, header")) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [refreshing]);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && (document.scrollingElement?.scrollTop ?? 0) <= 0) {
      e.preventDefault();
      const distance = Math.min(delta * 0.5, max);
      setPull(distance);
    }
  }, [refreshing, max]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pull >= threshold) {
      setRefreshing(true);
      setPull(threshold);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }, [pull, threshold, onRefresh, refreshing]);

  return { pull, refreshing, threshold, onTouchStart, onTouchMove, onTouchEnd };
}