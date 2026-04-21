"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { RefreshCw, MapPin, FileText, FileSpreadsheet, Search, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type LokasiOption = { id: number; nama: string };

type LegalitasRow = {
  id: number;
  id_kavling: number;
  atas_nama_surat: string;
  no_surat: string;
  progres: string;
  bukti_foto: string;
  keterangan: string;
  kavling?: {
    kode_kavling: string;
    customer?: { nama: string } | null;
  } | null;
};

type EditForm = {
  atas_nama_surat: string;
  no_surat: string;
  progres: string;
  keterangan: string;
};

const PROGRES_OPTIONS = ["Semua", "BF", "AKAD", "LUNAS", "HLD"];

const PROGRES_STYLE: Record<string, string> = {
  BF:    "bg-green-600 text-white",
  AKAD:  "bg-indigo-700 text-white",
  LUNAS: "bg-cyan-600 text-white",
  HLD:   "bg-yellow-500 text-white",
};

const ITEMS_PER_PAGE = 10;

export default function LegalitasPage() {
  const [lokasis, setLokasis] = useState<LokasiOption[]>([]);
  const [selectedLokasi, setSelectedLokasi] = useState<LokasiOption | null>(null);
  const [filterProgres, setFilterProgres] = useState("Semua");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<LegalitasRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [lokDropOpen, setLokDropOpen] = useState(false);
  const [lokSearch, setLokSearch] = useState("");
  const lokRef = useRef<HTMLDivElement>(null);

  const [editTarget, setEditTarget] = useState<LegalitasRow | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ atas_nama_surat: "", no_surat: "", progres: "", keterangan: "" });
  const [editLoading, setEditLoading] = useState(false);

  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    api.get<ApiResponse<LokasiOption[]>>("/lokasi-kavling").then((r) => setLokasis(r.data.data ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (lokRef.current && !lokRef.current.contains(e.target as Node)) setLokDropOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedLokasi) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ id_lokasi: String(selectedLokasi.id) });
      if (filterProgres !== "Semua") params.set("progres", filterProgres);
      if (search) params.set("q", search);
      const res = await api.get<ApiResponse<LegalitasRow[]>>(`/legalitas?${params}`);
      setData(res.data.data ?? []);
      setPage(1);
    } catch {
      addToast("Gagal memuat data legalitas", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedLokasi, filterProgres, search, addToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function selectLokasi(l: LokasiOption) {
    setSelectedLokasi(l);
    setLokDropOpen(false);
    setLokSearch("");
    setFilterProgres("Semua");
    setSearch("");
  }

  function clearLokasi() {
    setSelectedLokasi(null);
    setData([]);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));
  const paged = data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const lokFiltered = lokasis.filter((l) => l.nama.toLowerCase().includes(lokSearch.toLowerCase()));

  function openEdit(item: LegalitasRow) {
    setEditTarget(item);
    setEditForm({ atas_nama_surat: item.atas_nama_surat, no_surat: item.no_surat, progres: item.progres, keterangan: item.keterangan });
  }

  async function handleEditSave() {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await api.put(`/legalitas/${editTarget.id}`, {
        atas_nama_surat: editForm.atas_nama_surat,
        no_surat: editForm.no_surat,
        progres: editForm.progres,
        keterangan: editForm.keterangan,
      });
      addToast("Data legalitas diperbarui", "success");
      setEditTarget(null);
      fetchData();
    } catch {
      addToast("Gagal menyimpan legalitas", "error");
    } finally {
      setEditLoading(false);
    }
  }

  const pageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    return [1, 2, 3, 4, 5, "..." as const, totalPages];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Data Legalitas</h1>
        <div className="flex items-center gap-2">
          {/* Lokasi searchable dropdown */}
          <div ref={lokRef} className="relative">
            <button
              onClick={() => setLokDropOpen((o) => !o)}
              className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 text-sm bg-white hover:bg-gray-50 min-w-44"
            >
              {selectedLokasi ? (
                <>
                  <span className="flex-1 text-left text-gray-800 truncate">{selectedLokasi.nama}</span>
                  <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 shrink-0"
                    onClick={(e) => { e.stopPropagation(); clearLokasi(); }} />
                </>
              ) : (
                <>
                  <span className="flex-1 text-left text-gray-400">Pilih Lokasi Kavling</span>
                  <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                </>
              )}
            </button>
            {lokDropOpen && (
              <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-md shadow-lg">
                <div className="p-2">
                  <input autoFocus type="text" value={lokSearch} onChange={(e) => setLokSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <ul className="max-h-48 overflow-y-auto">
                  {lokFiltered.map((l) => (
                    <li key={l.id} onClick={() => selectLokasi(l)}
                      className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${selectedLokasi?.id === l.id ? "bg-blue-600 text-white" : "text-gray-700"}`}>
                      {l.nama}
                    </li>
                  ))}
                  {lokFiltered.length === 0 && <li className="px-3 py-2 text-sm text-gray-400">Tidak ditemukan</li>}
                </ul>
              </div>
            )}
          </div>

          <select value={filterProgres} onChange={(e) => { setFilterProgres(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {PROGRES_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" /> Reload
          </Button>

          {selectedLokasi && (
            <>
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white text-sm font-medium">
                <FileText className="h-4 w-4" /> PDF
              </button>
              <button className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium">
                <FileSpreadsheet className="h-4 w-4" /> Excel
              </button>
            </>
          )}
        </div>
      </div>

      {!selectedLokasi ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-24 gap-3">
          <MapPin className="h-14 w-14 text-gray-300" />
          <p className="text-base font-semibold text-gray-500">Pilih Lokasi Kavling</p>
          <p className="text-sm text-gray-400">Silakan pilih lokasi kavling terlebih dahulu untuk menampilkan data legalitas.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="text-sm text-gray-600">
              Total: <span className="font-semibold">{data.length}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              Search:
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-7 pr-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600 w-12">No</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Kode Kavling</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Nama Konsumen</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Atas Nama Surat</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">No. Surat</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Progres</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Bukti Foto</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Keterangan</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-10 text-gray-400">Tidak ada data</td></tr>
                  ) : paged.map((d, idx) => (
                    <tr key={d.id} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="px-4 py-3 text-gray-500">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                      <td className="px-4 py-3 text-gray-700">{d.kavling?.kode_kavling ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-700">{d.kavling?.customer?.nama ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{d.atas_nama_surat}</td>
                      <td className="px-4 py-3 text-gray-600">{d.no_surat}</td>
                      <td className="px-4 py-3 text-center">
                        {d.progres ? (
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${PROGRES_STYLE[d.progres] ?? "bg-gray-200 text-gray-700"}`}>
                            {d.progres}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {d.bukti_foto ? (
                          <a href={d.bukti_foto} target="_blank" rel="noreferrer"
                            className="px-3 py-1 rounded text-xs font-medium bg-cyan-500 hover:bg-cyan-600 text-white">
                            Lihat
                          </a>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{d.keterangan}</td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => openEdit(d)}
                          className="px-3 py-1 rounded text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
            <span>
              Showing {data.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(page * ITEMS_PER_PAGE, data.length)} of {data.length} entries
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 rounded border border-gray-200 text-xs disabled:opacity-40 hover:bg-gray-50">Previous</button>
              {pageNumbers().map((p, i) =>
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-2 py-1 text-xs text-gray-400">...</span>
                ) : (
                  <button key={p} onClick={() => setPage(p as number)}
                    className={`px-3 py-1 rounded border text-xs ${p === page ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 hover:bg-gray-50"}`}>
                    {p}
                  </button>
                )
              )}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 rounded border border-gray-200 text-xs disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit Legalitas — ${editTarget?.kavling?.kode_kavling ?? ""}`}
        headerVariant="primary"
        footer={
          <>
            <Button variant="destructive" onClick={() => setEditTarget(null)} disabled={editLoading}>Batal</Button>
            <Button onClick={handleEditSave} disabled={editLoading}>{editLoading ? "Menyimpan..." : "Simpan"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Atas Nama Surat</label>
            <input type="text" value={editForm.atas_nama_surat}
              onChange={(e) => setEditForm((f) => ({ ...f, atas_nama_surat: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. Surat</label>
            <input type="text" value={editForm.no_surat}
              onChange={(e) => setEditForm((f) => ({ ...f, no_surat: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Progres</label>
            <select value={editForm.progres} onChange={(e) => setEditForm((f) => ({ ...f, progres: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Pilih Progres —</option>
              {["BF", "AKAD", "LUNAS", "HLD"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea rows={3} value={editForm.keterangan}
              onChange={(e) => setEditForm((f) => ({ ...f, keterangan: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
