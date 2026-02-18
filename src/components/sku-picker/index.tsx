"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { StockBadge } from "@/components/stock-badge";
import type { ProductWithStock } from "@/types";
import { Search } from "lucide-react";

interface SkuPickerProps {
  products: ProductWithStock[];
  onSelect: (product: ProductWithStock) => void;
  selectedId?: string | null;
  className?: string;
}

export function SkuPicker({
  products,
  onSelect,
  selectedId,
  className,
}: SkuPickerProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [sizeFilter, setSizeFilter] = useState<string | null>(null);
  const [unitFilter, setUnitFilter] = useState<string | null>(null);

  // Extract unique filter values
  const filterOptions = useMemo(() => {
    const cats = new Map<string, string>();
    const cols = new Map<string, { name: string; hex: string | null }>();
    const sizes = new Set<string>();
    const uts = new Map<string, string>();

    products.forEach((p) => {
      cats.set(p.categoryId, p.categoryName);
      cols.set(p.colorId, { name: p.colorName, hex: p.colorHex });
      sizes.add(p.sizeLabel);
      uts.set(p.unitId, p.unitName);
    });

    return {
      categories: Array.from(cats, ([id, name]) => ({ id, name })).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
      colors: Array.from(cols, ([id, data]) => ({
        id,
        name: data.name,
        hex: data.hex,
      })).sort((a, b) => a.name.localeCompare(b.name)),
      sizes: Array.from(sizes).sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      }),
      units: Array.from(uts, ([id, name]) => ({ id, name })).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
    };
  }, [products]);

  // Available filter options based on current selections
  const availableFilters = useMemo(() => {
    let filtered = products;
    if (categoryFilter) filtered = filtered.filter((p) => p.categoryId === categoryFilter);
    if (colorFilter) filtered = filtered.filter((p) => p.colorId === colorFilter);
    if (sizeFilter) filtered = filtered.filter((p) => p.sizeLabel === sizeFilter);
    if (unitFilter) filtered = filtered.filter((p) => p.unitId === unitFilter);

    return {
      categories: new Set(filtered.map((p) => p.categoryId)),
      colors: new Set(filtered.map((p) => p.colorId)),
      sizes: new Set(filtered.map((p) => p.sizeLabel)),
      units: new Set(filtered.map((p) => p.unitId)),
    };
  }, [products, categoryFilter, colorFilter, sizeFilter, unitFilter]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = products;

    if (categoryFilter) result = result.filter((p) => p.categoryId === categoryFilter);
    if (colorFilter) result = result.filter((p) => p.colorId === colorFilter);
    if (sizeFilter) result = result.filter((p) => p.sizeLabel === sizeFilter);
    if (unitFilter) result = result.filter((p) => p.unitId === unitFilter);

    if (search.trim()) {
      const terms = search.toLowerCase().split(/\s+/);
      result = result.filter((p) => {
        const text = `${p.categoryName} ${p.colorName} ${p.sizeLabel} ${p.unitName} ${p.skuCode || ""}`.toLowerCase();
        return terms.every((term) => text.includes(term));
      });
    }

    return result;
  }, [products, search, categoryFilter, colorFilter, sizeFilter, unitFilter]);

  const clearAllFilters = () => {
    setCategoryFilter(null);
    setColorFilter(null);
    setSizeFilter(null);
    setUnitFilter(null);
    setSearch("");
  };

  const hasActiveFilters = categoryFilter || colorFilter || sizeFilter || unitFilter || search;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search: "black 10mm", "ceramic high", or SKU code...'
          className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-gray-500"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
      </div>

      {/* Faceted filter chips */}
      <div className="space-y-3">
        {/* Category chips */}
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1.5">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setCategoryFilter(categoryFilter === cat.id ? null : cat.id)
                }
                disabled={!categoryFilter && !availableFilters.categories.has(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  categoryFilter === cat.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Color chips */}
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1.5">Color</p>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.colors.map((color) => (
              <button
                key={color.id}
                onClick={() =>
                  setColorFilter(colorFilter === color.id ? null : color.id)
                }
                disabled={!colorFilter && !availableFilters.colors.has(color.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
                  colorFilter === color.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                )}
              >
                {color.hex && (
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                    style={{ backgroundColor: color.hex }}
                  />
                )}
                {color.name}
              </button>
            ))}
          </div>
        </div>

        {/* Unit chips */}
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1.5">Size</p>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.sizes.map((size) => (
              <button
                key={size}
                onClick={() =>
                  setSizeFilter(sizeFilter === size ? null : size)
                }
                disabled={!sizeFilter && !availableFilters.sizes.has(size)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  sizeFilter === size
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Unit chips */}
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1.5">Unit</p>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.units.map((unit) => (
              <button
                key={unit.id}
                onClick={() =>
                  setUnitFilter(unitFilter === unit.id ? null : unit.id)
                }
                disabled={!unitFilter && !availableFilters.units.has(unit.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  unitFilter === unit.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                )}
              >
                {unit.name}
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-700">
        {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found
      </p>

      {/* Product cards */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredProducts.map((product) => (
          <button
            key={product.id}
            onClick={() => onSelect(product)}
            className={cn(
              "w-full text-left p-3 rounded-xl border-2 transition-all",
              selectedId === product.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {product.colorHex && (
                    <span
                      className="flex-shrink-0 w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: product.colorHex }}
                    />
                  )}
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {product.categoryName}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {product.colorName} · {product.sizeLabel} · {product.unitName}
                </p>
                {product.skuCode && (
                  <p className="text-xs text-gray-600 font-mono mt-0.5">
                    {product.skuCode}
                  </p>
                )}
              </div>
              <StockBadge
                balance={product.stockBalance}
                size="lg"
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
