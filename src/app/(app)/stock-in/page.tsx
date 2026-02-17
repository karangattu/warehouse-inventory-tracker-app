import { getSession } from "@/lib/auth";
import { getProductsWithStock } from "@/lib/db/queries";
import { StockEntryForm } from "@/components/stock-entry-form";
import { redirect } from "next/navigation";
import type { SessionUser } from "@/types";

export default async function StockInPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const products = await getProductsWithStock();

  return (
    <div className="max-w-2xl mx-auto">
      <StockEntryForm
        direction="in"
        products={products}
        user={session as SessionUser}
      />
    </div>
  );
}
