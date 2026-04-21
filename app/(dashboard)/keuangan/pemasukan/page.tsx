"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ArrowDownCircle } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

// Sesuai respons API: kategori adalah string, bukan object
type Pemasukan = {
  id: number;
  no_transaksi: string;
  jenis: string;         // "Pemasukan" | "Pengeluaran"
  kategori: string;      // string langsung, misal "Pembayaran Kavling"
  keterangan: string;
  nominal: number;
  id_bank: number | null;
  tanggal: string;
  referensi_id: number | null;
  referensi_tipe: string; // "manual" | "pembayaran" | dll
  bank?: { id: number; nama_bank: string; nama_rekening: string; no_rekening: string };
};
type KategoriOption = { id: number; kategori: string };
type Bank = { id: number; nama_bank: string };

export default function PemasukanPage() {
  const [list, setList] = useState<Pemasukan[]>([]);
  const [kategoris, setKategoris] = useState<KategoriOption[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<Pemasukan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pemasukan | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tanggal: new Date().toISOString().split("T")[0], nominal: "", keterangan: "", id_kategori: "", id_bank: "" });
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, katRes, bankRes] = await Promise.all([
        api.get<ApiResponse<Pemasukan[]>>("/pemasukan"),
        api.get<ApiResponse<KategoriOption[]>>("/kategori-transaksi?jenis=PEMASUKAN"),
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

  function openForm() {
    setForm({ tanggal: new Date().toISOString().split("T")[0], nominal: "", keterangan: "", id_kategori: "", id_bank: "" });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.nominal || !form.id_kategori) {
      addToast("Nominal dan kategori wajib diisi", "error");
      return;
    }
    setSaving(true);
    try {
      await api.post("/pemasukan", {
        tanggal: form.tanggal,
        nominal: Number(form.nominal.replace(/\D/g, "")),
        keterangan: form.keterangan,
        id_kategori: Number(form.id_kategori),
        id_bank: form.id_bank ? Number(form.id_bank) : undefined,
      });
      addToast("Pemasukan berhasil ditambahkan", "success");
      setFormOpen(false);
      fetchAll();
    } catch {
      addToast("Gagal menyimpan pemasukan", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/pemasukan/${deleteTarget.id}`);
      addToast("Pemasukan dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus pemasukan", "error");
    }
  }

  // Badge warna berdasarkan referensi_tipe
  function ReferensiBadge({ tipe }: { tipe: string }) {
    const color =
      tipe === "pembayaran" ? "bg-blue-100 text-blue-700" :
      tipe === "manual"     ? "bg-gray-100 text-gray-600" :
                              "bg-purple-100 text-purple-700";
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{tipe}</span>;
  }

  const columns = [
    { key: "no_transaksi", header: "No. Transaksi", render: (r: Pemasukan) => <span className="font-mono text-xs text-gray-600">{r.no_transaksi}</span> },
    { key: "tanggal",      header: "Tanggal",       render: (r: Pemasukan) => formatTanggal(r.tanggal) },
    { key: "nominal",      header: "Nominal",       render: (r: Pemasukan) => <span className="text-green-600 font-semibold">{formatRupiah(r.nominal)}</span> },
    { key: "kategori",     header: "Kategori",      render: (r: Pemasukan) => r.kategori || "-" },
    { key: "bank",         header: "Rekening",      render: (r: Pemasukan) => r.bank?.nama_bank ?? "-" },
    { key: "referensi",    header: "Sumber",        render: (r: Pemasukan) => <ReferensiBadge tipe={r.referensi_tipe} /> },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
        <div className="p-3 rounded-lg bg-green-50"><ArrowDownCircle className="h-6 w-6 text-green-600" /></div>
        <div>
          <p className="text-sm text-gray-500">Total Pemasukan</p>
          <p className="text-2xl font-bold text-gray-800">{formatRupiah(total)}</p>
        </div>
        <div className="ml-auto">
          <Button onClick={openForm}><Plus className="h-4 w-4" />Tambah Pemasukan</Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : (
        <DataTable
          columns={columns}
          data={list}
          emptyText="Belum ada data pemasukan"
          actions={(p) => (
            <>
              <Button size="sm" variant="outline" onClick={() => setDetailTarget(p)} className="border-blue-300 text-blue-600 hover:bg-blue-50">Detail</Button>
              {/* Hanya bisa hapus yang manual — yang dari kavling tidak boleh dihapus dari sini */}
              {p.referensi_tipe === "manual" && (
                <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(p)}>Hapus</Button>
              )}
            </>
          )}
        />
      )}

      {/* Form Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Form Data Pemasukan" headerVariant="primary"
        footer={
          <>
            <Button variant="destructive" onClick={() => setFormOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pemasukan</label>
            <input type="date" value={form.tanggal} onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm text-gray-600">Rp.</span>
              <input type="text" placeholder="0" value={form.nominal} onChange={(e) => setForm((f) => ({ ...f, nominal: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea rows={3} value={form.keterangan} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Transaksi</label>
            <select value={form.id_kategori} onChange={(e) => setForm((f) => ({ ...f, id_kategori: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Pilih Kategori</option>
              {kategoris.map((k) => <option key={k.id} value={k.id}>{k.kategori}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rekening / Bank</label>
            <select value={form.id_bank} onChange={(e) => setForm((f) => ({ ...f, id_bank: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Pilih Rekening</option>
              {banks.map((b) => <option key={b.id} value={b.id}>{b.nama_bank}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailTarget} onClose={() => setDetailTarget(null)} title="Detail Pemasukan" headerVariant="primary"
        footer={<Button variant="destructive" onClick={() => setDetailTarget(null)}>Tutup</Button>}>
        {detailTarget && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">No. Transaksi</label>
                <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm font-mono">{detailTarget.no_transaksi}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal</label>
                <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm">{formatTanggal(detailTarget.tanggal)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Rekening</label>
                <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm">{detailTarget.bank?.nama_bank ?? "-"}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nominal</label>
                <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm font-semibold text-green-700">{formatRupiah(detailTarget.nominal)}</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
              <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm">{detailTarget.kategori || "-"}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Keterangan</label>
              <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm min-h-12">{detailTarget.keterangan || "-"}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Sumber</label>
                <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm">{detailTarget.referensi_tipe}</div>
              </div>
              {detailTarget.referensi_id && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">ID Referensi</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-sm">{detailTarget.referensi_id}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        message="Hapus pemasukan?" description="Data ini akan dihapus dan saldo bank akan dikurangi kembali."
        confirmLabel="Ya, Hapus" cancelLabel="Batal" />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
