"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { formatRupiah } from "@/lib/utils";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type JatuhTempoRow = {
  id_transaksi: number;
  nama: string;
  lokasi: string;
  kode_kavling: string;
  harga_tanah: number;
  pembayaran: number;
  pencairan: number;
  sisa: number;
  keterlambatan: string;
  cicilan: number;
  tenor: number;
  jatuh_tempo: string;
  jenis_pembelian: string;
};

type LokasiOption = { id: number; nama: string };

function KeterlambatanBadge({ value }: { value: string }) {
  if (value === "Lunas")  return <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-green-500 text-white">Lunas</span>;
  if (value === "Lancar") return <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-cyan-500 text-white">Lancar</span>;
  return <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-red-500 text-white">{value}</span>;
}

export default function JatuhTempoPage() {
  const [list, setList] = useState<JatuhTempoRow[]>([]);
  const [lokasis, setLokasis] = useState<LokasiOption[]>([]);
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const { toasts, removeToast } = useToast();

  const fetchLokasi = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<LokasiOption[]>>("/lokasi-kavling");
      const data = res.data.data ?? [];
      setLokasis(data);
      if (data.length > 0) setActiveTab(data[0].id);
    } catch { /* noop */ }
  }, []);

  useEffect(() => { fetchLokasi(); }, [fetchLokasi]);

  const fetchData = useCallback(async () => {
    if (activeTab === null) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ id_lokasi: String(activeTab) });
      if (filterJenis) params.set("jenis", filterJenis);
      if (search) params.set("q", search);
      const res = await api.get<ApiResponse<JatuhTempoRow[]>>(`/jatuh-tempo?${params}`);
      setList(res.data.data ?? []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterJenis, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Data Jatuh Tempo</h1>
        <div className="flex items-center gap-2">
          <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-36">
            <option value="">Semua Jenis</option>
            <option value="KREDIT">Kredit</option>
            <option value="CASH KERAS">Cash Keras</option>
            <option value="CASH BERTAHAP">Cash Bertahap</option>
          </select>
          <Link href="/pembayaran"><Button variant="outline" size="sm">← Kembali</Button></Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {lokasis.map((lok) => (
            <button key={lok.id} onClick={() => setActiveTab(lok.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === lok.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {lok.nama}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="text-sm text-gray-600">Total: <span className="font-semibold">{list.length}</span></div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            Search:
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-40" />
          </div>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-2 font-medium text-gray-600 w-10">No</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Customer</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">Kavling</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Harga</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Terbayar</th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">Sisa</th>
                  <th className="text-center px-4 py-2 font-medium text-gray-600">Status</th>
                  <th className="text-center px-4 py-2 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">Tidak ada data</td></tr>
                ) : list.map((r, idx) => (
                  <tr key={r.id_transaksi} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{r.nama}</div>
                      {r.jatuh_tempo && <div className="text-xs text-gray-400">JT: {r.jatuh_tempo.split("T")[0]}</div>}
                      {r.cicilan > 0 && <div className="text-xs text-blue-600">Cicilan: {formatRupiah(r.cicilan)}/bln · {r.tenor} bln</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block bg-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded">{r.kode_kavling}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatRupiah(r.harga_tanah)}</td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">{formatRupiah(r.pembayaran)}</td>
                    <td className="px-4 py-3 text-right text-red-600 font-semibold">{r.sisa > 0 ? formatRupiah(r.sisa) : "—"}</td>
                    <td className="px-4 py-3 text-center"><KeterlambatanBadge value={r.keterlambatan} /></td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/pembayaran/${r.id_transaksi}`}>
                        <button className="px-3 py-1.5 rounded text-xs font-semibold bg-green-600 hover:bg-green-700 text-white">Detail</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
