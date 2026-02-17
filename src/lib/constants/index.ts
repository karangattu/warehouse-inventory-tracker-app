export const LARGE_DISPATCH_WARNING_THRESHOLD = 10;
export const LARGE_DISPATCH_ADMIN_FLAG_THRESHOLD = 20;
export const SESSION_DURATION_HOURS = 12;
export const PIN_LENGTH = 4;
export const RECENT_TRANSACTIONS_LIMIT = 10;
export const SEARCH_RESULTS_LIMIT = 50;

export const STOCK_STATUS = {
  HEALTHY: "healthy",
  ZERO: "zero",
  NEGATIVE: "negative",
} as const;

export type StockStatus = (typeof STOCK_STATUS)[keyof typeof STOCK_STATUS];

export function getStockStatus(balance: number): StockStatus {
  if (balance < 0) return STOCK_STATUS.NEGATIVE;
  if (balance === 0) return STOCK_STATUS.ZERO;
  return STOCK_STATUS.HEALTHY;
}

export const STOCK_STATUS_COLORS: Record<StockStatus, string> = {
  healthy: "text-green-800 bg-green-100",
  zero: "text-red-800 bg-red-100",
  negative: "text-red-900 bg-red-200",
};

export const COLOR_HEX_MAP: Record<string, string> = {
  Black: "#000000",
  Blue: "#2563EB",
  Brown: "#92400E",
  Green: "#16A34A",
  Red: "#DC2626",
  Transparent: "#E5E7EB",
  White: "#FFFFFF",
  Yellow: "#EAB308",
  "One color": "#6B7280",
};
