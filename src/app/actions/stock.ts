"use server";

import { getSession } from "@/lib/auth";
import {
  createTransaction,
  getStockBalance,
  getProductById,
} from "@/lib/db/queries";
import { revalidatePath } from "next/cache";
import { LARGE_DISPATCH_ADMIN_FLAG_THRESHOLD } from "@/lib/constants";
import { db } from "@/lib/db/client";
import { transactions } from "@/lib/db/schema";
import { and, eq, like } from "drizzle-orm";

export async function stockEntryAction(
  _prevState: { error?: string; success?: string; balanceAfter?: number } | null,
  formData: FormData
) {
  const session = await getSession();
  if (!session) {
    return { error: "Not authenticated. Please log in." };
  }

  const productId = formData.get("productId") as string;
  const direction = formData.get("direction") as "in" | "out";
  const quantityStr = formData.get("quantity") as string;
  const note = formData.get("note") as string;
  const idempotencyKey = formData.get("idempotencyKey") as string;

  if (!productId || !direction || !quantityStr || !idempotencyKey) {
    return { error: "Missing required fields." };
  }

  const quantity = parseFloat(quantityStr);
  if (isNaN(quantity) || quantity <= 0) {
    return { error: "Quantity must be a positive number." };
  }

  // Verify product exists and is active
  const product = await getProductById(productId);
  if (!product || product.isActive !== 1) {
    return { error: "Product not found or inactive." };
  }

  // For OUT: check stock — also blocks dispatching when balance is already negative
  if (direction === "out") {
    const currentBalance = await getStockBalance(productId);
    if (currentBalance <= 0) {
      return {
        error: `This item's stock is currently in deficit (${currentBalance}). Please receive stock before dispatching.`,
      };
    }
    if (quantity > currentBalance) {
      return {
        error: `Cannot dispatch ${quantity} — only ${currentBalance} in stock. Enter ${currentBalance} or less.`,
      };
    }
  }

  try {
    const result = await createTransaction({
      productId,
      direction,
      quantity,
      note: note || undefined,
      enteredBy: session.id,
      idempotencyKey,
    });

    // Flag large dispatches for admin review
    if (direction === "out" && quantity > LARGE_DISPATCH_ADMIN_FLAG_THRESHOLD) {
      console.warn(
        `[ADMIN FLAG] Large dispatch: ${quantity} units of product ${productId} by ${session.name}`
      );
    }

    revalidatePath("/");
    revalidatePath("/browse");

    const productName = `${product.categoryName} ${product.colorName} ${product.sizeLabel} ${product.unitName}`;

    if (direction === "in") {
      return {
        success: `Received ${quantity} × ${productName} — Stock: ${result.balanceAfter}`,
        balanceAfter: result.balanceAfter,
      };
    } else {
      return {
        success: `Dispatched ${quantity} × ${productName} — Stock: ${result.balanceAfter} remaining`,
        balanceAfter: result.balanceAfter,
      };
    }
  } catch (err) {
    if (err instanceof Error) {
      // Idempotency key conflict
      if (err.message.includes("UNIQUE constraint failed")) {
        return { error: "Duplicate submission detected. Entry already recorded." };
      }
      return { error: err.message };
    }
    return { error: "An unexpected error occurred." };
  }
}

export async function undoTransactionAction(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return;
  }

  const transactionId = formData.get("transactionId") as string;
  if (!transactionId) {
    return;
  }

  const original = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);

  const tx = original[0];
  if (!tx) {
    return;
  }

  if (tx.enteredBy !== session.id && session.role !== "admin") {
    return;
  }

  if (tx.note?.startsWith("Undo of ")) {
    return;
  }

  const existingUndo = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.productId, tx.productId),
        like(transactions.note, `Undo of ${tx.id}%`)
      )
    )
    .limit(1);

  if (existingUndo.length > 0) {
    return;
  }

  const reverseDirection = tx.direction === "in" ? "out" : "in";

  if (reverseDirection === "out") {
    const currentBalance = await getStockBalance(tx.productId);
    if (tx.quantity > currentBalance) {
      return;
    }
  }

  await createTransaction({
    productId: tx.productId,
    direction: reverseDirection,
    quantity: tx.quantity,
    note: `Undo of ${tx.id}`,
    enteredBy: session.id,
    idempotencyKey: `undo:${tx.id}:${Date.now()}`,
  });

  revalidatePath("/");
  revalidatePath("/browse");
}
