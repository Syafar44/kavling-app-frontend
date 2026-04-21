"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ArrowUpCircle } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type Pengeluaran = {
  id: number;
  tanggal: string;
  nominal: number;
  keterangan: string;
  id_kategori: number;
  id_bank: number;
  kategori?: string;
  bank?: { id: number; nama_bank: string };
};
type Kategori = { id: number; kategori: string };
type Bank = { id: number; nama_bank: string };

export default function PengeluaranPage() {
  const [list, setList] = useState<Pengeluaran[]>([]);
  const [kategoris, setKategoris] = useState<Kategori[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Pengeluaran | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pengeluaran | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tanggal: new Date().toISOString().split("T")[0], nominal: "", keterangan: "", id_kategori: "", id_bank: "" });
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, katRes, bankRes] = await Promise.all([
        api.get<ApiResponse<Pengeluaran[]>>("/pengeluaran"),
        api.get<ApiResponse<Kategori[]>>("/kategori-transaksi?jenis=PENGELUARAN"),
        api.get<ApiResponse<Bank[]>>("/bank"),
      ]);
      setList(listRes.data.data ?? []);
      setKategoris(katRes.data.data ?? []);
      setBanks(bankRes.data.data ?? []);
    } catch {
      addToast("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const total = list.reduce((s, r) => s + r.nominal, 0);

  async function handleSave() {
    if (!form.nominal || !form.id_kategori) { addToast("Nominal dan kategori wajib diisi", "error"); return; }
    setSaving(true);
    try {
      await api.post("/pengeluaran", {
        tanggal: form.tanggal,
        nominal: Number(form.nominal.replace(/\D/g, "")),
        keterangan: form.keterangan,
        id_kategori: Number(form.id_kategori),
        id_bank: form.id_bank ? Number(form.id_bank) : undefined,
      });
      addToast("Pengeluaran berhasil ditambahkan", "success");
      setFormOpen(false);
      fetchAll();
    } catch {
      addToast("Gagal menyimpan pengeluaran", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/pengeluaran/${deleteTarget.id}`);
      addToast("Pengeluaran dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus pengeluaran", "error");
    }
  }

  const columns = [
    { key: "tanggal", header: "Tanggal", render: (r: Pengeluaran) => formatTanggal(r.tanggal) },
    { key: "nominal", header: "Nominal", render: (r: Pengeluaran) => <span className="text-red-600 font-semibold">{formatRupiah(r.nominal)}</span> },
    { key: "kategori", header: "Kategori", render: (r: Pengeluaran) => r.kategori ?? "-" },
    { key: "bank", header: "Rekening", render: (r: Pengeluaran) => r.bank?.nama_bank ?? "-" },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
        <div className="p-3 rounded-lg bg-red-50"><ArrowUpCircle className="h-6 w-6 text-red-600" /></div>
        <div>
          <p className="text-sm text-gray-500">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-gray-800">{formatRupiah(total)}</p>
        </div>
        <div className="ml-auto">
          <Button onClick={() => { setForm({ tanggal: new Date().toISOString().split("T")[0], nominal: "", keterangan: "", id_kategori: "", id_bank: "" }); setFormOpen(true); }}>
            <Plus className="h-4 w-4" />Tambah Pengeluaran
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : (
        <DataTable columns={columns} data={list} emptyText="Belum ada data pengeluaran"
          actions={(p) => (
            <>
              <Button size="sm" variant="outline" onClick={() => setDetailTarget(p)} className="border-blue-300 text-blue-600 hover:bg-blue-50">Detail</Button>
              <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(p)}>Hapus</Button>
            </>
          )}
        />
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Form Data Pengeluaran" headerVariant="primary"
        footer={<><Button variant="destructive" onClick={() => setFormOpen(false)} disabled={saving}>Batal</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button></>}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input type="date" value={form.tanggal} onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
            <div className="flex"><span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm text-gray-600">Rp.</span>
              <input type="text" placeholder="0" value={form.nominal} onChange={(e) => setForm((f) => ({ ...f, nominal: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea rows={3} value={form.keterangan} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select value={form.id_kategori} onChange={(e) => setForm((f) => ({ ...f, id_kategori: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Pilih Kategori</option>
              {kategoris.map((k) => <option key={k.id} value={k.id}>{k.kategori}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Rekening / Bank</label>
            <select value={form.id_bank} onChange={(e) => setForm((f) => ({ ...f, id_bank: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Pilih Rekening</option>
              {banks.map((b) => <option key={b.id} value={b.id}>{b.nama_bank}</option>)}
            </select></div>
        </div>
      </Modal>

      <Modal open={!!detailTarget} onClose={() => setDetailTarget(null)} title="Detail Pengeluaran" headerVariant="primary"
        footer={<Button variant="destructive" onClick={() => setDetailTarget(null)}>Tutup</Button>}>
        {detailTarget && (
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
              <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm">{formatTanggal(detailTarget.tanggal)}</div></div>
            <div className="flex gap-4">
              <div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Rekening</label>
                <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm">{detailTarget.bank?.nama_bank ?? "-"}</div></div>
              <div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
                <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm">{formatRupiah(detailTarget.nominal)}</div></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
              <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm min-h-16">{detailTarget.keterangan || "-"}</div></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm">{detailTarget.kategori ?? "-"}</div></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        message="Hapus pengeluaran?" description="Data ini akan dihapus dan saldo bank akan dikembalikan."
        confirmLabel="Ya, Hapus" cancelLabel="Batal" />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
