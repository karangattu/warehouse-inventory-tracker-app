import { db } from "@/lib/db/client";
import { transactions, products, categories, colors, units, users } from "@/lib/db/schema";
import { eq, desc, sql, and, lt } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { formatDate, formatQuantity, formatUserDisplayName } from "@/lib/utils";
import { getProductsWithStock } from "@/lib/db/queries";

export default async function ReportsPage() {
  // Negative stock report
  const allProducts = await getProductsWithStock();
  const negativeProducts = allProducts.filter((p) => p.stockBalance < 0);

  // Transactions today
  const todayTx = await db
    .select({
      direction: transactions.direction,
      total: sql<number>`sum(${transactions.quantity})`,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .where(
      sql`date(datetime(${transactions.createdAt}, '+5 hours', '+30 minutes')) = date('now', '+5 hours', '+30 minutes')`
    )
    .groupBy(transactions.direction);

  // Large dispatches (> 20)
  const largeTx = await db
    .select({
      id: transactions.id,
      quantity: transactions.quantity,
      balanceAfter: transactions.balanceAfter,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
      colorName: colors.name,
      sizeLabel: products.sizeLabel,
      unitName: units.name,
      userName: users.name,
    })
    .from(transactions)
    .innerJoin(products, eq(transactions.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(colors, eq(products.colorId, colors.id))
    .innerJoin(units, eq(products.unitId, units.id))
    .innerJoin(users, eq(transactions.enteredBy, users.id))
    .where(and(eq(transactions.direction, "out"), sql`${transactions.quantity} > 20`))
    .orderBy(desc(transactions.createdAt))
    .limit(50);

  // Negative balance transactions (historical)
  const negativeTx = await db
    .select({
      id: transactions.id,
      quantity: transactions.quantity,
      balanceAfter: transactions.balanceAfter,
      direction: transactions.direction,
      createdAt: transactions.createdAt,
      categoryName: categories.name,
      colorName: colors.name,
      sizeLabel: products.sizeLabel,
      userName: users.name,
    })
    .from(transactions)
    .innerJoin(products, eq(transactions.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .innerJoin(colors, eq(products.colorId, colors.id))
    .innerJoin(users, eq(transactions.enteredBy, users.id))
    .where(lt(transactions.balanceAfter, 0))
    .orderBy(desc(transactions.createdAt))
    .limit(50);

  return (
    <div className="space-y-6 mt-4">
      <h2 className="text-base font-semibold text-gray-900">Reports</h2>

      {/* Today's movement */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-3">
          Today&apos;s Movement (IST)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {todayTx.map((row) => (
            <div
              key={row.direction}
              className={`p-3 rounded-lg ${
                row.direction === "in" ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <p className="text-xs text-gray-500">
                {row.direction === "in" ? "Stock In" : "Stock Out"}
              </p>
              <p className="text-xl font-bold">
                {formatQuantity(row.total ?? 0)}
              </p>
              <p className="text-xs text-gray-500">{row.count} entries</p>
            </div>
          ))}
          {todayTx.length === 0 && (
            <p className="text-sm text-gray-500 col-span-2">
              No transactions today.
            </p>
          )}
        </div>
      </Card>

      {/* Negative stock */}
      <Card>
        <h3 className="font-semibold text-red-800 mb-3">
          Negative Stock ({negativeProducts.length})
        </h3>
        {negativeProducts.length === 0 ? (
          <p className="text-sm text-gray-500">No negative stock items.</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {negativeProducts.map((p) => (
              <div
                key={p.id}
                className="flex justify-between text-sm p-2 rounded hover:bg-red-50"
              >
                <span>
                  {p.categoryName} — {p.colorName} {p.sizeLabel}
                </span>
                <span className="font-bold text-red-600">
                  {formatQuantity(p.stockBalance)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Large dispatches */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-3">
          Large Dispatches (&gt;20 units)
        </h3>
        {largeTx.length === 0 ? (
          <p className="text-sm text-gray-500">No large dispatches found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Product</th>
                  <th className="py-2 px-2 text-right">Qty</th>
                  <th className="py-2 px-2">By</th>
                </tr>
              </thead>
              <tbody>
                {largeTx.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-50">
                    <td className="py-2 px-2 text-gray-500 whitespace-nowrap">
                      {tx.createdAt ? formatDate(tx.createdAt) : "—"}
                    </td>
                    <td className="py-2 px-2">
                      {tx.categoryName} {tx.colorName} {tx.sizeLabel}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-red-600">
                      {formatQuantity(tx.quantity)}
                    </td>
                    <td className="py-2 px-2 text-gray-600">{formatUserDisplayName(tx.userName)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Anomaly: negative balance after */}
      <Card>
        <h3 className="font-semibold text-gray-900 mb-3">
          Negative Balance Anomalies
        </h3>
        {negativeTx.length === 0 ? (
          <p className="text-sm text-gray-500">
            No transactions created negative balances.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b">
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Product</th>
                  <th className="py-2 px-2">Dir</th>
                  <th className="py-2 px-2 text-right">Qty</th>
                  <th className="py-2 px-2 text-right">Balance After</th>
                  <th className="py-2 px-2">By</th>
                </tr>
              </thead>
              <tbody>
                {negativeTx.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-50">
                    <td className="py-2 px-2 text-gray-500 whitespace-nowrap">
                      {tx.createdAt ? formatDate(tx.createdAt) : "—"}
                    </td>
                    <td className="py-2 px-2">
                      {tx.categoryName} {tx.colorName} {tx.sizeLabel}
                    </td>
                    <td className="py-2 px-2">{tx.direction?.toUpperCase()}</td>
                    <td className="py-2 px-2 text-right">
                      {formatQuantity(tx.quantity)}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-red-600">
                      {formatQuantity(tx.balanceAfter)}
                    </td>
                    <td className="py-2 px-2 text-gray-600">{formatUserDisplayName(tx.userName)}</td>
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
