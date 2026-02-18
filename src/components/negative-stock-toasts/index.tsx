"use client";

/**
 * NegativeStockToasts
 *
 * Shows a persistent warning toast for every product whose stock is negative.
 * Polls the server every 30 s.  When a product's balance climbs back to ≥ 0
 * the toast briefly flashes green ("✓ Fixed!") before auto-dismissing.
 *
 * Manually dismissed toasts are suppressed until the page is refreshed or the
 * item goes back to 0 / positive (at which point the "Fixed" flash occurs).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNegativeStockItemsAction } from "@/app/actions/stock";

interface NegativeItem {
  id: string;
  name: string;
  balance: number;
}

type ToastState =
  | { phase: "visible"; item: NegativeItem }
  | { phase: "resolved"; item: NegativeItem }
  | { phase: "dismissed" };   // manually dismissed — no longer rendered

type ToastMap = Map<string, ToastState>;

const POLL_INTERVAL_MS = 30_000;
const RESOLVE_FLASH_MS  = 2_200;   // how long the "Fixed!" flash is shown

interface Props {
  initialItems: NegativeItem[];
}

export function NegativeStockToasts({ initialItems }: Props) {
  const [toasts, setToasts] = useState<ToastMap>(() => {
    const map: ToastMap = new Map();
    for (const item of initialItems) {
      map.set(item.id, { phase: "visible", item });
    }
    return map;
  });

  // Track ids that were manually dismissed so poll doesn't re-show them
  const dismissedIds = useRef<Set<string>>(new Set());

  const reconcile = useCallback(
    (freshItems: NegativeItem[]) => {
      const freshIds = new Set(freshItems.map((i) => i.id));

      setToasts((prev) => {
        const next: ToastMap = new Map(prev);

        // Update / add items still negative
        for (const item of freshItems) {
          if (dismissedIds.current.has(item.id)) continue;
          const existing = next.get(item.id);
          if (existing?.phase === "dismissed") continue;
          next.set(item.id, { phase: "visible", item });
        }

        // Mark items that just went non-negative as "resolved"
        for (const [id, state] of prev) {
          if (state.phase === "visible" && !freshIds.has(id)) {
            next.set(id, { phase: "resolved", item: state.item });
            // Auto-remove after flash duration
            setTimeout(() => {
              setToasts((m) => {
                const updated = new Map(m);
                updated.delete(id);
                return updated;
              });
            }, RESOLVE_FLASH_MS);
          }
        }

        return next;
      });
    },
    []
  );

  // Polling
  useEffect(() => {
    const poll = async () => {
      try {
        const items = await getNegativeStockItemsAction();
        reconcile(items);
      } catch {
        // silently ignore network errors
      }
    };

    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reconcile]);

  const dismiss = (id: string) => {
    dismissedIds.current.add(id);
    setToasts((prev) => {
      const next = new Map(prev);
      next.set(id, { phase: "dismissed" });
      return next;
    });
  };

  // Render only visible / resolved toasts (not dismissed)
  const visible = [...toasts.entries()]
    .filter(([, s]) => s.phase !== "dismissed")
    .map(([id, s]) => ({
      id,
      state: s as { phase: "visible" | "resolved"; item: NegativeItem },
    }));

  if (visible.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Negative stock alerts"
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full"
    >
      {visible.map(({ id, state }) => {
        const isResolved = state.phase === "resolved";

        return (
          <div
            key={id}
            role="alert"
            className={cn(
              "flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg",
              "transition-all duration-300 ease-in-out",
              isResolved
                ? "bg-green-600 text-white"
                : "bg-amber-500 text-white"
            )}
          >
            {isResolved ? (
              <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              {isResolved ? (
                <>
                  <p className="text-sm font-semibold">Stock restored ✓</p>
                  <p className="text-xs opacity-90 mt-0.5 truncate">
                    {state.item.name}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold">
                    Negative stock: {state.item.balance}
                  </p>
                  <p className="text-xs opacity-90 mt-0.5 truncate">
                    {state.item.name}
                  </p>
                </>
              )}
            </div>

            {!isResolved && (
              <button
                onClick={() => dismiss(id)}
                className="opacity-80 hover:opacity-100 mt-0.5 flex-shrink-0"
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
