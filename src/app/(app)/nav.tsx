"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/types";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  House,
  List,
  LogOut,
  Package,
  Settings,
} from "lucide-react";

interface AppNavProps {
  user: SessionUser;
}

export function AppNav({ user }: AppNavProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "admin";

  const links = [
    { href: "/", label: "Dashboard", icon: House },
    { href: "/stock-in", label: "Stock In", icon: ArrowDownToLine },
    { href: "/stock-out", label: "Stock Out", icon: ArrowUpFromLine },
    ...(isAdmin ? [{ href: "/browse", label: "Browse", icon: List }] : []),
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin", icon: Settings }]
      : []),
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="py-2 space-y-2 sm:space-y-0 sm:min-h-14 sm:flex sm:items-center sm:justify-between sm:gap-2">
          {/* Logo */}
          <div className="flex items-center justify-between gap-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900 hidden sm:inline">
                Inventory
              </span>
            </Link>

            {/* User */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 font-medium hidden sm:inline">
                  {user.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {isAdmin ? "Admin" : "Madam"}
                </span>
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="text-sm text-gray-600 hover:text-gray-800 transition-colors inline-flex items-center gap-1 px-2 py-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </form>
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={cn(
              "sm:flex sm:items-center sm:gap-1 sm:overflow-visible",
              isAdmin
                ? "flex items-center gap-1 overflow-x-auto pb-1"
                : "grid grid-cols-3 gap-2"
            )}
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1.5",
                  isAdmin
                    ? "px-3 py-2 sm:px-2.5 sm:py-1.5"
                    : "px-2 py-2.5",
                  pathname === link.href
                    ? "bg-blue-100 text-blue-900"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <link.icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
