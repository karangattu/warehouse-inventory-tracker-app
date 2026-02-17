"use server";

import { getSession } from "@/lib/auth";
import {
  createStockAdjustment,
  getAllCategories,
  getAllColors,
  getAllUnits,
} from "@/lib/db/queries";
import { db } from "@/lib/db/client";
import { products, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { hashPin } from "@/lib/auth";
import { generateSkuCode } from "@/lib/utils";
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

  const categoryId = formData.get("categoryId") as string;
  const colorId = formData.get("colorId") as string;
  const sizeLabel = formData.get("sizeLabel") as string;
  const unitId = formData.get("unitId") as string;

  if (!categoryId || !colorId || !sizeLabel || !unitId) {
    return { error: "All fields are required." };
  }

  try {
    const cats = await getAllCategories();
    const cols = await getAllColors();
    const uts = await getAllUnits();

    const cat = cats.find((c) => c.id === categoryId);
    const col = cols.find((c) => c.id === colorId);
    const ut = uts.find((u) => u.id === unitId);

    const skuCode = generateSkuCode(
      cat?.name || "",
      col?.name || "",
      sizeLabel,
      ut?.name || ""
    );

    await db.insert(products).values({
      id: ulid(),
      categoryId,
      colorId,
      sizeLabel: sizeLabel.trim(),
      unitId,
      skuCode,
      isActive: 1,
      createdAt: new Date().toISOString(),
    });

    revalidatePath("/admin/products");
    revalidatePath("/browse");

    return { success: `Product created: ${skuCode}` };
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("UNIQUE constraint failed")
    ) {
      return { error: "This product variant already exists." };
    }
    return { error: err instanceof Error ? err.message : "An error occurred." };
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
    if (sizeLabel) updates.sizeLabel = sizeLabel.trim();
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
