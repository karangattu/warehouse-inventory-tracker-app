import { getDashboardStats } from "@/lib/db/queries";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs font-medium text-gray-600">Total SKUs</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalSkus}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-gray-600">Items in Stock</p>
          <p className="text-2xl font-bold text-gray-900">{stats.totalInStock}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-red-600">Negative Stock Items</p>
          <p className="text-2xl font-bold text-red-700">
            {stats.negativeStockCount}
          </p>
        </Card>
      </div>

      {stats.negativeStockItems.length > 0 && (
        <Card>
          <h2 className="text-base font-semibold text-red-800 mb-3">
            Negative Stock Items
          </h2>
          <div className="space-y-2">
            {stats.negativeStockItems.map((item) => (
              <Link
                key={item.id}
                href={`/product/${item.id}`}
                className="flex justify-between items-center p-2 rounded-lg hover:bg-red-50"
              >
                <span className="text-sm text-gray-900">{item.name}</span>
                <span className="text-sm font-bold text-red-600">
                  {item.balance}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}

    </div>
  );
}
