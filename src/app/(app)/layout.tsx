import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppNav } from "./nav";
import { getDashboardStats } from "@/lib/db/queries";
import { NegativeStockToasts } from "@/components/negative-stock-toasts";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.role === "admin";
  const negativeItems = isAdmin
    ? (await getDashboardStats()).negativeStockItems
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppNav user={session} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      {isAdmin && negativeItems.length > 0 && (
        <NegativeStockToasts initialItems={negativeItems} />
      )}
    </div>
  );
}

