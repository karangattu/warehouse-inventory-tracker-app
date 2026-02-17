export interface ProductWithDetails {
  id: string;
  categoryId: string;
  colorId: string;
  sizeLabel: string;
  unitId: string;
  skuCode: string | null;
  isActive: number | null;
  categoryName: string;
  colorName: string;
  colorHex: string | null;
  unitName: string;
}

export interface ProductWithStock extends ProductWithDetails {
  stockBalance: number;
}

export interface TransactionWithDetails {
  id: string;
  productId: string;
  direction: "in" | "out";
  quantity: number;
  balanceAfter: number;
  note: string | null;
  enteredBy: string;
  createdAt: string | null;
  categoryName: string;
  colorName: string;
  sizeLabel: string;
  unitName: string;
  skuCode: string | null;
  userName: string;
}

export interface DashboardStats {
  totalSkus: number;
  totalInStock: number;
  negativeStockCount: number;
  transactionsToday: number;
  negativeStockItems: Array<{
    id: string;
    name: string;
    balance: number;
  }>;
}

export interface SessionUser {
  id: string;
  name: string;
  role: "operator" | "admin";
}
