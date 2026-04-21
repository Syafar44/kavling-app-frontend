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

type Hutang = {
  id: number;
  tanggal: string;
  deskripsi: string;
  nominal: number;
  sisa_bayar: number;
  status: string;
  id_bank?: number;
  bank?: { id: number; nama_bank: string };
};
type Bank = { id: number; nama_bank: string };

type FormData = { tanggal: string; id_bank: string; nominal: string; deskripsi: string };
const emptyForm = (): FormData => ({ tanggal: new Date().toISOString().split("T")[0], id_bank: "", nominal: "", deskripsi: "" });

export default function HutangPage() {
  const [list, setList] = useState<Hutang[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [bayarTarget, setBayarTarget] = useState<Hutang | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Hutang | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [bayarNominal, setBayarNominal] = useState("");
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, bankRes] = await Promise.all([
        api.get<ApiResponse<Hutang[]>>("/hutang"),
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
    if (!form.nominal || !form.deskripsi) { addToast("Nominal dan deskripsi wajib diisi", "error"); return; }
    setSaving(true);
    try {
      await api.post("/hutang", {
        tanggal: form.tanggal ? new Date(form.tanggal).toISOString() : new Date().toISOString(),
        nominal: Number(form.nominal.replace(/\D/g, "")),
        deskripsi: form.deskripsi,
        id_bank: form.id_bank ? Number(form.id_bank) : undefined,
      });
      addToast("Hutang berhasil ditambahkan", "success");
      setFormOpen(false);
      fetchAll();
    } catch {
      addToast("Gagal menyimpan hutang", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleBayar() {
    if (!bayarTarget || !bayarNominal) return;
    setSaving(true);
    try {
      await api.post(`/hutang/${bayarTarget.id}/bayar`, { nominal: Number(bayarNominal.replace(/\D/g, "")) });
      addToast("Pembayaran hutang berhasil", "success");
      setBayarTarget(null);
      setBayarNominal("");
      fetchAll();
    } catch {
      addToast("Gagal membayar hutang", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/hutang/${deleteTarget.id}`);
      addToast("Hutang dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus hutang", "error");
    }
  }

  const columns = [
    { key: "tanggal", header: "Tanggal", render: (r: Hutang) => formatTanggal(r.tanggal) },
    { key: "deskripsi", header: "Deskripsi" },
    { key: "nominal", header: "Nominal", render: (r: Hutang) => formatRupiah(r.nominal) },
    { key: "sisa_bayar", header: "Sisa Bayar", render: (r: Hutang) => <span className="text-red-600 font-semibold">{formatRupiah(r.sisa_bayar)}</span> },
    { key: "status", header: "Status", render: (r: Hutang) => (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.status === "Lunas" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{r.status}</span>
    )},
    { key: "bank", header: "Bank", render: (r: Hutang) => r.bank?.nama_bank ?? "-" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Data Hutang</h1>
        <Button onClick={() => { setForm(emptyForm()); setFormOpen(true); }}><Plus className="h-4 w-4" />Tambah Hutang</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : (
        <DataTable columns={columns} data={list} emptyText="Belum ada data hutang"
          actions={(r) => (
            <>
              {r.status !== "Lunas" && (
                <Button size="sm" variant="outline" onClick={() => { setBayarTarget(r); setBayarNominal(""); }} className="border-green-300 text-green-600 hover:bg-green-50">Bayar</Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(r)}>Hapus</Button>
            </>
          )}
        />
      )}

      {/* Form Tambah */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Form Hutang" headerVariant="primary"
        footer={<><Button variant="destructive" onClick={() => setFormOpen(false)} disabled={saving}>Batal</Button><Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button></>}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
            <input type="date" value={form.tanggal} onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
            <div className="flex"><span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm">Rp.</span>
              <input type="text" placeholder="0" value={form.nominal} onChange={(e) => setForm((f) => ({ ...f, nominal: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 text-sm" /></div></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea rows={2} value={form.deskripsi} onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Bank (Sumber Dana)</label>
            <select value={form.id_bank} onChange={(e) => setForm((f) => ({ ...f, id_bank: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="">Pilih Bank</option>
              {banks.map((b) => <option key={b.id} value={b.id}>{b.nama_bank}</option>)}
            </select></div>
        </div>
      </Modal>

      {/* Form Bayar */}
      <Modal open={!!bayarTarget} onClose={() => setBayarTarget(null)} title="Bayar Hutang" headerVariant="primary"
        footer={<><Button variant="destructive" onClick={() => setBayarTarget(null)} disabled={saving}>Batal</Button><Button onClick={handleBayar} disabled={saving}>{saving ? "Memproses..." : "Bayar"}</Button></>}>
        {bayarTarget && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-md p-3 text-sm">
              <p className="text-gray-600">Sisa Hutang: <span className="font-bold text-red-600">{formatRupiah(bayarTarget.sisa_bayar)}</span></p>
              <p className="text-gray-600 mt-1">{bayarTarget.deskripsi}</p>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nominal Pembayaran</label>
              <div className="flex"><span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm">Rp.</span>
                <input type="text" placeholder="0" value={bayarNominal} onChange={(e) => setBayarNominal(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 text-sm" /></div></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        message="Hapus hutang?" description="Data hutang ini akan dihapus permanen." confirmLabel="Ya, Hapus" cancelLabel="Batal" />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
