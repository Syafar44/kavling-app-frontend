"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Users,
  CreditCard,
  Wallet,
  Scale,
  Database,
  Settings,
  ChevronLeft,
  ChevronDown,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useAccess } from "@/hooks/useAccess";

type MenuLeaf = {
  path: string;
  label: string;
  icon?: LucideIcon;
  adminOnly?: boolean;
};

type MenuGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  children: MenuLeaf[];
  adminOnly?: boolean;
};

type MenuItem = (MenuLeaf & { icon: LucideIcon }) | MenuGroup;

function isGroup(item: MenuItem): item is MenuGroup {
  return (item as MenuGroup).children !== undefined;
}

const MENU: MenuItem[] = [
  { path: "/dashboard", label: "Beranda", icon: LayoutDashboard },
  { path: "/kavling", label: "Siteplan", icon: Map },
  { path: "/pembayaran", label: "Pembayaran", icon: CreditCard },
  {
    key: "keuangan",
    label: "Keuangan",
    icon: Wallet,
    children: [
      { path: "/keuangan/pemasukan", label: "Pemasukan" },
      { path: "/keuangan/pengeluaran", label: "Pengeluaran" },
      { path: "/keuangan/hutang", label: "Hutang" },
      { path: "/keuangan/piutang", label: "Piutang" },
      { path: "/keuangan/kategori", label: "Kategori Transaksi" },
      { path: "/keuangan/mutasi-saldo", label: "Mutasi Saldo" },
      { path: "/keuangan/laporan-arus-kas", label: "Laporan Arus Kas" },
    ],
  },
  {
    key: "customer",
    label: "Customer",
    icon: Users,
    children: [
      { path: "/customer", label: "Customer" },
      { path: "/customer/prospek", label: "Prospek" },
      { path: "/customer/upload-file", label: "Upload File" },
      { path: "/customer/arsip", label: "Arsip Customer" },
    ],
  },
  { path: "/legalitas", label: "Legalitas", icon: Scale },
  {
    key: "master",
    label: "Master Data",
    icon: Database,
    children: [
      { path: "/master/marketing", label: "Marketing" },
      { path: "/master/lokasi-kavling", label: "Lokasi Kavling" },
      { path: "/master/kavling", label: "Kavling" },
      { path: "/master/notaris", label: "Notaris" },
    ],
  },
  {
    key: "pengaturan",
    label: "Pengaturan",
    icon: Settings,
    adminOnly: true,
    children: [
      { path: "/pengaturan/profile", label: "Profile" },
      { path: "/pengaturan/media", label: "Media" },
      { path: "/pengaturan/hak-akses", label: "Hak Akses" },
      { path: "/pengaturan/pengguna", label: "Pengguna", adminOnly: true },
      { path: "/pengaturan/list-penjualan", label: "List Penjualan" },
      { path: "/pengaturan/landing", label: "Landing" },
      { path: "/pengaturan/bank", label: "Bank" },
      { path: "/pengaturan/reset-data", label: "Reset Data", adminOnly: true },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
}

export function Sidebar({ collapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const { accessMenus } = useAccess();

  function hasAccess(path: string): boolean {
    if (isAdmin) return true;
    return accessMenus.some(
      (m) => m.url && (m.url === path || path.startsWith(m.url + "/"))
    );
  }

  const visibleMenu = React.useMemo(() => {
    return MENU.reduce<MenuItem[]>((acc, item) => {
      if (item.adminOnly && !isAdmin) return acc;
      if (isGroup(item)) {
        const children = item.children.filter((c) => {
          if (c.adminOnly && !isAdmin) return false;
          return hasAccess(c.path);
        });
        if (children.length) acc.push({ ...item, children });
      } else {
        if (hasAccess(item.path)) acc.push(item);
      }
      return acc;
    }, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, accessMenus]);

  // Track which groups are open; default: open the group containing current path
  const [openKeys, setOpenKeys] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const next: Record<string, boolean> = {};
    for (const item of MENU) {
      if (isGroup(item)) {
        const active = item.children.some(
          (c) => pathname === c.path || pathname.startsWith(c.path + "/")
        );
        if (active) next[item.key] = true;
      }
    }
    setOpenKeys((prev) => ({ ...prev, ...next }));
  }, [pathname]);

  function toggle(key: string) {
    setOpenKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  }

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
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {visibleMenu.map((item) => {
          if (isGroup(item)) {
            const Icon = item.icon;
            const groupActive = item.children.some(
              (c) => pathname === c.path || pathname.startsWith(c.path + "/")
            );
            const isOpen = !collapsed && (openKeys[item.key] ?? false);

            return (
              <div key={item.key}>
                <button
                  type="button"
                  onClick={() => {
                    if (collapsed) {
                      onCollapse(false);
                      setOpenKeys((p) => ({ ...p, [item.key]: true }));
                    } else {
                      toggle(item.key);
                    }
                  }}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 mx-2 rounded-md text-sm font-medium transition-colors",
                    groupActive
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white",
                    collapsed && "justify-center mx-2"
                  )}
                  style={collapsed ? { width: "calc(100% - 1rem)" } : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform shrink-0",
                          isOpen && "rotate-180"
                        )}
                      />
                    </>
                  )}
                </button>
                {!collapsed && isOpen && (
                  <div className="mt-0.5 mb-1 space-y-0.5">
                    {item.children.map((c) => {
                      const active =
                        pathname === c.path || pathname.startsWith(c.path + "/");
                      return (
                        <Link
                          key={c.path}
                          href={c.path}
                          className={cn(
                            "flex items-center pl-12 pr-4 py-2 mx-2 rounded-md text-sm transition-colors",
                            active
                              ? "bg-blue-600 text-white font-medium"
                              : "text-gray-400 hover:bg-gray-800 hover:text-white"
                          )}
                        >
                          {c.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

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
