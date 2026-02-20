"use server";

import { getSession } from "@/lib/auth";
import {
  createCategory,
  createStockAdjustment,
  getAllCategories,
  getAllColors,
  getAllUnits,
} from "@/lib/db/queries";
import { db } from "@/lib/db/client";
import { categories, colors, products, transactions, units, users } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { hashPin } from "@/lib/auth";
import { generateSkuCode, normalizeSizeLabel, sizeLabelMatches } from "@/lib/utils";
import { revalidatePath } from "next/cache";

export async function adjustStockAction(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Admin access required." };
  }

  const productId = formData.get("productId") as string;
  const newBalanceStr = formData.get("newBalance") as string;
  const reason = formData.get("reason") as string;

  if (!productId || !newBalanceStr || !reason) {
    return { error: "All fields are required." };
  }

  const newBalance = parseFloat(newBalanceStr);
  if (isNaN(newBalance)) {
    return { error: "Invalid balance value." };
  }

  try {
    const result = await createStockAdjustment({
      productId,
      newBalance,
      reason,
      adjustedBy: session.id,
    });

    revalidatePath("/");
    revalidatePath("/browse");

    return {
      success: `Stock adjusted: ${result.oldBalance} → ${result.newBalance}`,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "An error occurred." };
  }
}

export async function createProductAction(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Admin access required." };
  }

  let categoryId = formData.get("categoryId") as string;
  const newCategoryName = formData.get("newCategoryName") as string;
  const colorId = formData.get("colorId") as string;
  const rawSizeLabel = formData.get("sizeLabel") as string;
  const unitId = formData.get("unitId") as string;
  const skipDuplicateCheck = formData.get("skipDuplicateCheck") === "true";

  // Handle new category creation
  if (categoryId === "__new__") {
    if (!newCategoryName?.trim()) {
      return { error: "New category name is required." };
    }
    // Check if category with this name already exists (case-insensitive)
    const existingCats = await getAllCategories();
    const existing = existingCats.find(
      (c) => c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );
    if (existing) {
      return { error: `Category "${existing.name}" already exists. Please select it from the dropdown.` };
    }
    try {
      const newCat = await createCategory(newCategoryName);
      categoryId = newCat.id;
    } catch (err) {
      return { error: "Failed to create new category." };
    }
  }

  if (!categoryId || !colorId || !rawSizeLabel || !unitId) {
    return { error: "All fields are required." };
  }

  // Normalize the size label to prevent near-duplicates like "9mm" vs "9 mm"
  const sizeLabel = normalizeSizeLabel(rawSizeLabel);

  try {
    // Check for exact and near-duplicate products (same category, color, unit)
    const existingProducts = await db
      .select({ id: products.id, sizeLabel: products.sizeLabel, skuCode: products.skuCode })
      .from(products)
      .where(
        and(
          eq(products.categoryId, categoryId),
          eq(products.colorId, colorId),
          eq(products.unitId, unitId)
        )
      );

    // Block exact duplicates (same normalized size label)
    const exactDuplicate = existingProducts.find(
      (p) => sizeLabelMatches(p.sizeLabel, sizeLabel)
    );

    if (exactDuplicate) {
      return {
        error: `This product variant already exists (size "${exactDuplicate.sizeLabel}").`,
      };
    }

    // Warn about near-duplicates (similar but not identical size labels)
    if (!skipDuplicateCheck) {
      const similarProduct = existingProducts.find(
        (p) => sizeLabelMatches(p.sizeLabel, sizeLabel) && p.sizeLabel !== sizeLabel
      );

      if (similarProduct) {
        return {
          error: `A similar product already exists with size "${similarProduct.sizeLabel}". Your entry "${sizeLabel}" looks like a duplicate. If this is intentional, confirm to proceed.`,
          duplicate: true,
          existingSizeLabel: similarProduct.sizeLabel,
        };
      }
    }

    const cats = await getAllCategories();
    const cols = await getAllColors();
    const uts = await getAllUnits();

    const cat = cats.find((c) => c.id === categoryId);
    const col = cols.find((c) => c.id === colorId);
    const ut = uts.find((u) => u.id === unitId);

    let skuCode = generateSkuCode(
      cat?.name || "",
      col?.name || "",
      sizeLabel,
      ut?.name || ""
    );

    // Handle SKU collision: if another product already has this SKU, append a suffix
    const allSkus = await db
      .select({ skuCode: products.skuCode })
      .from(products)
      .where(eq(products.skuCode, skuCode));

    if (allSkus.length > 0) {
      let suffix = 2;
      while (true) {
        const candidate = `${skuCode}-${suffix}`;
        const conflict = await db
          .select({ skuCode: products.skuCode })
          .from(products)
          .where(eq(products.skuCode, candidate));
        if (conflict.length === 0) {
          skuCode = candidate;
          break;
        }
        suffix++;
      }
    }

    await db.insert(products).values({
      id: ulid(),
      categoryId,
      colorId,
      sizeLabel,
      unitId,
      skuCode,
      isActive: 1,
      createdAt: new Date().toISOString(),
    });

    revalidatePath("/admin/products");
    revalidatePath("/browse");

    return { success: `Product created: ${skuCode}` };
  } catch (err) {
    console.error("createProductAction error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE constraint failed")) {
      return { error: "This product variant already exists." };
    }
    if (msg.includes("FOREIGN KEY constraint failed")) {
      return { error: "Invalid category, color, or unit selection. Please refresh and try again." };
    }
    return { error: "Failed to create product. Please try again." };
  }
}

