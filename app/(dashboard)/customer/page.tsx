"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Plus, RefreshCw, Pencil, Trash2, ChevronLeft } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import { formatRupiah } from "@/lib/utils";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type Customer = {
  id: number;
  kode_kontrak: string;
  tanggal: string;
  nama: string;
  no_ktp: string;
  no_ktp_pasangan?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  no_telp?: string;
  email?: string;
  npwp?: string;
  alamat?: string;
  alamat_domisili?: string;
  pekerjaan?: string;
  id_lokasi?: number;
  id_kavling?: number;
  id_marketing?: number;
  jenis_pembelian?: string;
  jumlah_pembayaran?: number;
  tanggal_batas_booking?: string;
  cicilan_per_bulan?: number;
  tenor?: number;
  jatuh_tempo?: string;
  status_penjualan?: string;
  keterangan_cashback?: string;
  // Populated relations
  lokasi?: { id: number; nama: string };
  marketing?: { id: number; nama: string };
};

type LokasiOption = { id: number; nama: string };
type MarketingOption = { id: number; nama: string };
type BankOption = { id: number; nama_bank: string };
type ListPenjualanOption = { id: number; progres: string; warna?: string };
type KavlingOption = { id: number; kode_kavling: string; status: number; harga_jual_cash?: number };

type FormData = {
  tanggal: string;
  nama: string;
  no_ktp?: string;
  no_ktp_pasangan?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  no_telp?: string;
  email?: string;
  npwp?: string;
  alamat?: string;
  alamat_domisili?: string;
  pekerjaan?: string;
  id_lokasi?: number;
  id_kavling?: number;
  id_marketing?: number;
  jenis_pembelian?: string;
  jumlah_pembayaran?: number;
  tanggal_batas_booking?: string;
  cicilan_per_bulan?: number;
  tenor?: number;
  jatuh_tempo?: string;
  status_penjualan?: string;
  keterangan_cashback?: string;
};

const KAVLING_STATUS_LABEL: Record<number, string> = {
  0: "Ready",
  1: "HOLD",
  2: "BF",
  3: "AKAD",
  4: "Cancel",
  5: "LUNAS",
};

const JENIS_STYLE: Record<string, string> = {
  KREDIT: "bg-red-500 text-white",
  "CASH KERAS": "bg-blue-500 text-white",
  "BOOKING FEE": "bg-orange-400 text-white",
};

