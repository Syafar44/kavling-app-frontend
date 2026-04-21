"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { formatRupiah } from "@/lib/utils";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type PembayaranRow = {
  id: number;
  id_transaksi: number;
  nama_customer: string;
  kode_customer: string;
  no_telp: string;
  jenis_pembelian: string;
  lokasi_perumahan: string;
  kode_kavling: string;
  progres: string;
  nama_marketing: string;
  total_tagihan: number;
  total_terbayar: number;
};

const PROGRES_OPTS = ["Semua Progres", "HOLD", "BF", "AKAD", "LUNAS", "BATAL"];
const STATUS_OPTS = ["Semua Status", "Terhutang", "Lunas"];

export default function PembayaranPage() {
  const [list, setList] = useState<PembayaranRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Semua Status");
  const [filterProgres, setFilterProgres] = useState("Semua Progres");
  const [search, setSearch] = useState("");
  const { toasts, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<PembayaranRow[]>>("/pembayaran");
      setList(res.data.data ?? []);
    } catch {
      // silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // DEBUG: Dihapus — sudah tidak diperlukan di production

  const listData = list.filter((r) => {
    const isLunas = r.total_terbayar >= r.total_tagihan && r.total_tagihan > 0;
    if (filterStatus === "Terhutang" && isLunas) return false;
    if (filterStatus === "Lunas" && !isLunas) return false;
    if (filterProgres !== "Semua Progres" && r.progres !== filterProgres) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.nama_customer?.toLowerCase().includes(q) && !r.kode_customer?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Data Pembayaran</h1>
        <div className="flex items-center gap-2">
          <Link href="/pembayaran/jatuh-tempo">
            <button className="px-4 py-2 rounded-md bg-yellow-400 hover:bg-yellow-500 text-white text-sm font-semibold">Jatuh Tempo</button>
          </Link>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {STATUS_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filterProgres} onChange={(e) => setFilterProgres(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {PROGRES_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="text-sm text-gray-600">Total: <span className="font-semibold">{listData.length}</span> data</div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            Search:
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-40" />
          </div>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-12">No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Lokasi Kavling</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Jumlah Tagihan</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {listData.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Tidak ada data</td></tr>
              ) : listData.map((r, idx) => {
                const sisa = r.total_tagihan - r.total_terbayar;
                const lunas = sisa <= 0 && r.total_tagihan > 0;
                return (
                  <tr key={r.id} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-4 py-4 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{r.nama_customer}</div>
                      <div className="text-xs text-gray-400">{r.kode_customer}</div>
                      <div className="text-xs text-gray-400">{r.no_telp}</div>
                      {r.jenis_pembelian && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold bg-gray-800 text-white">{r.jenis_pembelian}</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-800">{r.lokasi_perumahan}</div>
                      <div className="text-xs text-gray-500">{r.kode_kavling}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-700 mb-1">{r.progres}</div>
                      {r.nama_marketing && (
                        <div className="inline-flex items-center gap-1 bg-yellow-400 text-white text-xs font-semibold px-2 py-0.5 rounded">
                          {r.nama_marketing}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {lunas ? (
                        <span className="inline-block border-2 border-red-500 text-red-500 font-bold text-sm px-3 py-1 rounded">LUNAS</span>
                      ) : (
                        <div className="space-y-0.5 text-xs">
                          <div className="flex justify-between gap-6"><span className="text-gray-500">Tagihan</span><span className="text-amber-500 font-semibold">{formatRupiah(r.total_tagihan)}</span></div>
                          <div className="flex justify-between gap-6"><span className="text-gray-500">Terbayar</span><span className="text-green-600 font-semibold">{formatRupiah(r.total_terbayar)}</span></div>
                          <div className="flex justify-between gap-6"><span className="text-gray-500">Sisa</span><span className="text-red-500 font-semibold">{formatRupiah(sisa)}</span></div>
                          {r.total_tagihan > 0 && (
                            <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                              <div className="h-1 bg-green-500 rounded-full" style={{ width: `${Math.min((r.total_terbayar / r.total_tagihan) * 100, 100)}%` }} />
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Link href={`/pembayaran/${r.id_transaksi}`}>
                        <button className="px-3 py-1.5 rounded text-xs font-semibold bg-green-600 hover:bg-green-700 text-white">Detail</button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
