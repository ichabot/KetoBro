"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/track", label: "Daten erfassen", icon: "📝" },
  { href: "/chat", label: "KetoBro Chat", icon: "🤖" },
  { href: "/profile", label: "Profil", icon: "👤" },
  { href: "/settings", label: "Einstellungen", icon: "⚙️" },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!session) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">🥑</span>
              <span className="text-xl font-bold text-green-700">KetoBro</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex ml-10 space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href || pathname?.startsWith(item.href + "/")
                      ? "bg-green-100 text-green-800"
                      : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-500">{session.user?.name || session.user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
              Abmelden
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium",
                  pathname === item.href
                    ? "bg-green-100 text-green-800"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                {item.icon} {item.label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
            >
              🚪 Abmelden
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
