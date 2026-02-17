import { getProductsWithStock, getAllCategories, getAllColors } from "@/lib/db/queries";
import { BrowseClient } from "./browse-client";

export default async function BrowsePage() {
  const [products, categories, colors] = await Promise.all([
    getProductsWithStock(),
    getAllCategories(),
    getAllColors(),
  ]);

  return (
    <BrowseClient
      products={products}
      categories={categories}
      colors={colors}
    />
  );
}
