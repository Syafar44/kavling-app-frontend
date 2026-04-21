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

type Piutang = {
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

export default function PiutangPage() {
  const [list, setList] = useState<Piutang[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [bayarTarget, setBayarTarget] = useState<Piutang | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Piutang | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [bayarNominal, setBayarNominal] = useState("");
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, bankRes] = await Promise.all([
        api.get<ApiResponse<Piutang[]>>("/piutang"),
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
      await api.post("/piutang", {
        tanggal: form.tanggal ? new Date(form.tanggal).toISOString() : new Date().toISOString(),
        nominal: Number(form.nominal.replace(/\D/g, "")),
        deskripsi: form.deskripsi,
        id_bank: form.id_bank ? Number(form.id_bank) : undefined,
      });
      addToast("Piutang berhasil ditambahkan", "success");
      setFormOpen(false);
      fetchAll();
    } catch {
      addToast("Gagal menyimpan piutang", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleBayar() {
    if (!bayarTarget || !bayarNominal) return;
    setSaving(true);
    try {
      await api.post(`/piutang/${bayarTarget.id}/bayar`, { nominal: Number(bayarNominal.replace(/\D/g, "")) });
      addToast("Piutang berhasil dibayar", "success");
      setBayarTarget(null);
      setBayarNominal("");
      fetchAll();
    } catch {
      addToast("Gagal memproses pembayaran", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/piutang/${deleteTarget.id}`);
      addToast("Piutang dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus piutang", "error");
    }
  }

  const columns = [
    { key: "tanggal", header: "Tanggal", render: (r: Piutang) => formatTanggal(r.tanggal) },
    { key: "deskripsi", header: "Deskripsi" },
    { key: "nominal", header: "Nominal", render: (r: Piutang) => formatRupiah(r.nominal) },
    { key: "sisa_bayar", header: "Sisa", render: (r: Piutang) => <span className="text-orange-600 font-semibold">{formatRupiah(r.sisa_bayar)}</span> },
    { key: "status", header: "Status", render: (r: Piutang) => (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.status === "Lunas" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{r.status}</span>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Data Piutang</h1>
        <Button onClick={() => { setForm(emptyForm()); setFormOpen(true); }}><Plus className="h-4 w-4" />Tambah Piutang</Button>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : (
        <DataTable columns={columns} data={list} emptyText="Belum ada data piutang"
          actions={(r) => (
            <>
              {r.status !== "Lunas" && (
                <Button size="sm" variant="outline" onClick={() => { setBayarTarget(r); setBayarNominal(""); }} className="border-green-300 text-green-600 hover:bg-green-50">Terima</Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(r)}>Hapus</Button>
            </>
          )}
        />
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Form Piutang" headerVariant="primary"
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
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Bank (Tujuan Terima)</label>
            <select value={form.id_bank} onChange={(e) => setForm((f) => ({ ...f, id_bank: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
              <option value="">Pilih Bank</option>
              {banks.map((b) => <option key={b.id} value={b.id}>{b.nama_bank}</option>)}
            </select></div>
        </div>
      </Modal>

      <Modal open={!!bayarTarget} onClose={() => setBayarTarget(null)} title="Terima Piutang" headerVariant="primary"
        footer={<><Button variant="destructive" onClick={() => setBayarTarget(null)} disabled={saving}>Batal</Button><Button onClick={handleBayar} disabled={saving}>{saving ? "Memproses..." : "Terima"}</Button></>}>
        {bayarTarget && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-md p-3 text-sm">
              <p className="text-gray-600">Sisa Piutang: <span className="font-bold text-orange-600">{formatRupiah(bayarTarget.sisa_bayar)}</span></p>
              <p className="text-gray-600 mt-1">{bayarTarget.deskripsi}</p>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Nominal Diterima</label>
              <div className="flex"><span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm">Rp.</span>
                <input type="text" placeholder="0" value={bayarNominal} onChange={(e) => setBayarNominal(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 text-sm" /></div></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        message="Hapus piutang?" description="Data piutang ini akan dihapus permanen." confirmLabel="Ya, Hapus" cancelLabel="Batal" />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
