import { getProductById, getProductTransactions, getStockBalance } from "@/lib/db/queries";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { StockBadge } from "@/components/stock-badge";
import { formatDate, formatQuantity, formatUserDisplayName } from "@/lib/utils";
import Link from "next/link";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const [product, txHistory, balance] = await Promise.all([
    getProductById(id),
    getProductTransactions(id),
    getStockBalance(id),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/browse"
        className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        ← Back to browse
      </Link>

      {/* Product header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {product.categoryName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {product.colorHex && (
                <span
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: product.colorHex }}
                />
              )}
              <span className="text-gray-600">
                {product.colorName} · {product.sizeLabel} · {product.unitName}
              </span>
            </div>
            {product.skuCode && (
              <p className="text-sm text-gray-500 font-mono mt-1">
                {product.skuCode}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Current Stock</p>
            <StockBadge
              balance={balance}
              size="lg"
              showLabel
            />
          </div>
        </div>
      </Card>

      {/* Transaction ledger */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Transaction History ({txHistory.length} entries)
        </h2>
        {txHistory.length === 0 ? (
          <p className="text-center py-8 text-gray-500">
            No transactions recorded
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Direction</th>
                  <th className="py-2 px-2 text-right">Qty</th>
                  <th className="py-2 px-2 text-right">Balance</th>
                  <th className="py-2 px-2">By</th>
                  <th className="py-2 px-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {txHistory.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-2 px-2 text-gray-500 whitespace-nowrap">
                      {tx.createdAt ? formatDate(tx.createdAt) : "—"}
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={
                          tx.direction === "in"
                            ? "text-green-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {tx.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-medium">
                      {formatQuantity(tx.quantity)}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {formatQuantity(tx.balanceAfter)}
                    </td>
                    <td className="py-2 px-2 text-gray-600">{formatUserDisplayName(tx.userName)}</td>
                    <td className="py-2 px-2 text-gray-500 max-w-[200px] truncate">
                      {tx.note || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
