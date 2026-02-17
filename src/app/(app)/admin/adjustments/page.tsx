import { getProductsWithStock } from "@/lib/db/queries";
import { AdjustmentsClient } from "./adjustments-client";

export default async function AdjustmentsPage() {
  const products = await getProductsWithStock();
  return <AdjustmentsClient products={products} />;
}
