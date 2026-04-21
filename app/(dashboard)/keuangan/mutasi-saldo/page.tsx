"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type Mutasi = {
  id: number;
  tanggal: string;
  id_bank_asal: number;
  id_bank_tujuan: number;
  nominal: number;
  keterangan: string;
  bank_asal?: { id: number; nama_bank: string };
  bank_tujuan?: { id: number; nama_bank: string };
};
type Bank = { id: number; nama_bank: string };
type FormData = { tanggal: string; id_bank_asal: string; id_bank_tujuan: string; nominal: string; keterangan: string };
const emptyForm = (): FormData => ({ tanggal: new Date().toISOString().split("T")[0], id_bank_asal: "", id_bank_tujuan: "", nominal: "", keterangan: "" });

export default function MutasiSaldoPage() {
  const [list, setList] = useState<Mutasi[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Mutasi | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm());
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, bankRes] = await Promise.all([
        api.get<ApiResponse<Mutasi[]>>("/mutasi-saldo"),
        api.get<ApiResponse<Bank[]>>("/bank"),
      ]);
      setList(listRes.data.data ?? []);
      setBanks(bankRes.data.data ?? []);
    } catch {
      addToast("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSave() {
    if (!form.nominal || !form.id_bank_asal || !form.id_bank_tujuan) {
      addToast("Rekening asal, tujuan, dan nominal wajib diisi", "error"); return;
    }
    if (form.id_bank_asal === form.id_bank_tujuan) {
      addToast("Rekening asal dan tujuan tidak boleh sama", "error"); return;
    }
    setSaving(true);
    try {
      await api.post("/mutasi-saldo", {
        tanggal: form.tanggal ? new Date(form.tanggal).toISOString() : new Date().toISOString(),
        id_bank_asal: Number(form.id_bank_asal),
        id_bank_tujuan: Number(form.id_bank_tujuan),
        nominal: Number(form.nominal.replace(/\D/g, "")),
        keterangan: form.keterangan,
      });
      addToast("Mutasi saldo berhasil", "success");
      setFormOpen(false);
      fetchAll();
    } catch {
      addToast("Gagal menyimpan mutasi", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/mutasi-saldo/${deleteTarget.id}`);
      addToast("Mutasi dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus mutasi", "error");
    }
  }

  const columns = [
    { key: "tanggal", header: "Tanggal", render: (r: Mutasi) => formatTanggal(r.tanggal) },
    { key: "bank_asal", header: "Dari", render: (r: Mutasi) => r.bank_asal?.nama_bank ?? "-" },
    { key: "bank_tujuan", header: "Ke", render: (r: Mutasi) => r.bank_tujuan?.nama_bank ?? "-" },
    { key: "nominal", header: "Nominal", render: (r: Mutasi) => <span className="font-semibold">{formatRupiah(r.nominal)}</span> },
    { key: "keterangan", header: "Keterangan" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Mutasi Saldo</h1>
        <Button onClick={() => { setForm(emptyForm()); setFormOpen(true); }}><Plus className="h-4 w-4" />Tambah Mutasi</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : (
        <DataTable columns={columns} data={list} emptyText="Belum ada data mutasi saldo"
          actions={(r) => (
            <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(r)}>Hapus</Button>
          )}
        />
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Form Mutasi Saldo" headerVariant="primary"
        footer={<><Button variant="destructive" onClick={() => setFormOpen(false)} disabled={saving}>Batal</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button></>}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input type="date" value={form.tanggal} onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Rekening Asal</label>
            <select value={form.id_bank_asal} onChange={(e) => setForm((f) => ({ ...f, id_bank_asal: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="">Pilih Rekening Asal</option>
              {banks.map((b) => <option key={b.id} value={b.id}>{b.nama_bank}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Rekening Tujuan</label>
            <select value={form.id_bank_tujuan} onChange={(e) => setForm((f) => ({ ...f, id_bank_tujuan: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="">Pilih Rekening Tujuan</option>
              {banks.map((b) => <option key={b.id} value={b.id}>{b.nama_bank}</option>)}
            </select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
            <div className="flex"><span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm">Rp.</span>
              <input type="text" placeholder="0" value={form.nominal} onChange={(e) => setForm((f) => ({ ...f, nominal: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 text-sm" /></div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <input type="text" value={form.keterangan} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        message="Hapus mutasi saldo?" description="Saldo kedua rekening akan dikembalikan ke kondisi sebelumnya." confirmLabel="Ya, Hapus" cancelLabel="Batal" />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
