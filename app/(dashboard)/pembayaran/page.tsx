"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import type { TransaksiKavling } from "@/types/transaksi";
import type { ApiResponse } from "@/types/api";
import { formatRupiah, formatTanggal } from "@/lib/utils";

function ProgressCicilan({ t }: { t: TransaksiKavling }) {
  const totalKredit = t.harga_jual - t.uang_muka;
  const terbayar = t.total_terbayar ?? 0;
  const terbayarCount = t.jumlah_cicilan_terbayar ?? 0;
  const persen = totalKredit > 0 ? Math.min((terbayar / totalKredit) * 100, 100) : 0;
  const lunas = terbayarCount >= t.lama_cicilan;

  return (
    <div className="min-w-40">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{terbayarCount}/{t.lama_cicilan} cicilan</span>
        <span className={lunas ? "text-green-600 font-semibold" : "text-blue-600"}>
          {persen.toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${lunas ? "bg-green-500" : "bg-blue-500"}`}
          style={{ width: `${persen}%` }}
        />
      </div>
      <div className="text-xs text-gray-400 mt-0.5">
        {formatRupiah(terbayar)} / {formatRupiah(totalKredit)}
      </div>
    </div>
  );
}

export default function PembayaranPage() {
  const [transaksis, setTransaksis] = useState<TransaksiKavling[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ApiResponse<TransaksiKavling[]>>("/transaksi?jenis=kredit")
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
      key: "harga_jual",
      header: "Nilai Kredit",
      render: (t: TransaksiKavling) => (
        <div className="text-sm">
          <div>{formatRupiah(t.harga_jual)}</div>
          <div className="text-xs text-gray-400">DP: {formatRupiah(t.uang_muka)}</div>
        </div>
      ),
    },
    {
      key: "cicilan_per_bulan",
      header: "Cicilan/Bulan",
      render: (t: TransaksiKavling) => (
        <div className="text-sm">
          <div>{formatRupiah(t.cicilan_per_bulan)}</div>
          <div className="text-xs text-gray-400">{t.lama_cicilan} bulan</div>
        </div>
      ),
    },
    {
      key: "tgl_mulai_cicilan",
      header: "Mulai Cicilan",
      render: (t: TransaksiKavling) =>
        t.tgl_mulai_cicilan ? formatTanggal(t.tgl_mulai_cicilan) : "-",
    },
    {
      key: "progress",
      header: "Status Pelunasan",
      render: (t: TransaksiKavling) => <ProgressCicilan t={t} />,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <DataTable
        columns={columns}
        data={transaksis}
        loading={loading}
        emptyText="Belum ada data cicilan kredit"
        actions={(t) => (
          <Link href={`/pembayaran/${t.id}`}>
            <Button size="sm" variant="outline">
              <Eye className="h-3.5 w-3.5 mr-1" />
              Detail
            </Button>
          </Link>
        )}
      />
    </div>
  );
}
