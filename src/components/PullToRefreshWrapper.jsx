import React from "react";
import { Loader2 } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useLang } from "@/lib/LanguageContext";

/**
 * Reusable pull-to-refresh wrapper.
 * Renders a spinner indicator at the top and attaches touch handlers
 * to the surrounding container. Only activates when the page is
 * scrolled to the top.
 *
 * @param {Function} onRefresh  async callback invoked when the pull passes the threshold
 * @param {string}   className  classes applied to the outer container
 * @param {React.ReactNode} children
 */
export default function PullToRefreshWrapper({ onRefresh, children, className }) {
  const { t } = useLang();
  const { pull, refreshing, threshold, onTouchStart, onTouchMove, onTouchEnd } = usePullToRefresh({
    onRefresh,
  });

  const progress = Math.min(pull / threshold, 1);
  const label = refreshing
    ? t("ptr.refreshing")
    : pull >= threshold
      ? t("ptr.release")
      : pull > 0
        ? t("ptr.pull")
        : "";

  return (
    <div
      className={className}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex flex-col items-center justify-end overflow-hidden safe-top"
        style={{ height: pull }}
        aria-hidden="true"
      >
        <div
          className="transition-transform duration-200 ease-out"
          style={{ transform: `scale(${progress})` }}
        >
          <Loader2
            className={`w-6 h-6 text-primary ${refreshing || pull > 0 ? "animate-spin" : ""}`}
            style={{ opacity: progress }}
          />
        </div>
        {label && (
          <span
            className="text-xs text-muted-foreground mt-1 transition-opacity duration-200"
            style={{ opacity: progress }}
          >
            {label}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}