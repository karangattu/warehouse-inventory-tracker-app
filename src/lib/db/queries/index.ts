import { db } from "../client";
import {
  products,
  categories,
  colors,
  units,
  transactions,
  stockAdjustments,
  users,
} from "../schema";
import { eq, desc, and, sql, or, like } from "drizzle-orm";
import { ulid } from "ulid";

// ─── Stock Balance ───────────────────────────────────────────

async function getStockBalanceMap() {
  const rows = await db
    .select({
      productId: transactions.productId,
      balance: sql<number>`coalesce(sum(case when ${transactions.direction} = 'in' then ${transactions.quantity} else -${transactions.quantity} end), 0)`,
    })
    .from(transactions)
    .groupBy(transactions.productId);

  return new Map(rows.map((row) => [row.productId, Number(row.balance) || 0]));
}

export async function getStockBalance(productId: string): Promise<number> {
  const result = await db
    .select({
      balance: sql<number>`coalesce(sum(case when ${transactions.direction} = 'in' then ${transactions.quantity} else -${transactions.quantity} end), 0)`,
    })
    .from(transactions)
    .where(eq(transactions.productId, productId));

  return Number(result[0]?.balance) || 0;
}

// ─── Products ────────────────────────────────────────────────

export async function getActiveProducts() {
  return db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      colorId: products.colorId,
      sizeLabel: products.sizeLabel,
      unitId: products.unitId,
      skuCode: products.skuCode,
      isActive: products.isActive,
      categoryName: categories.name,
      colorName: colors.name,
      colorHex: colors.hexCode,
      unitName: units.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(colors, eq(products.colorId, colors.id))
    .innerJoin(units, eq(products.unitId, units.id))
    .where(eq(products.isActive, 1))
    .orderBy(categories.name, colors.name, products.sizeLabel);
}

export async function getAllProducts() {
  return db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      colorId: products.colorId,
      sizeLabel: products.sizeLabel,
      unitId: products.unitId,
      skuCode: products.skuCode,
      isActive: products.isActive,
      categoryName: categories.name,
      colorName: colors.name,
      colorHex: colors.hexCode,
      unitName: units.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(colors, eq(products.colorId, colors.id))
    .innerJoin(units, eq(products.unitId, units.id))
    .orderBy(categories.name, colors.name, products.sizeLabel);
}

export async function getProductById(id: string) {
  const result = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      colorId: products.colorId,
      sizeLabel: products.sizeLabel,
      unitId: products.unitId,
      skuCode: products.skuCode,
      isActive: products.isActive,
      categoryName: categories.name,
      colorName: colors.name,
      colorHex: colors.hexCode,
      unitName: units.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(colors, eq(products.colorId, colors.id))
    .innerJoin(units, eq(products.unitId, units.id))
    .where(eq(products.id, id))
    .limit(1);

  return result[0] || null;
}

export async function searchProducts(query: string) {
  const searchTerm = `%${query}%`;
  return db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      colorId: products.colorId,
      sizeLabel: products.sizeLabel,
      unitId: products.unitId,
      skuCode: products.skuCode,
      isActive: products.isActive,
      categoryName: categories.name,
      colorName: colors.name,
      colorHex: colors.hexCode,
      unitName: units.name,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(colors, eq(products.colorId, colors.id))
    .innerJoin(units, eq(products.unitId, units.id))
    .where(
      and(
        eq(products.isActive, 1),
        or(
          like(categories.name, searchTerm),
          like(colors.name, searchTerm),
          like(products.sizeLabel, searchTerm),
          like(units.name, searchTerm),
          like(products.skuCode, searchTerm)
        )
      )
    )
    .orderBy(categories.name, colors.name, products.sizeLabel)
    .limit(50);
}

// ─── Products with stock balances ────────────────────────────

export async function getProductsWithStock() {
  const allProducts = await getActiveProducts();
  const balanceMap = await getStockBalanceMap();

  const productsWithStock = allProducts.map((product) => ({
    ...product,
    stockBalance: balanceMap.get(product.id) ?? 0,
  }));

  return productsWithStock;
}

// ─── Transactions ────────────────────────────────────────────