export async function updateProductAction(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Admin access required." };
  }

  const productId = formData.get("productId") as string;
  const sizeLabel = formData.get("sizeLabel") as string;
  const isActiveStr = formData.get("isActive") as string;

  if (!productId) {
    return { error: "Product ID required." };
  }

  try {
    const updates: Record<string, unknown> = {};
    if (sizeLabel) updates.sizeLabel = normalizeSizeLabel(sizeLabel);
    if (isActiveStr !== null) updates.isActive = isActiveStr === "1" ? 1 : 0;

    await db
      .update(products)
      .set(updates)
      .where(eq(products.id, productId));

    revalidatePath("/admin/products");
    revalidatePath("/browse");

    return { success: "Product updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "An error occurred." };
  }
}

export async function createUserAction(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Admin access required." };
  }

  const name = formData.get("name") as string;
  const pin = formData.get("pin") as string;
  const role = formData.get("role") as string;

  if (!name || !pin || pin.length !== 4) {
    return { error: "Name and 4-digit PIN are required." };
  }

  try {
    const pinHash = await hashPin(pin);
    await db.insert(users).values({
      id: ulid(),
      name: name.trim(),
      pinHash,
      role: role === "admin" ? "admin" : "operator",
      isActive: 1,
      createdAt: new Date().toISOString(),
    });

    revalidatePath("/admin/users");

    return { success: `User "${name}" created.` };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "An error occurred." };
  }
}

export async function toggleUserAction(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Admin access required." };
  }

  const userId = formData.get("userId") as string;
  const newStatus = formData.get("isActive") as string;

  if (!userId) {
    return { error: "User ID required." };
  }

  try {
    await db
      .update(users)
      .set({ isActive: newStatus === "1" ? 1 : 0 })
      .where(eq(users.id, userId));

    revalidatePath("/admin/users");

    return { success: "User status updated." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "An error occurred." };
  }
}

export async function resetPinAction(
  _prevState: { error?: string; success?: string } | null,
  formData: FormData
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Admin access required." };
  }

  const userId = formData.get("userId") as string;
  const newPin = formData.get("newPin") as string;

  if (!userId || !newPin || newPin.length !== 4) {
    return { error: "User ID and 4-digit PIN are required." };
  }

  try {
    const pinHash = await hashPin(newPin);
    await db
      .update(users)
      .set({ pinHash })
      .where(eq(users.id, userId));

    revalidatePath("/admin/users");

    return { success: "PIN reset successfully." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "An error occurred." };
  }
}

// ─── Date-based Transaction Report ───────────────────────────

export async function getTransactionsForDate(dateStr: string) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return { error: "Admin access required.", summary: [], transactions: [] };
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { error: "Invalid date format.", summary: [], transactions: [] };
  }

  // Summary: total in/out for the selected IST day
  const summary = await db
    .select({
      direction: transactions.direction,
      total: sql<number>`sum(${transactions.quantity})`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .where(
      sql`date(datetime(${transactions.createdAt}, '+5 hours', '+30 minutes')) = ${dateStr}`
    )
    .groupBy(transactions.direction);

  // Detailed transactions for that IST day
  const txList = await db
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
    .where(
      sql`date(datetime(${transactions.createdAt}, '+5 hours', '+30 minutes')) = ${dateStr}`
    )
    .orderBy(desc(transactions.createdAt));

  return { error: null, summary, transactions: txList };
}
