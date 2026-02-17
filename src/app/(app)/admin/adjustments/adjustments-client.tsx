"use client";

import { useState, useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { StockBadge } from "@/components/stock-badge";
import { adjustStockAction } from "@/app/actions/admin";
import type { ProductWithStock } from "@/types";
import { X } from "lucide-react";

interface AdjustmentsClientProps {
  products: ProductWithStock[];
}

export function AdjustmentsClient({ products }: AdjustmentsClientProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithStock | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleAction = (
    prev: { error?: string; success?: string } | null,
    formData: FormData
  ) => {
    return adjustStockAction(prev, formData).then((result) => {
      if (result?.success) {
        setToast({ message: result.success, type: "success" });
        setSelectedProduct(null);
      } else if (result?.error) {
        setToast({ message: result.error, type: "error" });
      }
      return result;
    });
  };

  const [, formAction, isPending] = useActionState(handleAction, null);

  const filtered = search
    ? products.filter((p) => {
        const text =
          `${p.categoryName} ${p.colorName} ${p.sizeLabel} ${p.unitName}`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
    : products;

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-base font-semibold text-gray-900">
        Stock Adjustments
      </h2>
      <p className="text-sm text-gray-500">
        Correct stock balances based on physical counts.
      </p>

      {!selectedProduct ? (
        <>
          <Input
            placeholder="Search for a product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {p.categoryName} — {p.colorName} {p.sizeLabel}
                    </p>
                    <p className="text-xs text-gray-500">{p.unitName}</p>
                  </div>
                  <StockBadge
                    balance={p.stockBalance}
                  />
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {selectedProduct.categoryName} — {selectedProduct.colorName}{" "}
                  {selectedProduct.sizeLabel}
                </p>
                <p className="text-sm text-gray-500">
                  Current balance:{" "}
                  <span className="font-semibold">
                    {selectedProduct.stockBalance}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
                aria-label="Clear selected product"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form action={formAction} className="space-y-3">
              <input
                type="hidden"
                name="productId"
                value={selectedProduct.id}
              />
              <Input
                name="newBalance"
                label="New Balance (from physical count)"
                type="number"
                step="0.01"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <select
                  name="reason"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                >
                  <option value="">Select reason...</option>
                  <option value="Physical count correction">
                    Physical count correction
                  </option>
                  <option value="Damaged goods">Damaged goods</option>
                  <option value="Data entry error">Data entry error</option>
                  <option value="Initial stock setup">
                    Initial stock setup
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Adjusting..." : "Apply Adjustment"}
              </Button>
            </form>
          </div>
        </Card>
      )}

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
