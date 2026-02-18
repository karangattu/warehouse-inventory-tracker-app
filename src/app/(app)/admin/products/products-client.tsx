"use client";

import { useState, useActionState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { createProductAction, updateProductAction } from "@/app/actions/admin";
import type { ProductWithDetails } from "@/types";
import type { Category, Color, Unit } from "@/lib/db/schema";

interface ProductsClientProps {
  products: ProductWithDetails[];
  categories: Category[];
  colors: Color[];
  units: Unit[];
}

export function ProductsClient({
  products,
  categories,
  colors,
  units,
}: ProductsClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<ProductWithDetails | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    message: string;
    existingSizeLabel: string;
  } | null>(null);

  const handleCreateAction = (
    prev: { error?: string; success?: string; duplicate?: boolean; existingSizeLabel?: string } | null,
    formData: FormData
  ) => {
    return createProductAction(prev, formData).then((result) => {
      if (result?.success) {
        setToast({ message: result.success, type: "success" });
        setShowCreateModal(false);
        setDuplicateWarning(null);
      } else if (result?.duplicate) {
        setDuplicateWarning({
          message: result.error || "Similar product exists.",
          existingSizeLabel: result.existingSizeLabel || "",
        });
      } else if (result?.error) {
        setToast({ message: result.error, type: "error" });
        setDuplicateWarning(null);
      }
      return result;
    });
  };

  const handleUpdateAction = (
    prev: { error?: string; success?: string } | null,
    formData: FormData
  ) => {
    return updateProductAction(prev, formData).then((result) => {
      if (result?.success) {
        setToast({ message: result.success, type: "success" });
        setEditingProduct(null);
      } else if (result?.error) {
        setToast({ message: result.error, type: "error" });
      }
      return result;
    });
  };

  const [, createFormAction, isCreating] = useActionState(
    handleCreateAction,
    null
  );
  const [, updateFormAction, isUpdating] = useActionState(
    handleUpdateAction,
    null
  );

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Product Management
        </h2>
        <Button onClick={() => setShowCreateModal(true)}>+ Add Product</Button>
      </div>

      {/* Products list */}
      <div className="space-y-2">
        {products.map((p) => (
          <Card key={p.id} padding="sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {p.categoryName} — {p.colorName} {p.sizeLabel} ({p.unitName})
                </p>
                <p className="text-xs text-gray-500 font-mono">
                  {p.skuCode || "No SKU"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {p.isActive === 0 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    Inactive
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingProduct(p)}
                >
                  Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create modal */}
      <Modal
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); setDuplicateWarning(null); }}
        title="Add New Product"
      >
        <form action={createFormAction} className="space-y-3" id="create-product-form">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              name="categoryId"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              onChange={() => setDuplicateWarning(null)}
            >
              <option value="">Select...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <select
              name="colorId"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              onChange={() => setDuplicateWarning(null)}
            >
              <option value="">Select...</option>
              {colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Input
              name="sizeLabel"
              label="Size Label"
              required
              placeholder="e.g. 25mm, 50mm"
              onChange={() => setDuplicateWarning(null)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Spaces between numbers and units (e.g. &quot;9 mm&quot;) will be auto-normalized to &quot;9mm&quot;.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <select
              name="unitId"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
              onChange={() => setDuplicateWarning(null)}
            >
              <option value="">Select...</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Duplicate warning */}
          {duplicateWarning && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-800">⚠ Possible duplicate</p>
              <p className="text-xs text-amber-700 mt-1">
                A product with size &quot;{duplicateWarning.existingSizeLabel}&quot; already exists for this category/color/unit combination.
              </p>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="mt-2 text-amber-800 border border-amber-400 hover:bg-amber-100"
                disabled={isCreating}
                onClick={() => {
                  // Add hidden input to skip duplicate check
                  const form = document.getElementById("create-product-form") as HTMLFormElement;
                  if (form) {
                    let input = form.querySelector<HTMLInputElement>('input[name="skipDuplicateCheck"]');
                    if (!input) {
                      input = document.createElement("input");
                      input.type = "hidden";
                      input.name = "skipDuplicateCheck";
                      form.appendChild(input);
                    }
                    input.value = "true";
                  }
                }}
              >
                {isCreating ? "Creating..." : "Create anyway"}
              </Button>
            </div>
          )}

          {!duplicateWarning && (
            <Button type="submit" disabled={isCreating} className="w-full">
              {isCreating ? "Creating..." : "Create Product"}
            </Button>
          )}
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Edit Product"
      >
        {editingProduct && (
          <form action={updateFormAction} className="space-y-3">
            <input
              type="hidden"
              name="productId"
              value={editingProduct.id}
            />
            <p className="text-sm text-gray-600 mb-2">
              {editingProduct.categoryName} — {editingProduct.colorName}
            </p>
            <Input
              name="sizeLabel"
              label="Size Label"
              defaultValue={editingProduct.sizeLabel}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="isActive"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                defaultValue={String(editingProduct.isActive ?? 1)}
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
            <Button type="submit" disabled={isUpdating} className="w-full">
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        )}
      </Modal>

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
