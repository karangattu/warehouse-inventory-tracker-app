"use client";

import { useState, useActionState } from "react";
import { SkuPicker } from "@/components/sku-picker";
import { NumPad } from "@/components/num-pad";
import { StockBadge } from "@/components/stock-badge";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { stockEntryAction } from "@/app/actions/stock";
import { generateIdempotencyKey } from "@/lib/utils";
import { LARGE_DISPATCH_WARNING_THRESHOLD } from "@/lib/constants";
import type { ProductWithStock, SessionUser } from "@/types";
import { cn } from "@/lib/utils";
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine } from "lucide-react";

interface StockEntryFormProps {
  direction: "in" | "out";
  products: ProductWithStock[];
  user: SessionUser;
}

export function StockEntryForm({
  direction,
  products,
  user,
}: StockEntryFormProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithStock | null>(null);
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [showNoteField, setShowNoteField] = useState(false);
  const [showLargeWarning, setShowLargeWarning] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "warning";
  } | null>(null);
  const [idempotencyKey] = useState(() =>
    generateIdempotencyKey(user.id, "init")
  );
  const [step, setStep] = useState<"pick" | "quantity" | "confirm">("pick");

  const handleActionResult = (
    _prevState: { error?: string; success?: string; balanceAfter?: number } | null,
    formData: FormData
  ) => {
    return stockEntryAction(_prevState, formData).then((result) => {
      if (result?.success) {
        setToast({
          message: result.success,
          type: "success",
        });
        setSelectedProduct(null);
        setQuantity("");
        setNote("");
        setShowNoteField(false);
        setStep("pick");
      } else if (result?.error) {
        setToast({ message: result.error, type: "error" });
      }
      return result;
    });
  };

  const [, formAction, isPending] = useActionState(handleActionResult, null);

  const parsedQty = parseFloat(quantity) || 0;
  const currentStock = selectedProduct?.stockBalance ?? 0;
  const newBalance =
    direction === "in"
      ? currentStock + parsedQty
      : currentStock - parsedQty;
  const isDeficitStock = direction === "out" && currentStock <= 0;
  const isOverdraw = direction === "out" && !isDeficitStock && parsedQty > currentStock;
  const isLargeDispatch =
    direction === "out" && parsedQty > LARGE_DISPATCH_WARNING_THRESHOLD;

  const handleSelectProduct = (product: ProductWithStock) => {
    setSelectedProduct(product);
    setStep("quantity");
  };

  const handleProceedToConfirm = () => {
    if (isLargeDispatch && !showLargeWarning) {
      setShowLargeWarning(true);
      return;
    }
    setShowLargeWarning(false);
    setStep("confirm");
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("quantity");
    } else if (step === "quantity") {
      setStep("pick");
      setSelectedProduct(null);
      setQuantity("");
    }
    setShowLargeWarning(false);
  };

  return (
    <div className="space-y-4">
      {/* Direction banner */}
      <div
        className={cn(
          "rounded-xl p-4 text-center font-bold text-lg inline-flex items-center justify-center gap-2 w-full",
          direction === "in"
            ? "bg-green-600 text-white"
            : "bg-red-600 text-white"
        )}
      >
        {direction === "in" ? (
          <>
            <ArrowDownToLine className="h-5 w-5" />
            STOCK IN
          </>
        ) : (
          <>
            <ArrowUpFromLine className="h-5 w-5" />
            STOCK OUT
          </>
        )}
      </div>

      {/* Step 1: SKU Picker */}
      {step === "pick" && (
        <SkuPicker
          products={products}
          onSelect={handleSelectProduct}
          selectedId={selectedProduct?.id}
        />
      )}

      {/* Step 2: Quantity */}
      {step === "quantity" && selectedProduct && (
        <div className="space-y-4">
          {/* Selected product card */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {selectedProduct.categoryName}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedProduct.colorName} · {selectedProduct.sizeLabel} ·{" "}
                  {selectedProduct.unitName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Current Stock</p>
                <StockBadge
                  balance={selectedProduct.stockBalance}
                  size="lg"
                />
              </div>
            </div>
            <button
              onClick={handleBack}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-md px-3 py-1.5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Change product
            </button>
          </Card>

          {/* Quantity input */}
          <NumPad value={quantity} onChange={setQuantity} />

          {/* Deficit stock warning (balance ≤ 0) */}
          {isDeficitStock && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-red-800">
                Stock in deficit ({currentStock})
              </p>
              <p className="text-xs text-red-600 mt-1">
                Receive stock first before dispatching this item.
              </p>
            </div>
          )}

          {/* Overdraw warning */}
          {isOverdraw && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-red-800">
                Cannot dispatch {parsedQty} — only {currentStock} in stock.
              </p>
              <p className="text-xs text-red-600 mt-1">
                Enter {currentStock} or less.
              </p>
            </div>
          )}

          {/* Large dispatch warning */}
          {showLargeWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-sm font-semibold text-amber-800">
                Large dispatch: {parsedQty} units of{" "}
                {selectedProduct.categoryName} {selectedProduct.colorName}{" "}
                {selectedProduct.sizeLabel}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Are you sure? Tap &quot;Continue&quot; again to confirm.
              </p>
            </div>
          )}

          {/* Note field */}
          {showNoteField ? (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          ) : (
            <button
              onClick={() => setShowNoteField(true)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              + Add a note
            </button>
          )}

          <Button
            size="xl"
            className="w-full"
            variant={direction === "in" ? "success" : "danger"}
            onClick={handleProceedToConfirm}
            disabled={parsedQty <= 0 || isOverdraw || isDeficitStock}
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === "confirm" && selectedProduct && (
        <div className="space-y-4">
          <Card className="border-2 border-gray-300">
            <h3 className="font-semibold text-gray-900 mb-3">
              Confirm {direction === "in" ? "Stock In" : "Stock Out"}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Product</span>
                <span className="font-medium text-gray-900">
                  {selectedProduct.categoryName} — {selectedProduct.colorName}{" "}
                  {selectedProduct.sizeLabel} ({selectedProduct.unitName})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Direction</span>
                <span
                  className={cn(
                    "font-semibold",
                    direction === "in" ? "text-green-600" : "text-red-600"
                  )}
                >
                  {direction === "in" ? "IN" : "OUT"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Quantity</span>
                <span className="font-bold text-lg text-gray-900">
                  {parsedQty}
                </span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between">
                <span className="text-gray-500">Stock Before</span>
                <span className="text-gray-700">{currentStock}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stock After</span>
                <span className="font-bold text-gray-900">{newBalance}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between">
                <span className="text-gray-500">Entered By</span>
                <span className="text-gray-700">{user.name}</span>
              </div>
              {note && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Note</span>
                  <span className="text-gray-700">{note}</span>
                </div>
              )}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={handleBack}
            >
              Back
            </Button>
            <form action={formAction} className="flex-1">
              <input type="hidden" name="productId" value={selectedProduct.id} />
              <input type="hidden" name="direction" value={direction} />
              <input type="hidden" name="quantity" value={parsedQty.toString()} />
              <input type="hidden" name="note" value={note} />
              <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
              <Button
                type="submit"
                size="lg"
                className="w-full"
                variant={direction === "in" ? "success" : "danger"}
                disabled={isPending}
              >
                {isPending
                  ? "Submitting..."
                  : direction === "in"
                  ? "Confirm Stock In"
                  : "Confirm Dispatch"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
