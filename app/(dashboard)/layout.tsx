"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/kavling": "Manajemen Kavling",
  "/marketing": "Manajemen Marketing",
  "/customer": "Manajemen Customer",
  "/transaksi": "Transaksi",
  "/pembayaran": "Pembayaran Cicilan",
  "/keuangan": "Keuangan",
  "/keuangan/transaksi": "Transaksi Keuangan",
  "/laporan": "Laporan",
  "/statistik": "Statistik / History Pembayaran",
  "/konfigurasi": "Konfigurasi Sistem",
  "/pengguna": "Manajemen Pengguna",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const title =
    Object.entries(PAGE_TITLES)
      .sort(([a], [b]) => b.length - a.length)
      .find(([path]) => pathname.startsWith(path))?.[1] ?? "Dashboard";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <div
        className={cn(
          "flex flex-col flex-1 transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}
      >
        <Header title={title} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
