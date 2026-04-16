"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Users,
  UserCheck,
  FileText,
  CreditCard,
  BarChart2,
  TrendingUp,
  Settings,
  Shield,
  ChevronLeft,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAccess } from "@/hooks/useAccess";

const ALL_MENU_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/kavling", label: "Kavling", icon: Map },
  { path: "/marketing", label: "Marketing", icon: UserCheck },
  { path: "/customer", label: "Customer", icon: Users },
  { path: "/transaksi", label: "Transaksi", icon: FileText },
  { path: "/pembayaran", label: "Pembayaran Cicilan", icon: CreditCard },
  { path: "/keuangan", label: "Keuangan", icon: TrendingUp },
  { path: "/laporan", label: "Laporan", icon: BarChart2 },
  { path: "/statistik", label: "Statistik", icon: BarChart2 },
  { path: "/konfigurasi", label: "Konfigurasi", icon: Settings },
  { path: "/pengguna", label: "Pengguna", icon: Shield, adminOnly: true },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const { accessMenus } = useAccess();

  const menuItems = ALL_MENU_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (isAdmin) return true;
    // Non-admin: check if user has access to this path via hak akses
    return accessMenus.some(
      (m) => m.url && (m.url === item.path || item.path.startsWith(m.url + "/"))
    );
  });

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col bg-gray-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
        <Building2 className="h-7 w-7 text-blue-400 shrink-0" />
        {!collapsed && (
          <span className="font-bold text-lg truncate">Kavling App</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.path || pathname.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {!collapsed && user && (
        <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-400">
          <p className="font-medium text-gray-200 truncate">{user.nama}</p>
          <p>{isAdmin ? "Administrator" : "Staff"}</p>
        </div>
      )}

      {/* Collapse btn */}
      <button
        onClick={() => onCollapse(!collapsed)}
        className="flex items-center justify-center py-3 border-t border-gray-700 text-gray-400 hover:text-white transition-colors"
      >
        <ChevronLeft
          className={cn(
            "h-5 w-5 transition-transform",
            collapsed && "rotate-180"
          )}
        />
      </button>
    </aside>
  );
}