export async function getRecentTransactions(limit: number = 10) {
  return db
    .select({
      id: transactions.id,
      productId: transactions.productId,
      direction: transactions.direction,
      quantity: transactions.quantity,
      balanceAfter: transactions.balanceAfter,
      note: transactions.note,
      enteredBy: transactions.enteredBy,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
      colorName: colors.name,
      sizeLabel: products.sizeLabel,
      unitName: units.name,
      skuCode: products.skuCode,
      userName: users.name,
    })
    .from(transactions)
    .innerJoin(products, eq(transactions.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(colors, eq(products.colorId, colors.id))
    .innerJoin(units, eq(products.unitId, units.id))
    .innerJoin(users, eq(transactions.enteredBy, users.id))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export async function getRecentTransactionsByUser(
  userId: string,
  limit: number = 10
) {
  return db
    .select({
      id: transactions.id,
      productId: transactions.productId,
      direction: transactions.direction,
      quantity: transactions.quantity,
      balanceAfter: transactions.balanceAfter,
      note: transactions.note,
      enteredBy: transactions.enteredBy,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
      colorName: colors.name,
      sizeLabel: products.sizeLabel,
      unitName: units.name,
      skuCode: products.skuCode,
      userName: users.name,
    })
    .from(transactions)
    .innerJoin(products, eq(transactions.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(colors, eq(products.colorId, colors.id))
    .innerJoin(units, eq(products.unitId, units.id))
    .innerJoin(users, eq(transactions.enteredBy, users.id))
    .where(eq(transactions.enteredBy, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export async function getProductTransactions(productId: string) {
  return db
    .select({
      id: transactions.id,
      direction: transactions.direction,
      quantity: transactions.quantity,
      balanceAfter: transactions.balanceAfter,
      note: transactions.note,
      createdAt: transactions.createdAt,
      userName: users.name,
    })
    .from(transactions)
    .innerJoin(users, eq(transactions.enteredBy, users.id))
    .where(eq(transactions.productId, productId))
    .orderBy(desc(transactions.createdAt));
}

export async function createTransaction(data: {
  productId: string;
  direction: "in" | "out";
  quantity: number;
  note?: string;
  enteredBy: string;
  idempotencyKey: string;
}) {
  const currentBalance = await getStockBalance(data.productId);

  if (data.direction === "out" && data.quantity > currentBalance) {
    throw new Error(
      `Cannot dispatch ${data.quantity} — only ${currentBalance} in stock.`
    );
  }

  const newBalance =
    data.direction === "in"
      ? currentBalance + data.quantity
      : currentBalance - data.quantity;

  const id = ulid();
  const now = new Date().toISOString();

  await db.insert(transactions).values({
    id,
    productId: data.productId,
    direction: data.direction,
    quantity: data.quantity,
    balanceAfter: newBalance,
    note: data.note || null,
    enteredBy: data.enteredBy,
    idempotencyKey: data.idempotencyKey,
    createdAt: now,
  });

  return {
    id,
    balanceAfter: newBalance,
    previousBalance: currentBalance,
  };
}

// ─── Dashboard Stats ─────────────────────────────────────────

export async function getDashboardStats() {
  const allProducts = await getActiveProducts();
  const balanceMap = await getStockBalanceMap();

  const totalSkus = allProducts.length;
  let totalInStock = 0;
  let negativeStockCount = 0;
  const negativeStockItems: Array<{
    id: string;
    name: string;
    balance: number;
  }> = [];

  for (const product of allProducts) {
    const balance = balanceMap.get(product.id) ?? 0;
    totalInStock += balance;

    if (balance < 0) {
      negativeStockCount++;
      negativeStockItems.push({
        id: product.id,
        name: `${product.categoryName} - ${product.colorName} ${product.sizeLabel} (${product.unitName})`,
        balance,
      });
    }
  }

  const todayTransactions = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(
      sql`date(datetime(${transactions.createdAt}, '+5 hours', '+30 minutes')) = date('now', '+5 hours', '+30 minutes')`
    );

  return {
    totalSkus,
    totalInStock: Math.round(totalInStock * 100) / 100,
    negativeStockCount,
    transactionsToday: todayTransactions[0]?.count ?? 0,
    negativeStockItems,
  };
}

export async function getTodayTransactionsCountIST(): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(
      sql`date(datetime(${transactions.createdAt}, '+5 hours', '+30 minutes')) = date('now', '+5 hours', '+30 minutes')`
    );

  return Number(result[0]?.count) || 0;
}

// ─── Stock Adjustments ───────────────────────────────────────

export async function createStockAdjustment(data: {
  productId: string;
  newBalance: number;
  reason: string;
  adjustedBy: string;
}) {
  const oldBalance = await getStockBalance(data.productId);
  const adjustmentId = ulid();
  const transactionId = ulid();
  const now = new Date().toISOString();

  await db.insert(stockAdjustments).values({
    id: adjustmentId,
    productId: data.productId,
    oldBalance,
    newBalance: data.newBalance,
    reason: data.reason,
    adjustedBy: data.adjustedBy,
    createdAt: now,
  });

  // Create a corrective transaction
  const diff = data.newBalance - oldBalance;
  if (diff !== 0) {
    await db.insert(transactions).values({
      id: transactionId,
      productId: data.productId,
      direction: diff > 0 ? "in" : "out",
      quantity: Math.abs(diff),
      balanceAfter: data.newBalance,
      note: `Stock adjustment: ${data.reason}`,
      enteredBy: data.adjustedBy,
      idempotencyKey: `adj:${adjustmentId}`,
      createdAt: now,
    });
  }

  return { adjustmentId, oldBalance, newBalance: data.newBalance };
}

// ─── Categories, Colors, Units ───────────────────────────────

export async function getAllCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

export async function getAllColors() {
  return db.select().from(colors).orderBy(colors.name);
}

export async function getAllUnits() {
  return db.select().from(units).orderBy(units.name);
}

// ─── Users ───────────────────────────────────────────────────

export async function getUserByPin(pinHash: string) {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.pinHash, pinHash), eq(users.isActive, 1)))
    .limit(1);

  return result[0] || null;
}

export async function getAllUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(users.name);
}

export async function getUserById(id: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0] || null;
}
