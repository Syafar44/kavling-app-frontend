"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type Kategori = { id: number; kode: string; kategori: string; jenis: string; is_system: boolean };
type FormData = { kategori: string; jenis: string };
const emptyForm = (): FormData => ({ kategori: "", jenis: "PEMASUKAN" });

export default function KategoriPage() {
  const [list, setList] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Kategori | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Kategori | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm());
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Kategori[]>>("/kategori-transaksi");
      setList(res.data.data ?? []);
    } catch {
      addToast("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openAdd() { setEditTarget(undefined); setForm(emptyForm()); setFormOpen(true); }
  function openEdit(k: Kategori) { setEditTarget(k); setForm({ kategori: k.kategori, jenis: k.jenis }); setFormOpen(true); }

  async function handleSave() {
    if (!form.kategori || !form.jenis) { addToast("Nama dan jenis wajib diisi", "error"); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/kategori-transaksi/${editTarget.id}`, form);
        addToast("Kategori diperbarui", "success");
      } else {
        await api.post("/kategori-transaksi", form);
        addToast("Kategori berhasil ditambahkan", "success");
      }
      setFormOpen(false);
      fetchAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      addToast(msg ?? "Gagal menyimpan kategori", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/kategori-transaksi/${deleteTarget.id}`);
      addToast("Kategori dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      addToast(msg ?? "Gagal menghapus kategori", "error");
    }
  }

  const columns = [
    { key: "kode", header: "Kode" },
    { key: "kategori", header: "Nama Kategori" },
    { key: "jenis", header: "Jenis", render: (r: Kategori) => (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.jenis === "PEMASUKAN" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.jenis}</span>
    )},
    { key: "is_system", header: "Sistem", render: (r: Kategori) => r.is_system ? <span className="text-xs text-gray-400">Sistem</span> : null },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Kategori Transaksi</h1>
        <Button onClick={openAdd}><Plus className="h-4 w-4" />Tambah Kategori</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-10 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : (
        <DataTable columns={columns} data={list} emptyText="Belum ada kategori"
          actions={(r) => !r.is_system ? (
            <>
              <Button size="sm" variant="outline" onClick={() => openEdit(r)} className="border-blue-300 text-blue-600 hover:bg-blue-50">Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(r)}>Hapus</Button>
            </>
          ) : null}
        />
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editTarget ? "Edit Kategori" : "Tambah Kategori"} headerVariant="primary"
        footer={<><Button variant="destructive" onClick={() => setFormOpen(false)} disabled={saving}>Batal</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button></>}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
            <input type="text" value={form.kategori} onChange={(e) => setForm((f) => ({ ...f, kategori: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
            <select value={form.jenis} onChange={(e) => setForm((f) => ({ ...f, jenis: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="PEMASUKAN">PEMASUKAN</option>
              <option value="PENGELUARAN">PENGELUARAN</option>
            </select></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        message="Hapus kategori?" description="Kategori yang sedang digunakan tidak dapat dihapus." confirmLabel="Ya, Hapus" cancelLabel="Batal" />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