// ─── Form ─────────────────────────────────────────────────────────────────────
function CustomerForm({
  mode,
  initial,
  onBack,
  onSave,
  lokasis,
  marketings,
  listPenjualans,
}: {
  mode: "tambah" | "edit";
  initial?: Customer;
  onBack: () => void;
  onSave: (data: FormData) => Promise<void>;
  lokasis: LokasiOption[];
  marketings: MarketingOption[];
  listPenjualans: ListPenjualanOption[];
}) {
  const [saving, setSaving] = useState(false);
  const [jenisPembelian, setJenisPembelian] = useState(initial?.jenis_pembelian ?? "BOOKING FEE");
  const [kavlings, setKavlings] = useState<KavlingOption[]>([]);

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: initial
      ? {
          tanggal: initial.tanggal?.split("T")[0],
          nama: initial.nama,
          no_ktp: initial.no_ktp,
          no_ktp_pasangan: initial.no_ktp_pasangan,
          tempat_lahir: initial.tempat_lahir,
          tanggal_lahir: initial.tanggal_lahir?.split("T")[0],
          jenis_kelamin: initial.jenis_kelamin,
          no_telp: initial.no_telp,
          email: initial.email,
          npwp: initial.npwp,
          alamat: initial.alamat,
          alamat_domisili: initial.alamat_domisili,
          pekerjaan: initial.pekerjaan,
          id_lokasi: initial.id_lokasi,
          id_kavling: initial.id_kavling,
          id_marketing: initial.id_marketing,
          jenis_pembelian: initial.jenis_pembelian,
          jumlah_pembayaran: initial.jumlah_pembayaran,
          tanggal_batas_booking: initial.tanggal_batas_booking?.split("T")[0],
          cicilan_per_bulan: initial.cicilan_per_bulan,
          tenor: initial.tenor,
          jatuh_tempo: initial.jatuh_tempo?.split("T")[0],
          status_penjualan: initial.status_penjualan,
          keterangan_cashback: initial.keterangan_cashback,
        }
      : { tanggal: new Date().toISOString().split("T")[0], jenis_kelamin: "L", jenis_pembelian: "BOOKING FEE" },
  });

  const idLokasi = watch("id_lokasi");
  const idKavling = watch("id_kavling");

  // Fetch kavlings whenever lokasi changes.
  useEffect(() => {
    if (!idLokasi) {
      setKavlings([]);
      return;
    }
    api
      .get<ApiResponse<KavlingOption[]>>(`/kavling?id_lokasi=${idLokasi}`)
      .then((r) => {
        const list = r.data.data ?? [];
        // Only ready-kavlings are selectable, plus the currently assigned one
        // (important for edit mode where a reserved kavling should still be visible).
        const keep = list.filter((k) => k.status === 0 || k.id === initial?.id_kavling);
        setKavlings(keep);
      })
      .catch(() => setKavlings([]));
  }, [idLokasi, initial?.id_kavling]);

  // Clear kavling selection if lokasi changes away from the initial one.
  useEffect(() => {
    if (idLokasi !== initial?.id_lokasi && idKavling === initial?.id_kavling) {
      setValue("id_kavling", undefined);
    }
  }, [idLokasi, idKavling, initial?.id_lokasi, initial?.id_kavling, setValue]);

  const isBookingFee = jenisPembelian === "BOOKING FEE";
  const isCash = jenisPembelian === "CASH KERAS";
  const isKredit = jenisPembelian === "KREDIT";
  const labelCls = "text-sm text-gray-600 pt-2";
  const inputWrap = "flex items-start gap-4 py-3 border-b border-gray-100 last:border-0";

  async function onSubmit(data: FormData) {
    setSaving(true);
    // Task 10: validasi kavling wajib saat jenis pembelian sudah dipilih
    if (jenisPembelian && (!data.id_kavling || Number(data.id_kavling) <= 0)) {
      setSaving(false);
      alert("Blok kavling wajib dipilih jika jenis pembelian sudah ditentukan.");
      return;
    }
    
    const payload = { ...data, jenis_pembelian: jenisPembelian } as any;

    // Bersihkan data string kosong agar tidak error parse date di backend
    if (!payload.tanggal) payload.tanggal = null;
    if (!payload.tanggal_lahir) payload.tanggal_lahir = null;
    if (!payload.tanggal_batas_booking) payload.tanggal_batas_booking = null;
    if (!payload.jatuh_tempo) payload.jatuh_tempo = null;

    // Bersihkan nilai NaN
    if (isNaN(payload.jumlah_pembayaran)) payload.jumlah_pembayaran = null;
    if (isNaN(payload.cicilan_per_bulan)) payload.cicilan_per_bulan = null;
    if (isNaN(payload.tenor)) payload.tenor = null;

    try {
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack}><ChevronLeft className="h-4 w-4" />Kembali</Button>
        <h1 className="text-xl font-semibold text-gray-900">Form Data Customer</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="divide-y divide-gray-100">
          <div className="px-8 py-6 space-y-0">
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>Tanggal</label>
              <input type="date" className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("tanggal")} />
            </div>
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>Nama Lengkap</label>
              <input className="h-9 px-3 rounded-md border border-gray-300 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("nama", { required: true })} />
            </div>
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>No. KTP</label>
              <input className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("no_ktp")} />
              <label className={`w-40 shrink-0 ${labelCls} ml-4`}>No. KTP Pasangan</label>
              <input className="h-9 px-3 rounded-md border border-gray-300 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("no_ktp_pasangan")} />
            </div>
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>Tempat Lahir</label>
              <input className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("tempat_lahir")} />
              <label className={`w-40 shrink-0 ${labelCls} ml-4`}>Tanggal Lahir</label>
              <input type="date" className="h-9 px-3 rounded-md border border-gray-300 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("tanggal_lahir")} />
            </div>
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>Jenis Kelamin</label>
              <select className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("jenis_kelamin")}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>No. Telp / WA</label>
              <input className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("no_telp")} />
            </div>
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>Email</label>
              <input type="email" className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("email")} />
            </div>
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>NPWP</label>
              <input className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("npwp")} />
            </div>
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>Alamat KTP</label>
              <input className="h-9 px-3 rounded-md border border-gray-300 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("alamat")} />
            </div>
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>Alamat Domisili</label>
              <input className="h-9 px-3 rounded-md border border-gray-300 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("alamat_domisili")} />
            </div>
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>Pekerjaan</label>
              <input className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("pekerjaan")} />
            </div>
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>Lokasi Perumahan</label>
              <select className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("id_lokasi", { valueAsNumber: true })}>
                <option value="">Pilih Lokasi</option>
                {lokasis.map((l) => <option key={l.id} value={l.id}>{l.nama}</option>)}
              </select>
            </div>
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>Blok Kavling</label>
              <select
                className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                disabled={!idLokasi}
                {...register("id_kavling", { valueAsNumber: true })}
              >
                <option value="">
                  {idLokasi ? (kavlings.length ? "Pilih Kavling" : "Tidak ada kavling tersedia") : "Pilih lokasi dulu"}
                </option>
                {kavlings.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.kode_kavling}
                    {k.status !== 0 ? ` (${KAVLING_STATUS_LABEL[k.status] ?? "-"})` : ""}
                  </option>
                ))}
              </select>
            </div>
            {idKavling ? (
              <div className={inputWrap}>
                <label className={`w-48 shrink-0 ${labelCls}`}>Harga Jual</label>
                <div className="flex w-64">
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm text-gray-600">Rp.</span>
                  <input 
                    type="text" 
                    readOnly 
                    className="flex-1 bg-gray-50 border border-gray-300 rounded-r-md px-3 py-2 text-sm text-gray-500 font-semibold focus:outline-none" 
                    value={kavlings.find((k) => k.id === idKavling)?.harga_jual_cash?.toLocaleString("id-ID") || 0} 
                  />
                </div>
              </div>
            ) : null}
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>Marketing</label>
              <select className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("id_marketing", { valueAsNumber: true })}>
                <option value="">Pilih Marketing</option>
                {marketings.map((m) => <option key={m.id} value={m.id}>{m.nama}</option>)}
              </select>
            </div>
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>Status Penjualan</label>
              <select className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("status_penjualan")}>
                <option value="">Pilih Status</option>
                {listPenjualans.map((s) => <option key={s.id} value={s.progres}>{s.progres}</option>)}
              </select>
            </div>
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>Jenis Pembelian</label>
              <select
                className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={jenisPembelian}
                onChange={(e) => setJenisPembelian(e.target.value)}
              >
                <option value="BOOKING FEE">BOOKING FEE</option>
                <option value="CASH KERAS">CASH KERAS</option>
                <option value="KREDIT">KREDIT</option>
              </select>
            </div>
            {isBookingFee && (
              <>
                <div className={inputWrap}>
                  <label className={`w-48 shrink-0 ${labelCls}`}>Pembayaran Booking</label>
                  <input type="number" className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rp 0" {...register("jumlah_pembayaran", { valueAsNumber: true })} />
                </div>
                <div className={inputWrap}>
                  <label className={`w-48 shrink-0 ${labelCls}`}>Tanggal Batas Booking</label>
                  <input type="date" className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("tanggal_batas_booking")} />
                </div>
              </>
            )}
            {isCash && (
              <div className={inputWrap}>
                <label className={`w-48 shrink-0 ${labelCls}`}>Jumlah Pembayaran</label>
                <input type="number" className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rp 0" {...register("jumlah_pembayaran", { valueAsNumber: true })} />
              </div>
            )}
            {isKredit && (
              <>
                <div className={inputWrap}>
                  <label className={`w-48 shrink-0 ${labelCls}`}>Cicilan Per Bulan</label>
                  <input type="number" className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rp 0" {...register("cicilan_per_bulan", { valueAsNumber: true })} />
                </div>
                <div className={inputWrap}>
                  <label className={`w-48 shrink-0 ${labelCls}`}>Tenor (Jumlah Bulan)</label>
                  <input type="number" className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Contoh: 24" {...register("tenor", { valueAsNumber: true })} />
                </div>
                <div className={inputWrap}>
                  <label className={`w-48 shrink-0 ${labelCls}`}>Tanggal Jatuh Tempo</label>
                  <input type="date" className="h-9 px-3 rounded-md border border-gray-300 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("jatuh_tempo")} />
                </div>
              </>
            )}
            <div className={inputWrap}>
              <label className={`w-48 shrink-0 ${labelCls}`}>Keterangan_cashback</label>
              <input className="h-9 px-3 rounded-md border border-gray-300 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("keterangan_cashback")} />
            </div>
          </div>
          <div className="flex justify-end px-8 py-4 bg-gray-50 rounded-b-xl">
            <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lokasis, setLokasis] = useState<LokasiOption[]>([]);
  const [marketings, setMarketings] = useState<MarketingOption[]>([]);
  const [listPenjualans, setListPenjualans] = useState<ListPenjualanOption[]>([]);
  const [mode, setMode] = useState<"list" | "tambah" | "edit">("list");
  const [editTarget, setEditTarget] = useState<Customer | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [custRes, lokasiRes, mktRes, lpRes] = await Promise.all([
        api.get<ApiResponse<Customer[]>>("/customer"),
        api.get<ApiResponse<LokasiOption[]>>("/lokasi-kavling"),
        api.get<ApiResponse<MarketingOption[]>>("/marketing"),
        api.get<ApiResponse<ListPenjualanOption[]>>("/list-penjualan"),
      ]);
      setCustomers(custRes.data.data ?? []);
      setLokasis(lokasiRes.data.data ?? []);
      setMarketings(mktRes.data.data ?? []);
      setListPenjualans(lpRes.data.data ?? []);
    } catch {
      addToast("Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function openEdit(c: Customer) {
    try {
      const res = await api.get<ApiResponse<{
        customer: Customer;
        kavlings: { id_kavling: number }[];
      }>>(`/customer/${c.id}`);
      const payload = res.data.data;
      const currentKavlingId = payload?.kavlings?.[0]?.id_kavling;
      setEditTarget({ ...c, id_kavling: currentKavlingId });
    } catch {
      setEditTarget(c);
    }
    setMode("edit");
  }

  async function handleSave(data: FormData) {
    try {
      if (mode === "edit" && editTarget) {
        await api.put(`/customer/${editTarget.id}`, data);
        addToast("Data customer diperbarui", "success");
      } else {
        await api.post("/customer", data);
        addToast("Customer berhasil ditambahkan", "success");
      }
      setMode("list");
      fetchAll();
    } catch {
      addToast("Gagal menyimpan data", "error");
      throw new Error("save failed");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/customer/${deleteTarget.id}`);
      addToast("Customer dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus customer", "error");
    }
  }

  function formatDate(d: string) {
    if (!d) return "";
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  }

  if (mode === "tambah" || mode === "edit") {
    return (
      <>
        <CustomerForm
          mode={mode}
          initial={editTarget}
          onBack={() => setMode("list")}
          onSave={handleSave}
          lokasis={lokasis}
          marketings={marketings}
          listPenjualans={listPenjualans}
        />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  const columns = [
    {
      key: "tanggal",
      header: "Tanggal",
      render: (c: Customer) => (
        <div className="space-y-1">
          <p className="text-sm text-gray-600">{formatDate(c.tanggal)}</p>
          <p className="text-xs font-mono font-semibold text-gray-800">{c.kode_kontrak}</p>
          {c.jenis_pembelian && (
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${JENIS_STYLE[c.jenis_pembelian] ?? "bg-gray-400 text-white"}`}>
              {c.jenis_pembelian}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "nama",
      header: "Nama Nasabah",
      render: (c: Customer) => (
        <div className="space-y-1">
          <p className="font-semibold text-gray-800">{c.nama}</p>
          <p className="text-xs text-gray-500">{c.no_telp}</p>
          {c.no_ktp && <span className="inline-block px-2 py-0.5 bg-cyan-500 text-white text-xs rounded font-mono">NIK: {c.no_ktp}</span>}
        </div>
      ),
    },
    {
      key: "marketing",
      header: "Marketing",
      render: (c: Customer) => <span className="text-sm text-gray-700">{c.marketing?.nama ?? "-"}</span>,
    },
    {
      key: "lokasi",
      header: "Lokasi",
      render: (c: Customer) => <span className="text-sm text-gray-700">{c.lokasi?.nama ?? "-"}</span>,
    },
    {
      key: "status_penjualan",
      header: "Status",
      render: (c: Customer) => (
        <span className="px-3 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">{c.status_penjualan ?? "-"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Data Customer</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="h-4 w-4" />Reload</Button>
          <Button size="sm" onClick={() => { setEditTarget(undefined); setMode("tambah"); }}>
            <Plus className="h-4 w-4" />Tambah Customer
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-white rounded-xl border animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <DataTable
            columns={columns}
            data={customers}
            emptyText="Belum ada data customer"
            actions={(c) => (
              <>
                <Button size="sm" variant="outline" onClick={() => openEdit(c)} className="border-blue-300 text-blue-600 hover:bg-blue-50">
                  <Pencil className="h-3.5 w-3.5" />Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(c)}>
                  <Trash2 className="h-3.5 w-3.5" />Hapus
                </Button>
              </>
            )}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message="Apakah Anda yakin?"
        description="Data customer ini akan dihapus secara permanen!"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
