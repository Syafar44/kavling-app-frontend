"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import type { Transaksi, TransaksiFormData, ArusKasResponse } from "@/types/keuangan";
import type { ApiResponse } from "@/types/api";
import { formatRupiah, formatTanggal } from "@/lib/utils";

export default function TransaksiKeuanganPage() {
  const [transaksis, setTransaksis] = useState<Transaksi[]>([]);
  const [summary, setSummary] = useState({ pemasukan: 0, pengeluaran: 0, saldo: 0 });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const { toasts, addToast, removeToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransaksiFormData>();

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterFrom) params.set("dari", filterFrom);
    if (filterTo) params.set("sampai", filterTo);
    try {
      const res = await api.get<ApiResponse<ArusKasResponse>>(`/keuangan/transaksi?${params}`);
      const d = res.data.data;
      setTransaksis(d?.transaksi ?? []);
      setSummary({ pemasukan: d?.pemasukan ?? 0, pengeluaran: d?.pengeluaran ?? 0, saldo: d?.saldo ?? 0 });
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: TransaksiFormData) {
    setFormLoading(true);
    try {
      await api.post("/keuangan/transaksi", data);
      await fetchData();
      addToast("Transaksi ditambahkan", "success");
      setFormOpen(false);
      reset();
    } catch {
      addToast("Terjadi kesalahan", "error");
    } finally {
      setFormLoading(false);
    }
  }

  const columns = [
    { key: "tanggal", header: "Tanggal", render: (t: Transaksi) => formatTanggal(t.tanggal) },
    {
      key: "jenis",
      header: "Jenis",
      render: (t: Transaksi) => (
        <span className={t.jenis === "Pemasukan" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
          {t.jenis}
        </span>
      ),
    },
    { key: "kategori", header: "Kategori" },
    { key: "keterangan", header: "Keterangan" },
    {
      key: "nominal",
      header: "Nominal",
      render: (t: Transaksi) => (
        <span className={t.jenis === "Pemasukan" ? "text-green-600" : "text-red-600"}>
          {formatRupiah(t.nominal)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter + Tambah */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <Input
          label="Dari Tanggal"
          type="date"
          value={filterFrom}
          onChange={(e) => setFilterFrom(e.target.value)}
          className="w-40"
        />
        <Input
          label="Sampai Tanggal"
          type="date"
          value={filterTo}
          onChange={(e) => setFilterTo(e.target.value)}
          className="w-40"
        />
        <Button size="sm" variant="outline" onClick={fetchData}>Tampilkan</Button>
        <div className="ml-auto">
          <Button size="sm" onClick={() => { reset(); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            Tambah Transaksi
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <DataTable
          columns={columns}
          data={transaksis}
          loading={loading}
          emptyText="Belum ada transaksi keuangan"
        />

        {/* Summary */}
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="text-gray-500">Total Pemasukan</p>
            <p className="font-semibold text-green-600">{formatRupiah(summary.pemasukan)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Total Pengeluaran</p>
            <p className="font-semibold text-red-600">{formatRupiah(summary.pengeluaran)}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Saldo</p>
            <p className={`font-semibold ${summary.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatRupiah(summary.saldo)}
            </p>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Tambah Transaksi Manual"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>Batal</Button>
            <Button type="submit" form="form-keuangan" disabled={formLoading}>
              {formLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <form id="form-keuangan" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Tanggal" type="date" {...register("tanggal", { required: "Wajib diisi" })} error={errors.tanggal?.message} />
          <Select
            label="Jenis"
            {...register("jenis", { required: "Wajib diisi" })}
            options={[{ value: "Pemasukan", label: "Pemasukan" }, { value: "Pengeluaran", label: "Pengeluaran" }]}
            placeholder="Pilih jenis"
          />
          <Input label="Kategori" {...register("kategori", { required: "Wajib diisi" })} error={errors.kategori?.message} />
          <Input label="Nominal (Rp)" type="number" {...register("nominal", { required: "Wajib diisi", valueAsNumber: true, min: 1 })} error={errors.nominal?.message} />
          <Input label="Keterangan" {...register("keterangan")} placeholder="Opsional" />
        </form>
      </Modal>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
