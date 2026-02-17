import { cn } from "@/lib/utils";
import { getStockStatus, STOCK_STATUS_COLORS } from "@/lib/constants";
import { formatQuantity } from "@/lib/utils";

interface StockBadgeProps {
  balance: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StockBadge({
  balance,
  showLabel = false,
  size = "md",
}: StockBadgeProps) {
  const status = getStockStatus(balance);
  const colorClass = STOCK_STATUS_COLORS[status];

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base font-semibold",
  };

  const labels = {
    healthy: "In Stock",
    zero: "Out of Stock",
    negative: "Negative",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        colorClass,
        sizes[size]
      )}
    >
      {formatQuantity(balance)}
      {showLabel && (
        <span className="ml-1.5 text-xs opacity-75">{labels[status]}</span>
      )}
    </span>
  );
}
