"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AppToaster from "@/components/AppToaster";
import TopLoader from "@/components/admin/TopLoader";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "fi-rr-dashboard", exact: true },
  { href: "/admin/peserta", label: "Daftar Peserta", icon: "fi-rr-users" },
  { href: "/admin/bracket", label: "Bracket", icon: "fi-rr-sitemap" },
];

type AdminInfo = { email: string; name: string | null; role: "admin" | "superadmin" } | null;

export default function AdminShell({
  children,
  admin,
}: {
  children: React.ReactNode;
  admin?: AdminInfo;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      toast.success("Berhasil keluar");
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Gagal keluar");
      setLoggingOut(false);
    }
  };

  const SidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <i className="fi fi-rr-gamepad text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-black text-sm text-gray-900">Warkop Sippo</p>
          <p className="text-[11px] text-gray-400 font-medium">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
          Menu
        </p>
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors
                ${active
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-orange-200"
                  : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                }`}
            >
              <i className={`fi ${item.icon} text-base`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={logout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
        >
          <i className="fi fi-rr-sign-out-alt text-base" />
          {loggingOut ? "Keluar..." : "Keluar"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <TopLoader />
      <AppToaster />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex-col">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-gray-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100 h-16 flex items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600"
            aria-label="Buka menu"
          >
            <i className="fi fi-rr-menu-burger" />
          </button>
          <h1 className="font-bold text-gray-900">
            {navItems.find((n) => isActive(n.href, n.exact))?.label ?? "Admin"}
          </h1>
          <div className="ml-auto flex items-center gap-2.5">
            {admin && <RoleBadge role={admin.role} />}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
              <i className="fi fi-rr-user text-sm" />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-semibold text-gray-800">
                {admin?.name || "Admin"}
              </p>
              <p className="text-[11px] text-gray-400">
                {admin?.email || "-"}
              </p>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: "admin" | "superadmin" }) {
  const isSuper = role === "superadmin";
  return (
    <span
      className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full
        ${isSuper
          ? "bg-amber-100 text-amber-700"
          : "bg-gray-100 text-gray-500"
        }`}
    >
      <i className={`fi ${isSuper ? "fi-rr-crown" : "fi-rr-shield"}`} />
      {isSuper ? "Super Admin" : "Admin"}
    </span>
  );
}
