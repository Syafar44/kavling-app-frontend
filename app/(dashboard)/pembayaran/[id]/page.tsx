"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

/* ─── Types ─── */
type KategoriOption = { id: number; kategori: string; kode?: string; jenis?: string };
type BankOption = { id: number; nama_bank: string };

type TagihanItem = {
  id: number;
  id_kategori: number;
  deskripsi: string;
  nominal: number;
  kategori?: { nama: string } | null;
};

type PemasukanItem = {
  id: number;
  tanggal: string;
  jumlah_bayar: number;
  cara_bayar: string;
  keterangan: string;
  kategori?: { nama: string } | null;
  bank?: { nama_bank: string } | null;
};

type DetailData = {
  nama_customer: string;
  lokasi_perumahan: string;
  kode_kavling: string;
  jenis_pembayaran: string;
  total_tagihan: number;
  total_bayar: number;
  sisa_bayar: number;
  tagihan_items: TagihanItem[];
  pemasukan_items: PemasukanItem[];
};

const CARA_BAYAR = ["Cash", "Transfer", "Bilyet Giro", "Cheque"];

function fmt(n: number) { return n.toLocaleString("id-ID"); }
function formatTanggalID(s: string) {
  const d = new Date(s);
  const m = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${String(d.getDate()).padStart(2,"0")} ${m[d.getMonth()]} ${d.getFullYear()}`;
}

/* ─── Searchable Dropdown ─── */
function SearchableSelect({ options, value, onChange, placeholder }: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) => (o.label ?? "").toLowerCase().includes(search.toLowerCase()));
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => { setOpen((o) => !o); setSearch(""); }}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        {selected ? selected.label : <span className="text-gray-400">{placeholder ?? "Pilih..."}</span>}
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-100">
            <input autoFocus type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari..." className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none" />
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-gray-400">Tidak ditemukan</li>
            ) : filtered.map((o) => (
              <li key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${value === o.value ? "bg-blue-600 text-white hover:bg-blue-600" : "text-gray-700"}`}>
                {o.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function UpdateConfirm({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <span className="flex items-center justify-center w-14 h-14 rounded-full border-4 border-yellow-400">
            <AlertTriangle className="h-7 w-7 text-yellow-400" strokeWidth={2.5} />
          </span>
        </div>
        <h3 className="text-base font-semibold text-gray-800 mb-2">Yakin update harga rumah?</h3>
        <p className="text-sm text-gray-500 mb-6">Harga akan disesuaikan dengan harga jual kavling!</p>
        <div className="flex justify-center gap-3">
          <button onClick={onConfirm} className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Ya, Update</button>
          <button onClick={onClose} className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">Batal</button>
        </div>
      </div>
    </div>
  );
}

export default function PembayaranDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [detail, setDetail] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [kategoris, setKategoris] = useState<KategoriOption[]>([]);
  const [banks, setBanks] = useState<BankOption[]>([]);

  /* Tagihan */
  const [tagihanOpen, setTagihanOpen] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<TagihanItem | null>(null);
  const [tagihanForm, setTagihanForm] = useState({ id_kategori: "", deskripsi: "", nominal: "" });

  /* Pemasukan */
  const [pemasukanOpen, setPemasukanOpen] = useState(false);
  const [pemasukanForm, setPemasukanForm] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    id_kategori: "", cara_bayar: "", id_bank: "", nominal: "", keterangan: "",
  });
  const [buktiPreview, setBuktiPreview] = useState<string | null>(null);
  const buktiRef = useRef<HTMLInputElement>(null);
  const [buktiFile, setBuktiFile] = useState<File | null>(null);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<PemasukanItem | null>(null);
  const [saving, setSaving] = useState(false);

  const { toasts, addToast, removeToast } = useToast();

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<DetailData>>(`/pembayaran/${id}`);
      setDetail(res.data.data ?? null);
    } catch {
      addToast("Gagal memuat detail pembayaran", "error");
    } finally {
      setLoading(false);
    }
  }, [id, addToast]);

  useEffect(() => {
    fetchDetail();
    api.get<ApiResponse<KategoriOption[]>>("/kategori-transaksi").then((r) => setKategoris(r.data.data ?? [])).catch(() => {});
    api.get<ApiResponse<BankOption[]>>("/bank").then((r) => setBanks(r.data.data ?? [])).catch(() => {});
  }, [fetchDetail]);

  const kategoriOptions = kategoris.map((k) => ({ value: String(k.id), label: k.kategori ?? "" }));
  const bankOptions = banks.map((b) => ({ value: String(b.id), label: b.nama_bank }));

  /* ── Tagihan handlers ── */
  async function saveTagihan() {
    if (!tagihanForm.id_kategori) { addToast("Kategori Transaksi wajib dipilih", "error"); return; }
    if (!tagihanForm.nominal) { addToast("Nominal wajib diisi", "error"); return; }
    setSaving(true);
    try {
      await api.post(`/pembayaran/${id}/tagihan`, {
        id_kategori: Number(tagihanForm.id_kategori),
        deskripsi: tagihanForm.deskripsi,
        nominal: Number(tagihanForm.nominal.replace(/\D/g, "")),
      });
      addToast("Tagihan ditambahkan", "success");
      setTagihanOpen(false);
      fetchDetail();
    } catch {
      addToast("Gagal menambah tagihan", "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmUpdate() {
    if (!updateTarget) return;
    setSaving(true);
    try {
      // Kirim sync_harga: true agar backend mengambil harga terbaru dari kavling
      await api.put(`/pembayaran/${id}/tagihan/${updateTarget.id}`, {
        sync_harga: true,
      });
      addToast("Harga tagihan disinkronkan dari harga kavling terbaru", "success");
      setUpdateTarget(null);
      fetchDetail();
    } catch {
      addToast("Gagal update tagihan", "error");
    } finally {
      setSaving(false);
    }
  }

  /* ── Pemasukan handlers ── */
  async function savePemasukan() {
    if (!pemasukanForm.nominal) { addToast("Nominal wajib diisi", "error"); return; }
    if (!pemasukanForm.cara_bayar) { addToast("Cara bayar wajib dipilih", "error"); return; }
    if (!pemasukanForm.id_kategori) { addToast("Kategori wajib dipilih", "error"); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        tanggal: pemasukanForm.tanggal,
        id_kategori: Number(pemasukanForm.id_kategori),
        cara_bayar: pemasukanForm.cara_bayar,
        nominal: Number(pemasukanForm.nominal.replace(/\D/g, "")),
        keterangan: pemasukanForm.keterangan,
      };
      if (pemasukanForm.id_bank) payload.id_bank = Number(pemasukanForm.id_bank);
      await api.post(`/pembayaran/${id}/pemasukan`, payload);
      addToast("Pemasukan ditambahkan", "success");
      setPemasukanOpen(false);
      fetchDetail();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      addToast(msg ?? "Gagal menambah pemasukan", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePemasukan() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/pembayaran/${id}/pemasukan/${deleteTarget.id}`);
      addToast("Pemasukan dihapus", "success");
      setDeleteTarget(null);
      fetchDetail();
    } catch {
      addToast("Gagal menghapus pemasukan", "error");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Link href="/pembayaran"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Kembali</Button></Link>
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-4">
        <Link href="/pembayaran"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Kembali</Button></Link>
        <div className="text-center py-16 text-gray-400">Data pembayaran tidak ditemukan</div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/pembayaran">
        <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Kembali</Button>
      </Link>

      {/* Header Info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Detail Pembayaran</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <InfoField label="Nama Customer"    value={detail.nama_customer} />
            <InfoField label="Lokasi Perumahan" value={`${detail.lokasi_perumahan} # ${detail.kode_kavling}`} />
            <InfoField label="Jenis Pembayaran" value={detail.jenis_pembayaran} />
          </div>
          <div className="space-y-4">
            <RpField label="Total Tagihan" value={detail.total_tagihan} />
            <RpField label="Jumlah Bayar"  value={detail.total_bayar} />
            <RpField label="Sisa Bayar"    value={detail.sisa_bayar} />
            <div className="flex justify-end">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md font-medium">
                <Printer className="h-4 w-4" /> Cetak Rekap
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tagihan */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">- Tagihan -</h3>
          <button onClick={() => { setTagihanForm({ id_kategori: "", deskripsi: "", nominal: "" }); setTagihanOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md">
            + Tambah Tagihan
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-12">No</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Jenis Tagihan</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Nominal</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {detail.tagihan_items.map((t, idx) => (
              <tr key={t.id} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                <td className="px-4 py-3 text-gray-700">{t.deskripsi || t.kategori?.nama || "—"}</td>
                <td className="px-4 py-3 text-right text-gray-700">Rp.&nbsp;{fmt(t.nominal)}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => setUpdateTarget(t)}
                    className="px-3 py-1 rounded text-xs font-semibold bg-yellow-400 hover:bg-yellow-500 text-white">
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50">
              <td colSpan={2} className="px-4 py-3 text-right font-semibold text-gray-700">Total</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">Rp.&nbsp;{fmt(detail.total_tagihan)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pemasukan */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">- Pemasukan -</h3>
          <button onClick={() => {
            setPemasukanForm({ tanggal: new Date().toISOString().split("T")[0], id_kategori: "", cara_bayar: "", id_bank: "", nominal: "", keterangan: "" });
            setBuktiPreview(null); setBuktiFile(null);
            setPemasukanOpen(true);
          }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-md">
            + Tambah Pemasukan
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-12">No</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tanggal</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Jenis Pembayaran</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Cara Bayar</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Nominal</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {detail.pemasukan_items.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-gray-400">Belum ada pemasukan</td></tr>
            ) : detail.pemasukan_items.map((p, idx) => (
              <tr key={p.id} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                <td className="px-4 py-3 text-gray-700">{formatTanggalID(p.tanggal)}</td>
                <td className="px-4 py-3 text-gray-700">{p?.keterangan ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{p.cara_bayar}</td>
                <td className="px-4 py-3 text-right text-gray-700">Rp.&nbsp;{fmt(p.jumlah_bayar)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center gap-1">
                    <button className="px-2 py-1 rounded text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white">Cetak</button>
                    <button className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-400 hover:bg-yellow-500 text-white">
                      <Printer className="h-3 w-3" />Print
                    </button>
                    <button onClick={() => setDeleteTarget(p)} className="px-2 py-1 rounded text-xs font-medium bg-red-500 hover:bg-red-600 text-white">Hapus</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50">
              <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-700">Total Pemasukan</td>
              <td className="px-4 py-3 text-right font-semibold text-gray-900">Rp.&nbsp;{fmt(detail.total_bayar)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modal: Tambah Tagihan */}
      <Modal open={tagihanOpen} onClose={() => setTagihanOpen(false)} title="Tambah Tagihan" headerVariant="primary"
        footer={
          <>
            <Button variant="destructive" onClick={() => setTagihanOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={saveTagihan} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Transaksi</label>
            <SearchableSelect options={kategoriOptions} value={tagihanForm.id_kategori}
              onChange={(v) => setTagihanForm((f) => ({ ...f, id_kategori: v }))} placeholder="Pilih Kategori Transaksi" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Tagihan</label>
            <textarea rows={3} value={tagihanForm.deskripsi}
              onChange={(e) => setTagihanForm((f) => ({ ...f, deskripsi: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nominal</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm text-gray-600">Rp.</span>
              <input type="text" placeholder="0" value={tagihanForm.nominal}
                onChange={(e) => setTagihanForm((f) => ({ ...f, nominal: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal: Tambah Pemasukan */}
      <Modal open={pemasukanOpen} onClose={() => setPemasukanOpen(false)} title="Tambah Pemasukan" headerVariant="primary" size="lg"
        footer={
          <>
            <Button variant="destructive" onClick={() => setPemasukanOpen(false)} disabled={saving}>Batal</Button>
            <Button onClick={savePemasukan} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm text-gray-700">Tanggal Pembayaran</label>
            <div className="col-span-2">
              <input type="date" value={pemasukanForm.tanggal}
                onChange={(e) => setPemasukanForm((f) => ({ ...f, tanggal: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm text-gray-700">Nama Customer</label>
            <div className="col-span-2 bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700">{detail.nama_customer}</div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm text-gray-700">Lokasi Perumahan</label>
            <div className="col-span-2 grid grid-cols-2 gap-2">
              <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700">{detail.lokasi_perumahan}</div>
              <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700">{detail.kode_kavling}</div>
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm text-gray-700">Kategori Transaksi</label>
            <div className="col-span-2">
              <SearchableSelect options={kategoriOptions} value={pemasukanForm.id_kategori}
                onChange={(v) => setPemasukanForm((f) => ({ ...f, id_kategori: v }))} placeholder="Pilih Kategori" />
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm text-gray-700">Cara Bayar</label>
            <div className="col-span-2">
              <select value={pemasukanForm.cara_bayar}
                onChange={(e) => setPemasukanForm((f) => ({ ...f, cara_bayar: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Pilih Cara Pembayaran</option>
                {CARA_BAYAR.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm text-gray-700">Bank</label>
            <div className="col-span-2">
              <select value={pemasukanForm.id_bank}
                onChange={(e) => setPemasukanForm((f) => ({ ...f, id_bank: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">— Pilih Bank (opsional) —</option>
                {bankOptions.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm text-gray-700">Nominal</label>
            <div className="col-span-2 flex">
              <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm text-gray-600">Rp.</span>
              <input type="text" placeholder="0" value={pemasukanForm.nominal}
                onChange={(e) => setPemasukanForm((f) => ({ ...f, nominal: e.target.value }))}
                className="flex-1 border border-gray-300 rounded-r-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <label className="text-sm text-gray-700">Keterangan</label>
            <div className="col-span-2">
              <input type="text" value={pemasukanForm.keterangan}
                onChange={(e) => setPemasukanForm((f) => ({ ...f, keterangan: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 items-start gap-4">
            <label className="text-sm text-gray-700 pt-2">Bukti Pembayaran</label>
            <div className="col-span-2 space-y-2">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => buktiRef.current?.click()}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                  Pilih File
                </button>
                <span className="text-sm text-gray-400">{buktiPreview ? "File dipilih" : "Tidak ada file yang dipilih"}</span>
                <input ref={buktiRef} type="file" accept="image/*,.pdf" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setBuktiFile(file); setBuktiPreview(URL.createObjectURL(file)); }
                  }} />
              </div>
              <div className="border border-gray-200 rounded-md bg-gray-50 flex items-center justify-center overflow-hidden" style={{ width: 120, height: 120 }}>
                {buktiPreview ? (
                  <img src={buktiPreview} alt="Bukti" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-400">Tidak ada File</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <UpdateConfirm open={!!updateTarget} onClose={() => setUpdateTarget(null)} onConfirm={confirmUpdate} />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-semibold text-gray-800 mb-2">Hapus Pemasukan</h3>
            <p className="text-sm text-gray-500 mb-6">Data pemasukan akan dihapus secara permanen.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
              <Button variant="destructive" onClick={handleDeletePemasukan}>Ya, Hapus</Button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <label className="w-40 text-sm text-gray-600 shrink-0">{label}</label>
      <div className="flex-1 bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700">{value}</div>
    </div>
  );
}

function RpField({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-4">
      <label className="w-36 text-sm text-gray-600 shrink-0">{label}</label>
      <div className="flex">
        <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-md text-sm text-gray-600">Rp.</span>
        <div className="bg-gray-100 border border-gray-200 rounded-r-md px-3 py-2 text-sm text-gray-700 tabular-nums min-w-40">
          {value.toLocaleString("id-ID")}
        </div>
      </div>
    </div>
  );
}
