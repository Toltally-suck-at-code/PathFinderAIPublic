"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Home", emoji: "🏠" },
  { href: "/discover", label: "Quiz", emoji: "💡" },
  { href: "/career-map", label: "Career Map", emoji: "🗺️" },
  { href: "/activities", label: "Activities", emoji: "📋" },
  { href: "/progress", label: "Progress", emoji: "📊" },
  { href: "/linkup", label: "LinkUp", emoji: "🤝" },
];

const bottomNavItems = [
  { href: "/settings", label: "Settings", emoji: "⚙️" },
];

const counselorNavItem = { href: "/counselor", label: "Counselor", emoji: "👨‍🏫" };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const pathname = usePathname();
  const user = useQuery(api.users.getCurrentUser);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isCounselor = user?.role === "counselor" || user?.role === "admin";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-grid-lime flex items-center justify-center">
        <div className="retro-card p-8 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
            <span className="font-black uppercase">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Combine nav items with counselor nav if applicable
  const allNavItems = isCounselor ? [...navItems, counselorNavItem] : navItems;

  return (
    <div className="min-h-screen bg-grid flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#c8f560] border-r-4 border-black fixed inset-y-0">
        {/* Logo */}
        <div className="p-4 border-b-4 border-black">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white border-3 border-black flex items-center justify-center">
              <span className="text-xl font-black">P</span>
            </div>
            <div>
              <h1 className="text-lg font-black uppercase leading-tight">PathFinder</h1>
              <p className="text-xs font-bold">AI</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b-4 border-black bg-[#fff06b]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white border-3 border-black flex items-center justify-center">
              <span className="text-xl font-black">
                {user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{user?.name || "Student"}</p>
              <p className="text-xs truncate opacity-70">{user?.email}</p>
              {isCounselor && (
                <span className="inline-block mt-1 text-xs font-black bg-[#6bb8ff] px-2 py-0.5 border-2 border-black">
                  COUNSELOR
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {allNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 font-bold text-sm uppercase transition-all ${
                pathname === item.href
                  ? "bg-white border-3 border-black shadow-[4px_4px_0_0_#000]"
                  : "hover:bg-white/50 border-3 border-transparent"
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom Nav (Settings) */}
        <div className="p-3 border-t-4 border-black space-y-2">
          {bottomNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 font-bold text-sm uppercase transition-all ${
                pathname === item.href
                  ? "bg-white border-3 border-black shadow-[4px_4px_0_0_#000]"
                  : "hover:bg-white/50 border-3 border-transparent"
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
              {item.label}
            </Link>
          ))}
          <button
            onClick={() => signOut()}
            className="w-full retro-btn retro-btn-pink text-sm flex items-center justify-center gap-2"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#c8f560] border-b-4 border-black px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center">
            <span className="text-lg font-black">P</span>
          </div>
          <span className="font-black uppercase">PathFinderAI</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-10 h-10 bg-white border-3 border-black flex items-center justify-center"
        >
          <span className="text-xl">{mobileMenuOpen ? "✕" : "☰"}</span>
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 pt-16">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative bg-[#c8f560] border-b-4 border-black p-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {allNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 font-bold text-sm uppercase ${
                  pathname === item.href
                    ? "bg-white border-3 border-black"
                    : "border-3 border-transparent"
                }`}
              >
                <span className="text-xl">{item.emoji}</span>
                {item.label}
              </Link>
            ))}
            <div className="border-t-4 border-black pt-2 mt-2">
              {bottomNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 font-bold text-sm uppercase ${
                    pathname === item.href
                      ? "bg-white border-3 border-black"
                      : "border-3 border-transparent"
                  }`}
                >
                  <span className="text-xl">{item.emoji}</span>
                  {item.label}
                </Link>
              ))}
            </div>
            <button
              onClick={() => signOut()}
              className="w-full retro-btn retro-btn-pink text-sm flex items-center justify-center gap-2 mt-4"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}
