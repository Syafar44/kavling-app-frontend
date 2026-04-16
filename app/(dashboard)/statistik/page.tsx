"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import type { ApiResponse } from "@/types/api";
import { formatRupiah, formatTanggal } from "@/lib/utils";

interface MonthStat {
  bulan: number;
  pemasukan: number;
  pengeluaran: number;
}

interface PembayaranItem {
  id: number;
  no_pembayaran: string;
  tanggal: string;
  pembayaran_ke: number;
  jumlah_bayar: number;
  keterangan: string;
  kavling?: { kode_kavling: string };
  customer?: { nama: string };
  bank?: { nama_bank: string };
}

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

export default function StatistikPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<MonthStat[]>([]);
  const [pembayarans, setPembayarans] = useState<PembayaranItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPem, setLoadingPem] = useState(true);

  useEffect(() => {
    setLoadingStats(true);
    api
      .get<ApiResponse<MonthStat[]>>(`/statistik?year=${year}`)
      .then((r) => setStats(r.data.data ?? []))
      .finally(() => setLoadingStats(false));
  }, [year]);

  useEffect(() => {
    api
      .get<ApiResponse<PembayaranItem[]>>("/pembayaran")
      .then((r) => setPembayarans(r.data.data ?? []))
      .finally(() => setLoadingPem(false));
  }, []);

  const totalPemasukan = stats.reduce((s, m) => s + m.pemasukan, 0);
  const totalPengeluaran = stats.reduce((s, m) => s + m.pengeluaran, 0);
  const maxNominal = Math.max(...stats.map((m) => Math.max(m.pemasukan, m.pengeluaran)), 1);

  const columns = [
    { key: "tanggal", header: "Tanggal", render: (r: PembayaranItem) => formatTanggal(r.tanggal) },
    { key: "kavling", header: "Kavling", render: (r: PembayaranItem) => r.kavling?.kode_kavling ?? "-" },
    { key: "customer", header: "Customer", render: (r: PembayaranItem) => r.customer?.nama ?? "-" },
    { key: "pembayaran_ke", header: "Cicilan ke", render: (r: PembayaranItem) => `#${r.pembayaran_ke}` },
    { key: "jumlah_bayar", header: "Jumlah", render: (r: PembayaranItem) => formatRupiah(r.jumlah_bayar) },
    { key: "bank", header: "Bank", render: (r: PembayaranItem) => r.bank?.nama_bank ?? "-" },
  ];

  return (
    <div className="space-y-6">
      {/* Monthly Overview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Statistik Arus Kas</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="px-2 py-1 rounded border text-sm hover:bg-gray-50"
            >
              ‹
            </button>
            <span className="text-sm font-medium w-12 text-center">{year}</span>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="px-2 py-1 rounded border text-sm hover:bg-gray-50"
            >
              ›
            </button>
          </div>
        </div>

        {loadingStats ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            {/* Bar chart */}
            <div className="flex items-end gap-1 h-36 mb-2">
              {BULAN.map((label, i) => {
                const bulanNum = i + 1;
                const stat = stats.find((s) => s.bulan === bulanNum);
                const pem = stat?.pemasukan ?? 0;
                const pen = stat?.pengeluaran ?? 0;
                return (
                  <div key={bulanNum} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex gap-0.5 items-end" style={{ height: "120px" }}>
                      <div
                        className="flex-1 bg-green-400 rounded-t"
                        style={{ height: `${(pem / maxNominal) * 100}%`, minHeight: pem > 0 ? 2 : 0 }}
                        title={`Pemasukan: ${formatRupiah(pem)}`}
                      />
                      <div
                        className="flex-1 bg-red-400 rounded-t"
                        style={{ height: `${(pen / maxNominal) * 100}%`, minHeight: pen > 0 ? 2 : 0 }}
                        title={`Pengeluaran: ${formatRupiah(pen)}`}
                      />
                    </div>
                    <span className="text-xs text-gray-400">{label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded inline-block" /> Pemasukan</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded inline-block" /> Pengeluaran</span>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 text-sm border-t pt-4">
              <div className="text-center">
                <p className="text-gray-500">Total Pemasukan</p>
                <p className="font-semibold text-green-600">{formatRupiah(totalPemasukan)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Total Pengeluaran</p>
                <p className="font-semibold text-red-600">{formatRupiah(totalPengeluaran)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Saldo Bersih</p>
                <p className={`font-semibold ${totalPemasukan - totalPengeluaran >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatRupiah(totalPemasukan - totalPengeluaran)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Riwayat Pembayaran Cicilan</h3>
        <DataTable
          columns={columns}
          data={pembayarans}
          loading={loadingPem}
          emptyText="Belum ada riwayat pembayaran"
        />
      </div>
    </div>
  );
}
