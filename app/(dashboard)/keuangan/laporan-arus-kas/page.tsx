"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatRupiah } from "@/lib/utils";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type ArusKasRow = {
  id: number;
  tanggal: string;
  no_transaksi: string;
  jenis: string;
  nominal: number;
  kategori?: string;
  bank?: { nama_bank: string };
};

type LaporanData = {
  list: ArusKasRow[];
  total_debit: number;
  total_kredit: number;
  saldo_akhir: number;
};

type LokasiOption = { id: number; nama: string };

const MONTHS = ["Semua","Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear - 1, currentYear - 2].map(String);

function formatTanggalID(dateStr: string) {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth() + 1]} ${d.getFullYear()}`;
}

export default function LaporanArusKasPage() {
  const [filterTahun, setFilterTahun] = useState(String(currentYear));
  const [filterBulan, setFilterBulan] = useState("");
  const [filterLokasi, setFilterLokasi] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LaporanData | null>(null);
  const [lokasis, setLokasis] = useState<LokasiOption[]>([]);

  // Fetch lokasis on mount
  useState(() => {
    api.get<ApiResponse<LokasiOption[]>>("/lokasi-kavling").then((res) => {
      setLokasis(res.data.data ?? []);
    }).catch(console.error);
  });

  async function handleFilter() {
    if (!filterTahun) { return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ tahun: filterTahun });
      if (filterBulan) params.set("bulan", filterBulan);
      if (filterLokasi) params.set("id_lokasi", filterLokasi);
      const res = await api.get<ApiResponse<LaporanData>>(`/laporan/arus-kas?${params}`);
      setData(res.data.data ?? null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const list = data?.list ?? [];
  const pemasukan = data?.total_debit ?? 0;
  const pengeluaran = data?.total_kredit ?? 0;
  const saldoAkhir = data?.saldo_akhir ?? 0;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-900">Laporan Arus Kas</h1>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tahun</label>
          <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Bulan (opsional)</label>
          <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Bulan</option>
            {MONTHS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Lokasi (opsional)</label>
          <select value={filterLokasi} onChange={(e) => setFilterLokasi(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Lokasi</option>
            {lokasis.map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}
          </select>
        </div>
        <Button onClick={handleFilter} disabled={loading}>{loading ? "Memuat..." : "Tampilkan"}</Button>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-xl border border-green-100 p-4">
            <p className="text-xs text-green-600 font-medium">Total Pemasukan</p>
            <p className="text-xl font-bold text-green-700 mt-1">{formatRupiah(pemasukan)}</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-100 p-4">
            <p className="text-xs text-red-600 font-medium">Total Pengeluaran</p>
            <p className="text-xl font-bold text-red-700 mt-1">{formatRupiah(pengeluaran)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <p className="text-xs text-blue-600 font-medium">Saldo Akhir</p>
            <p className="text-xl font-bold text-blue-700 mt-1">{formatRupiah(saldoAkhir)}</p>
          </div>
        </div>
      )}

      {/* Table */}
      {data && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">No Transaksi</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Kategori</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Bank</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Pemasukan</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Pengeluaran</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Tidak ada data</td></tr>
              ) : list.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="px-4 py-3">{formatTanggalID(r.tanggal)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.no_transaksi}</td>
                  <td className="px-4 py-3">{r.kategori ?? "-"}</td>
                  <td className="px-4 py-3">{r.bank?.nama_bank ?? "-"}</td>
                  <td className="px-4 py-3 text-right">
                    {r.jenis === "Pemasukan" ? <span className="text-green-600 font-semibold">{formatRupiah(r.nominal)}</span> : "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.jenis === "Pengeluaran" ? <span className="text-red-600 font-semibold">{formatRupiah(r.nominal)}</span> : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!data && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
          Pilih tahun dan klik Tampilkan untuk melihat laporan arus kas
        </div>
      )}
    </div>
  );
}
