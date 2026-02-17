"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StockBadge } from "@/components/stock-badge";
import { cn } from "@/lib/utils";
import type { ProductWithStock } from "@/types";
import type { Category, Color } from "@/lib/db/schema";
import { ChevronRight, Search } from "lucide-react";

interface BrowseClientProps {
  products: ProductWithStock[];
  categories: Category[];
  colors: Color[];
}

type StockFilter = "all" | "in-stock" | "zero" | "negative";

export function BrowseClient({
  products,
  categories,
  colors,
}: BrowseClientProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const filteredProducts = useMemo(() => {
    let result = products;

    if (categoryFilter !== "all") {
      result = result.filter((p) => p.categoryId === categoryFilter);
    }
    if (colorFilter !== "all") {
      result = result.filter((p) => p.colorId === colorFilter);
    }
    if (stockFilter !== "all") {
      result = result.filter((p) => {
        switch (stockFilter) {
          case "in-stock":
            return p.stockBalance > 0;
          case "zero":
            return p.stockBalance === 0;
          case "negative":
            return p.stockBalance < 0;
          default:
            return true;
        }
      });
    }
    if (search.trim()) {
      const terms = search.toLowerCase().split(/\s+/);
      result = result.filter((p) => {
        const text =
          `${p.categoryName} ${p.colorName} ${p.sizeLabel} ${p.unitName} ${p.skuCode || ""}`.toLowerCase();
        return terms.every((t) => text.includes(t));
      });
    }

    return result;
  }, [products, search, categoryFilter, colorFilter, stockFilter]);

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { categoryName: string; products: ProductWithStock[] }
    >();

    filteredProducts.forEach((p) => {
      if (!map.has(p.categoryId)) {
        map.set(p.categoryId, { categoryName: p.categoryName, products: [] });
      }
      map.get(p.categoryId)!.products.push(p);
    });

    return Array.from(map.entries()).sort((a, b) =>
      a[1].categoryName.localeCompare(b[1].categoryName)
    );
  }, [filteredProducts]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(grouped.map(([id]) => id)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-950">
        Stock Overview
      </h1>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 pl-10 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={colorFilter}
          onChange={(e) => setColorFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
        >
          <option value="all">All Colors</option>
          {colors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as StockFilter)}
          className="rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm"
        >
          <option value="all">All Stock Levels</option>
          <option value="in-stock">In Stock</option>
          <option value="zero">Out of Stock</option>
          <option value="negative">Negative</option>
        </select>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between text-sm text-gray-700">
        <span>
          {filteredProducts.length} product
          {filteredProducts.length !== 1 ? "s" : ""} · {grouped.length} categor
          {grouped.length !== 1 ? "ies" : "y"}
        </span>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="text-blue-700 hover:text-blue-900 text-xs"
          >
            Expand all
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={collapseAll}
            className="text-blue-700 hover:text-blue-900 text-xs"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Grouped table */}
      <div className="space-y-3">
        {grouped.map(([catId, { categoryName, products: catProducts }]) => (
          <Card key={catId} padding="sm">
            <button
              onClick={() => toggleCategory(catId)}
              className="w-full flex items-center justify-between py-2 px-1"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "transition-transform text-gray-600",
                    expandedCategories.has(catId) && "rotate-90"
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </span>
                <span className="font-semibold text-gray-900">
                  {categoryName}
                </span>
                <span className="text-xs text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                  {catProducts.length}
                </span>
              </div>
            </button>

            {expandedCategories.has(catId) && (
              <div className="mt-2 border-t border-gray-200 pt-2">
                <div className="md:hidden space-y-2">
                  {catProducts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate inline-flex items-center gap-1.5">
                            {p.colorHex && (
                              <span
                                className="w-3 h-3 rounded-full border border-gray-300 inline-block flex-shrink-0"
                                style={{ backgroundColor: p.colorHex }}
                              />
                            )}
                            {p.colorName}
                          </p>
                          <p className="text-xs text-gray-700 mt-1">
                            {p.sizeLabel} · {p.unitName}
                          </p>
                        </div>
                        <StockBadge
                          balance={p.stockBalance}
                        />
                      </div>
                    </Link>
                  ))}
                </div>

                <table className="hidden md:table w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-700">
                      <th className="py-1 px-2">Color</th>
                      <th className="py-1 px-2">Size</th>
                      <th className="py-1 px-2">Unit</th>
                      <th className="py-1 px-2 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catProducts.map((p) => (
                      <tr
                        key={p.id}
                        className="border-t border-gray-200 hover:bg-gray-50"
                      >
                        <td className="py-2 px-2">
                          <Link
                            href={`/product/${p.id}`}
                            className="flex items-center gap-1.5 text-gray-900 hover:text-blue-700"
                          >
                            {p.colorHex && (
                              <span
                                className="w-3 h-3 rounded-full border border-gray-300 inline-block flex-shrink-0"
                                style={{ backgroundColor: p.colorHex }}
                              />
                            )}
                            {p.colorName}
                          </Link>
                        </td>
                        <td className="py-2 px-2 text-gray-700">
                          {p.sizeLabel}
                        </td>
                        <td className="py-2 px-2 text-gray-700">
                          {p.unitName}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <StockBadge
                            balance={p.stockBalance}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 text-gray-700">
          No products match your filters
        </div>
      )}
    </div>
  );
}
