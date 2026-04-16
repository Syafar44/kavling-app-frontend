"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import type { TransaksiKavling } from "@/types/transaksi";
import type { ApiResponse } from "@/types/api";
import { formatRupiah, formatTanggal } from "@/lib/utils";

const JENIS_BADGE: Record<number, { label: string; variant: "warning" | "info" | "danger" }> = {
  2: { label: "Cash", variant: "info" },
  3: { label: "Kredit", variant: "danger" },
};

export default function TransaksiPage() {
  const [transaksis, setTransaksis] = useState<TransaksiKavling[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse<TransaksiKavling[]>>("/transaksi")
      .then((r) => setTransaksis(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      key: "kavling",
      header: "Kavling",
      render: (t: TransaksiKavling) => t.kavling?.kode_kavling ?? "-",
    },
    {
      key: "customer",
      header: "Customer",
      render: (t: TransaksiKavling) => t.customer?.nama ?? "-",
    },
    {
      key: "marketing",
      header: "Marketing",
      render: (t: TransaksiKavling) => t.marketing?.nama ?? "-",
    },
    {
      key: "jenis_pembelian",
      header: "Jenis",
      render: (t: TransaksiKavling) => {
        const b = JENIS_BADGE[t.jenis_pembelian];
        return b ? <Badge variant={b.variant}>{b.label}</Badge> : "-";
      },
    },
    {
      key: "harga_jual",
      header: "Harga Jual",
      render: (t: TransaksiKavling) => formatRupiah(t.harga_jual),
    },
    {
      key: "cicilan_per_bulan",
      header: "Cicilan/Bln",
      render: (t: TransaksiKavling) =>
        t.cicilan_per_bulan ? formatRupiah(t.cicilan_per_bulan) : "-",
    },
    {
      key: "created_at",
      header: "Tanggal",
      render: (t: TransaksiKavling) =>
        t.created_at ? formatTanggal(t.created_at) : "-",
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <DataTable
        columns={columns}
        data={transaksis}
        loading={loading}
        emptyText="Belum ada transaksi"
      />
    </div>
  );
}
