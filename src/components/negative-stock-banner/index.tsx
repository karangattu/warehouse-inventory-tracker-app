"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

interface NegativeItem {
  id: string;
  name: string;
  balance: number;
}

interface Props {
  items: NegativeItem[];
}

export function NegativeStockBanner({ items }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left cursor-pointer hover:bg-red-100/60 transition-colors"
      >
        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-800">
            {items.length} item{items.length !== 1 ? "s" : ""} with negative
            stock
          </p>
          <p className="text-xs text-red-600 mt-0.5">
            Tap to {expanded ? "hide" : "view"} details
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-red-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-red-400 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-red-200 divide-y divide-red-100">
          {items
            .sort((a, b) => a.balance - b.balance)
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <p className="text-sm text-red-900 truncate pr-4">{item.name}</p>
                <span className="text-sm font-bold text-red-700 tabular-nums flex-shrink-0">
                  {item.balance}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
