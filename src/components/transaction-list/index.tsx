import { cn } from "@/lib/utils";
import { formatDate, formatQuantity, formatUserDisplayName } from "@/lib/utils";
import type { TransactionWithDetails } from "@/types";

interface TransactionListProps {
  transactions: TransactionWithDetails[];
  showProduct?: boolean;
  className?: string;
}

export function TransactionList({
  transactions,
  showProduct = true,
  className,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No transactions found
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100 hover:border-gray-200 transition-colors"
        >
          {/* Direction indicator */}
          <div
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
              tx.direction === "in"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            )}
          >
            {tx.direction === "in" ? "IN" : "OUT"}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            {showProduct && (
              <p className="text-sm font-medium text-gray-900 truncate">
                {tx.categoryName} — {tx.colorName} {tx.sizeLabel} ({tx.unitName})
              </p>
            )}
            <p className="text-xs text-gray-500">
              {formatUserDisplayName(tx.userName)} · {tx.createdAt ? formatDate(tx.createdAt) : "—"}
            </p>
            {tx.note && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{tx.note}</p>
            )}
          </div>

          {/* Quantity & balance */}
          <div className="text-right flex-shrink-0">
            <p
              className={cn(
                "text-sm font-semibold",
                tx.direction === "in" ? "text-green-600" : "text-red-600"
              )}
            >
              {tx.direction === "in" ? "+" : "-"}{formatQuantity(tx.quantity)}
            </p>
            <p className="text-xs text-gray-500">
              Bal: {formatQuantity(tx.balanceAfter)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
