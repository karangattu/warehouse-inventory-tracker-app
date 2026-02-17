import {
  getAllProducts,
  getAllCategories,
  getAllColors,
  getAllUnits,
} from "@/lib/db/queries";
import { ProductsClient } from "./products-client";

export default async function ProductsPage() {
  const [products, categories, colors, units] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
    getAllColors(),
    getAllUnits(),
  ]);

  return (
    <ProductsClient
      products={products}
      categories={categories}
      colors={colors}
      units={units}
    />
  );
}
