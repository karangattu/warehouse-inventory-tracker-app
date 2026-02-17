import { sqliteTable, text, integer, real, uniqueIndex } from "drizzle-orm/sqlite-core";

// ─── Categories ──────────────────────────────────────────────
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// ─── Colors ──────────────────────────────────────────────────
export const colors = sqliteTable("colors", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  hexCode: text("hex_code"),
});

// ─── Units ───────────────────────────────────────────────────
export const units = sqliteTable("units", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// ─── Products ────────────────────────────────────────────────
export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id),
    colorId: text("color_id")
      .notNull()
      .references(() => colors.id),
    sizeLabel: text("size_label").notNull(),
    unitId: text("unit_id")
      .notNull()
      .references(() => units.id),
    skuCode: text("sku_code").unique(),
    isActive: integer("is_active").default(1),
    createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
  },
  (table) => [
    uniqueIndex("unique_product_variant").on(
      table.categoryId,
      table.colorId,
      table.sizeLabel,
      table.unitId
    ),
  ]
);

// ─── Transactions ────────────────────────────────────────────
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  direction: text("direction", { enum: ["in", "out"] }).notNull(),
  quantity: real("quantity").notNull(),
  balanceAfter: real("balance_after").notNull(),
  note: text("note"),
  enteredBy: text("entered_by")
    .notNull()
    .references(() => users.id),
  idempotencyKey: text("idempotency_key").unique(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// ─── Stock Adjustments ───────────────────────────────────────
export const stockAdjustments = sqliteTable("stock_adjustments", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  oldBalance: real("old_balance").notNull(),
  newBalance: real("new_balance").notNull(),
  reason: text("reason").notNull(),
  adjustedBy: text("adjusted_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// ─── Users ───────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  pinHash: text("pin_hash").notNull(),
  role: text("role", { enum: ["operator", "admin"] }).default("operator"),
  isActive: integer("is_active").default(1),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

// ─── Type helpers ────────────────────────────────────────────
export type Category = typeof categories.$inferSelect;
export type Color = typeof colors.$inferSelect;
export type Unit = typeof units.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type StockAdjustment = typeof stockAdjustments.$inferSelect;
export type User = typeof users.$inferSelect;

export type NewCategory = typeof categories.$inferInsert;
export type NewColor = typeof colors.$inferInsert;
export type NewUnit = typeof units.$inferInsert;
export type NewProduct = typeof products.$inferInsert;
export type NewTransaction = typeof transactions.$inferInsert;
export type NewStockAdjustment = typeof stockAdjustments.$inferInsert;
export type NewUser = typeof users.$inferInsert;
