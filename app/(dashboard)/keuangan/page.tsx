"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { RekapKredit } from "@/types/keuangan";
import type { ApiResponse } from "@/types/api";
import { formatRupiah } from "@/lib/utils";

export default function KeuanganPage() {
  const [rekaps, setRekaps] = useState<RekapKredit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse<RekapKredit[]>>("/keuangan/rekap-kredit")
      .then((r) => setRekaps(r.data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "kode_kavling", header: "Kavling" },
    { key: "nama_customer", header: "Customer" },
    {
      key: "cicilan_per_bulan",
      header: "Cicilan/Bulan",
      render: (r: RekapKredit) => formatRupiah(r.cicilan_per_bulan),
    },
    {
      key: "lama_cicilan",
      header: "Lama",
      render: (r: RekapKredit) => `${r.lama_cicilan} bln`,
    },
    {
      key: "tunggakan",
      header: "Tunggakan",
      render: (r: RekapKredit) => (
        <span className={r.tunggakan > 0 ? "text-red-600 font-medium" : ""}>
          {r.tunggakan > 0 ? `${r.tunggakan} bln` : "-"}
        </span>
      ),
    },
    {
      key: "status_bulan_ini",
      header: "Status Bulan Ini",
      render: (r: RekapKredit) => {
        const map: Record<string, { label: string; variant: "success" | "danger" | "warning" | "default" }> = {
          "Lunas": { label: "Lunas", variant: "success" },
          "Terlambat": { label: "Terlambat", variant: "danger" },
          "Belum Bayar": { label: "Belum Bayar", variant: "warning" },
          "Sudah Bayar": { label: "Sudah Bayar", variant: "success" },
        };
        const s = map[r.status_bulan_ini] ?? { label: r.status_bulan_ini, variant: "default" as const };
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end">
        <Link href="/keuangan/transaksi">
          <Button variant="outline" size="sm">Transaksi Keuangan</Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Rekap Kredit</h3>
        <DataTable
          columns={columns}
          data={rekaps}
          loading={loading}
          emptyText="Tidak ada data kredit"
          actions={(r) => (
            <Link href={`/pembayaran/${r.id_transaksi}`}>
              <Button size="sm" variant="outline">
                <Eye className="h-3.5 w-3.5 mr-1" />
                Detail
              </Button>
            </Link>
          )}
        />
      </div>

    </div>
  );
}
