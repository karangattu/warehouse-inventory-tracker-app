import Link from "next/link";
import { Card } from "@/components/ui/card";
import { TransactionList } from "@/components/transaction-list";
import {
  getDashboardStats,
  getRecentTransactions,
  getRecentTransactionsByUser,
  getTodayTransactionsCountIST,
} from "@/lib/db/queries";
import type { TransactionWithDetails } from "@/types";
import { getSession } from "@/lib/auth";
import {
  formatDate,
  formatQuantity,
  formatUserDisplayName,
} from "@/lib/utils";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  List,
  OctagonAlert,
} from "lucide-react";
import { undoTransactionAction } from "@/app/actions/stock";

export default async function DashboardPage() {
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const stats = isAdmin ? await getDashboardStats() : null;
  const recentTx = isAdmin ? await getRecentTransactions(10) : [];
  const todayEntriesMadam = !isAdmin ? await getTodayTransactionsCountIST() : 0;
  const madamRecentTx =
    !isAdmin && session?.id
      ? await getRecentTransactionsByUser(session.id, 8)
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-950">
          Dashboard
        </h1>
      </div>

      {/* Alert banners */}
      {isAdmin && (stats?.negativeStockCount ?? 0) > 0 && (
        <div className="space-y-2">
          {(stats?.negativeStockCount ?? 0) > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <OctagonAlert className="h-6 w-6 text-red-700" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  {stats?.negativeStockCount} item{(stats?.negativeStockCount ?? 0) !== 1 ? "s" : ""} with negative stock
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Requires immediate attention
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/stock-in"
          className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-2xl p-6 text-center transition-colors"
        >
          <ArrowDownToLine className="h-7 w-7 mx-auto mb-2" />
          <span className="text-lg font-bold">Stock In</span>
          <p className="text-green-100 text-sm mt-1">Receive goods</p>
        </Link>
        <Link
          href="/stock-out"
          className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-2xl p-6 text-center transition-colors"
        >
          <ArrowUpFromLine className="h-7 w-7 mx-auto mb-2" />
          <span className="text-lg font-bold">Stock Out</span>
          <p className="text-red-100 text-sm mt-1">Dispatch goods</p>
        </Link>
        {isAdmin && (
          <Link
            href="/browse"
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl p-6 text-center transition-colors"
          >
            <List className="h-7 w-7 mx-auto mb-2" />
            <span className="text-lg font-bold">View Stock</span>
            <p className="text-blue-100 text-sm mt-1">Browse inventory</p>
          </Link>
        )}
      </div>

      {isAdmin && stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <p className="text-xs text-gray-700 font-medium">Total SKUs</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalSkus}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-gray-700 font-medium">Items in Stock</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalInStock}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-gray-700 font-medium">Today&apos;s Entries</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.transactionsToday}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-gray-700 font-medium">Negative Stock</p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {stats.negativeStockCount}
            </p>
          </Card>
        </div>
      ) : (
        <Card>
          <p className="text-xs text-gray-700 font-medium">Today&apos;s Entries (IST)</p>
          <p className="text-3xl font-extrabold text-gray-900 mt-1">
            {todayEntriesMadam}
          </p>
        </Card>
      )}

      {/* Recent activity */}
      {isAdmin && (
        <Card>
          <h2 className="text-lg font-bold tracking-tight text-gray-900 mb-4">
            Recent Activity
          </h2>
          <TransactionList
            transactions={recentTx as TransactionWithDetails[]}
          />
        </Card>
      )}

      {!isAdmin && (
        <Card>
          <h2 className="text-lg font-bold tracking-tight text-gray-900 mb-4">
            Recent Entries (IST)
          </h2>
          {madamRecentTx.length === 0 ? (
            <p className="text-sm text-gray-600">No recent entries found.</p>
          ) : (
            <div className="space-y-2">
              {madamRecentTx.map((tx) => {
                const isUndoEntry = tx.note?.startsWith("Undo of ");
                const canUndo = !isUndoEntry;
                return (
                  <div
                    key={tx.id}
                    className={
                      isUndoEntry
                        ? "border border-amber-200 bg-amber-50 rounded-lg p-3 flex items-start justify-between gap-3"
                        : "border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3"
                    }
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-900">
                          {tx.direction === "in" ? "Stock In" : "Stock Out"} · {formatQuantity(tx.quantity)}
                        </p>
                        {isUndoEntry && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Undo Entry
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 truncate">
                        {tx.categoryName} — {tx.colorName} {tx.sizeLabel} ({tx.unitName})
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatUserDisplayName(tx.userName)} · {tx.createdAt ? formatDate(tx.createdAt) : "—"}
                      </p>
                    </div>
                    {canUndo && (
                      <form action={undoTransactionAction}>
                        <input type="hidden" name="transactionId" value={tx.id} />
                        <button
                          type="submit"
                          className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-red-200 text-red-700 hover:bg-red-50"
                        >
                          Undo
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
