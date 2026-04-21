"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type DataKonten = {
  id: number;
  item: string;
  judul: string;
  gambar: string;
  artikel: string;
  icon: string;
  urutan: number;
};

type FormData = {
  item: string;
  judul: string;
  artikel: string;
  gambar: File | null;
  icon: File | null;
};

const ITEM_OPTIONS = ["Beranda", "About Us", "Fasilitas", "Slider", "Produk", "Document", "Lingkungan"];


const emptyForm = (): FormData => ({ item: "", judul: "", artikel: "", gambar: null, icon: null });

const ITEMS_PER_PAGE = 10;

export default function PengaturanLandingPage() {
  const [list, setList] = useState<DataKonten[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "artikel">("all");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DataKonten | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<DataKonten | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm());
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<DataKonten[]>>("/landing");
      setList(res.data.data ?? []);
    } catch {
      addToast("Gagal memuat data konten", "error");
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = list.filter((d) => {
    const matchSearch = !search || d.judul.toLowerCase().includes(search.toLowerCase()) || d.item.toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === "all" || (activeTab === "artikel" && !!d.artikel);
    return matchSearch && matchTab;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  function openAdd() { setEditTarget(undefined); setForm(emptyForm()); setFormOpen(true); }
  function openEdit(item: DataKonten) {
    setEditTarget(item);
    setForm({ item: item.item, judul: item.judul, artikel: item.artikel, gambar: null, icon: null });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.item || !form.judul) {
      addToast("Item dan Judul wajib diisi", "error");
      return;
    }
    setFormLoading(true);
    try {
      const payload = { item: form.item, judul: form.judul, artikel: form.artikel };
      if (editTarget) {
        await api.put(`/landing/${editTarget.id}`, payload);
        addToast("Konten berhasil diperbarui", "success");
      } else {
        await api.post("/landing", payload);
        addToast("Konten berhasil ditambahkan", "success");
      }
      setFormOpen(false);
      fetchAll();
    } catch {
      addToast("Gagal menyimpan konten", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/landing/${deleteTarget.id}`);
      addToast("Konten dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus konten", "error");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Data Konten</h1>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Tambah Konten
        </Button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs + Search */}
        <div className="flex items-center justify-between px-4 pt-3 pb-0 border-b border-gray-100">
          <div className="flex gap-1">
            <button
              onClick={() => { setActiveTab("all"); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "all" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Show all
            </button>
            <button
              onClick={() => { setActiveTab("artikel"); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "artikel" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              artikel
            </button>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-12">No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Judul</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Gambar</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 max-w-xs">artikel</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">icon</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">Tidak ada data</td>
                </tr>
              ) : (
                paged.map((d, idx) => (
                  <tr key={d.id} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-4 py-3 text-gray-500">{(page - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{d.item}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{d.judul}</td>
                    <td className="px-4 py-3 text-center">
                      {d.gambar ? (
                        <div className="inline-flex items-center justify-center w-10 h-8 bg-gray-100 border border-gray-200 rounded">
                          <ImageIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs">
                      {d.artikel ? (
                        <span className="line-clamp-2 text-xs leading-relaxed">{d.artikel}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {d.icon ? (
                        <div className="inline-flex items-center justify-center w-7 h-7 bg-blue-50 border border-blue-200 rounded">
                          <span className="text-blue-500 text-xs font-bold">i</span>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(d)} className="border-blue-300 text-blue-600 hover:bg-blue-50">Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(d)}>Hapus</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>Showing {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} entries</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border border-gray-200 text-xs disabled:opacity-40 hover:bg-gray-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 rounded border text-xs ${p === page ? "bg-blue-600 border-blue-600 text-white" : "border-gray-200 hover:bg-gray-50"}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border border-gray-200 text-xs disabled:opacity-40 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? "Edit Data Konten" : "Tambah Data Konten"}
        headerVariant="primary"
        footer={
          <>
            <Button variant="destructive" onClick={() => setFormOpen(false)} disabled={formLoading}>Batal</Button>
            <Button onClick={handleSave} disabled={formLoading}>{formLoading ? "Menyimpan..." : "Simpan"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
            <select
              value={form.item}
              onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih Item</option>
              {ITEM_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
            <input
              type="text"
              value={form.judul}
              onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Artikel</label>
            <textarea
              rows={4}
              value={form.artikel}
              onChange={(e) => setForm((f) => ({ ...f, artikel: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gambar</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setForm((f) => ({ ...f, gambar: e.target.files?.[0] ?? null }))}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <input
              type="file"
              accept="image/*,.svg"
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.files?.[0] ?? null }))}
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message="Apakah Anda yakin?"
        description="Konten ini akan dihapus secara permanen!"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
