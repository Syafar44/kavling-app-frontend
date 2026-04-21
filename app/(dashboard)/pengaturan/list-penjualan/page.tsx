"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";

type ListPenjualan = {
  id: number;
  kode: string;
  progres: string;
  keterangan: string;
  status: "Aktif" | "Tidak Aktif";
  warna: string;
  urutan: number;
};

type FormData = {
  progres: string;
  kode: string;
  keterangan: string;
  urutan: string;
  warna: string;
  status: string;
};

const DUMMY: ListPenjualan[] = [
  { id: 1, kode: "Rdy",   progres: "Ready",       keterangan: "Kavling Siap Dijual",       status: "Aktif",       warna: "#22c55e", urutan: 1 },
  { id: 2, kode: "HLD",   progres: "HOLD",         keterangan: "Kavling Sedang Ditahan",    status: "Aktif",       warna: "#eab308", urutan: 2 },
  { id: 3, kode: "BF",    progres: "BF",           keterangan: "Booking Fee",               status: "Aktif",       warna: "#3b82f6", urutan: 3 },
  { id: 4, kode: "AKAD",  progres: "AKAD",         keterangan: "Proses Akad",               status: "Aktif",       warna: "#8b5cf6", urutan: 4 },
  { id: 5, kode: "",      progres: "User Cancel",  keterangan: "Dibatalkan oleh Customer",  status: "Tidak Aktif", warna: "#ef4444", urutan: 5 },
  { id: 6, kode: "LUNAS", progres: "LUNAS",        keterangan: "Kavling Sudah Lunas",       status: "Aktif",       warna: "#06b6d4", urutan: 6 },
];

const STATUS_OPTIONS = ["Aktif", "Tidak Aktif"];

const emptyForm = (): FormData => ({
  progres: "", kode: "", keterangan: "", urutan: "", warna: "#3b82f6", status: "Aktif",
});

export default function ListPenjualanPage() {
  const [list, setList] = useState<ListPenjualan[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ListPenjualan | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<ListPenjualan | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm());
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<ListPenjualan[]>>("/list-penjualan");
      setList(res.data.data ?? []);
    } catch { /* noop */ }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openAdd() { setEditTarget(undefined); setForm(emptyForm()); setFormOpen(true); }
  function openEdit(item: ListPenjualan) {
    setEditTarget(item);
    setForm({
      progres: item.progres,
      kode: item.kode,
      keterangan: item.keterangan,
      urutan: String(item.urutan),
      warna: item.warna,
      status: item.status,
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.progres) { addToast("Progres Penjualan wajib diisi", "error"); return; }
    setFormLoading(true);
    try {
      const payload = { progres: form.progres, kode: form.kode, keterangan: form.keterangan, urutan: Number(form.urutan) || list.length + 1, warna: form.warna };
      if (editTarget) {
        await api.put(`/list-penjualan/${editTarget.id}`, payload);
        addToast("Data berhasil diperbarui", "success");
      } else {
        await api.post("/list-penjualan", payload);
        addToast("Data berhasil ditambahkan", "success");
      }
      setFormOpen(false);
      fetchAll();
    } catch {
      addToast("Gagal menyimpan data", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/list-penjualan/${deleteTarget.id}`);
      addToast("Data dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus data", "error");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">List Progres Penjualan</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4" /> Reload
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Tambah List
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-12">No</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Kode</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Progres</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Keterangan</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Warna</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">Belum ada data</td>
              </tr>
            ) : (
              list.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-gray-700 font-medium">{item.kode || "-"}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{item.progres}</td>
                  <td className="px-4 py-3 text-gray-600">{item.keterangan}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                      item.status === "Aktif" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-6 h-6 rounded border border-gray-200 shrink-0" style={{ backgroundColor: item.warna }} />
                      <span className="text-gray-600 font-mono text-xs">{item.warna}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(item)} className="border-blue-300 text-blue-600 hover:bg-blue-50">Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(item)}>Hapus</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 text-sm text-gray-500 border-t border-gray-100">
          Showing 1 to {list.length} of {list.length} entries
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Form Progres Penjualan"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Progres Penjualan</label>
            <input
              type="text"
              value={form.progres}
              onChange={(e) => setForm((f) => ({ ...f, progres: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Singkat</label>
            <input
              type="text"
              value={form.kode}
              onChange={(e) => setForm((f) => ({ ...f, kode: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea
              rows={3}
              value={form.keterangan}
              onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Urutan</label>
            <input
              type="number"
              value={form.urutan}
              onChange={(e) => setForm((f) => ({ ...f, urutan: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warna</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.warna}
                onChange={(e) => setForm((f) => ({ ...f, warna: e.target.value }))}
                className="h-10 w-16 rounded border border-gray-300 cursor-pointer p-0.5"
              />
              <span className="text-sm text-gray-500 font-mono">{form.warna}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message="Apakah Anda yakin?"
        description="Data ini akan dihapus secara permanen!"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
