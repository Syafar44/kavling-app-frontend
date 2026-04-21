"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Beranda",
  "/kavling": "Siteplan",
  "/siteplan": "Siteplan",
  "/pembayaran": "Pembayaran",

  "/keuangan": "Keuangan",
  "/keuangan/pemasukan": "Pemasukan",
  "/keuangan/pengeluaran": "Pengeluaran",
  "/keuangan/hutang": "Hutang",
  "/keuangan/piutang": "Piutang",
  "/keuangan/kategori": "Kategori Transaksi",
  "/keuangan/mutasi-saldo": "Mutasi Saldo",
  "/keuangan/laporan-arus-kas": "Laporan Arus Kas",

  "/customer": "Customer",
  "/customer/prospek": "Prospek",
  "/customer/upload-file": "Upload File Customer",
  "/customer/arsip": "Arsip Customer",

  "/legalitas": "Legalitas",

  "/master/marketing": "Master Marketing",
  "/master/lokasi-kavling": "Lokasi Kavling",
  "/master/kavling": "Data Kavling",
  "/master/notaris": "Notaris",

  "/pengaturan/profile": "Pengaturan Profile",
  "/pengaturan/media": "Pengaturan Media",
  "/pengaturan/hak-akses": "Hak Akses",
  "/pengaturan/pengguna": "Pengguna",
  "/pengaturan/list-penjualan": "List Penjualan",
  "/pengaturan/landing": "Pengaturan Landing",
  "/pengaturan/bank": "Bank",
  "/pengaturan/reset-data": "Reset Data",
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
      .find(([path]) => pathname.startsWith(path))?.[1] ?? "Beranda";

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
