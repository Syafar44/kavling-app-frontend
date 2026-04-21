"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { formatRupiah } from "@/lib/utils";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type DataBank = { id: number; nama_bank: string; no_rekening: string; nama_rekening: string; saldo: number };
type FormData = { nama_bank: string; no_rekening: string; atas_nama: string };
const emptyForm = (): FormData => ({ nama_bank: "", no_rekening: "", atas_nama: "" });

export default function DataBankPage() {
  const [list, setList] = useState<DataBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DataBank | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<DataBank | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm());
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<DataBank[]>>("/bank");
      setList(res.data.data ?? []);
    } catch {
      addToast("Gagal memuat data bank", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = list.filter((d) =>
    !search || d.nama_bank?.toLowerCase().includes(search.toLowerCase()) || d.no_rekening?.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setEditTarget(undefined); setForm(emptyForm()); setFormOpen(true); }
  function openEdit(d: DataBank) { setEditTarget(d); setForm({ nama_bank: d.nama_bank, no_rekening: d.no_rekening, atas_nama: d.nama_rekening }); setFormOpen(true); }

  async function handleSave() {
    if (!form.nama_bank) { addToast("Nama bank wajib diisi", "error"); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/bank/${editTarget.id}`, form);
        addToast("Bank diperbarui", "success");
      } else {
        await api.post("/bank", form);
        addToast("Bank berhasil ditambahkan", "success");
      }
      setFormOpen(false);
      fetchAll();
    } catch {
      addToast("Gagal menyimpan data", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/bank/${deleteTarget.id}`);
      addToast("Bank dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus bank", "error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Data Bank / Rekening</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="h-4 w-4" />Reload</Button>
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4" />Tambah Bank</Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-3">
          <input type="text" placeholder="Cari bank..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
        </div>

        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Rekening</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">No. Rekening</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pemilik Rek</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Saldo</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">Belum ada data bank</td></tr>
              ) : filtered.map((d, i) => (
                <tr key={d.id} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="px-4 py-3 font-medium text-gray-800">{d.nama_bank}</td>
                  <td className="px-4 py-3 text-gray-600">{d.no_rekening || "-"}</td>
                  <td className="px-4 py-3 text-gray-600">{d.nama_rekening || "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">{formatRupiah(d.saldo)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(d)} className="px-3 py-1 rounded border border-blue-300 text-blue-600 text-xs hover:bg-blue-50">Edit</button>
                      <button onClick={() => setDeleteTarget(d)} className="px-3 py-1 rounded border border-red-300 text-red-600 text-xs hover:bg-red-50">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editTarget ? "Edit Bank" : "Tambah Bank"} headerVariant="primary"
        footer={<><Button variant="destructive" onClick={() => setFormOpen(false)} disabled={saving}>Batal</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button></>}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Rekening</label>
            <input type="text" value={form.nama_bank} onChange={(e) => setForm((f) => ({ ...f, nama_bank: e.target.value }))}
              placeholder="Contoh: BRI, BCA, Mandiri" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">No. Rekening</label>
            <input type="text" value={form.no_rekening} onChange={(e) => setForm((f) => ({ ...f, no_rekening: e.target.value }))}
              placeholder="Contoh: 1234567890" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Pemilik Rek</label>
            <input type="text" value={form.atas_nama} onChange={(e) => setForm((f) => ({ ...f, atas_nama: e.target.value }))}
              placeholder="Nama pemilik rekening" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        message="Hapus bank?" description="Bank yang masih digunakan transaksi tidak akan terhapus." confirmLabel="Ya, Hapus" cancelLabel="Batal" />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
