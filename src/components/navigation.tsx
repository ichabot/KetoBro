"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/nutrition", label: "Tagesansicht", icon: "🍽️" },
  { href: "/track", label: "Erfassen", icon: "📝" },
  { href: "/chat", label: "Chat", icon: "🤖" },
  { href: "/history", label: "Verlauf", icon: "📋" },
  { href: "/goals", label: "Ziele", icon: "🎯" },
];

const secondaryItems = [
  { href: "/profile", label: "Profil", icon: "👤" },
  { href: "/settings", label: "Einstellungen", icon: "⚙️" },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!session) return null;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">🥑</span>
              <span className="text-xl font-bold text-green-700 dark:text-green-400">KetoBro</span>
            </Link>

            <div className="hidden lg:flex ml-8 space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href || pathname?.startsWith(item.href + "/")
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex items-center space-x-2">
            {secondaryItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-2 py-2 rounded-md text-sm transition-colors",
                  pathname === item.href
                    ? "text-green-700 dark:text-green-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                )}
              >
                {item.icon}
              </Link>
            ))}
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{session.user?.name || session.user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
              Abmelden
            </Button>
          </div>

          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {[...navItems, ...secondaryItems].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  pathname === item.href
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                )}
              >
                {item.icon} {item.label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              🚪 Abmelden
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
