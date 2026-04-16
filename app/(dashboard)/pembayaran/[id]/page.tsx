"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import type { TransaksiKavling, Pembayaran, PembayaranFormData } from "@/types/transaksi";
import type { ApiResponse } from "@/types/api";
import { formatRupiah, formatTanggal } from "@/lib/utils";

export default function PembayaranDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [transaksi, setTransaksi] = useState<TransaksiKavling | null>(null);
  const [pembayarans, setPembayarans] = useState<Pembayaran[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const buktiRef = useRef<HTMLInputElement>(null);
  const { toasts, addToast, removeToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PembayaranFormData>();

  useEffect(() => {
    api.get<ApiResponse<TransaksiKavling>>(`/transaksi/${id}`).then((r) => {
      const t = r.data.data ?? null;
      setTransaksi(t);
      if (t?.id_kavling) fetchPembayaran(t.id_kavling);
    });
  }, [id]);

  async function fetchPembayaran(idKavling: number) {
    const res = await api.get<ApiResponse<{ pembayaran: Pembayaran[] }>>(`/pembayaran/${idKavling}`);
    setPembayarans(res.data.data?.pembayaran ?? []);
  }

  async function onSubmit(data: PembayaranFormData) {
    if (!transaksi) return;
    setFormLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && v !== "") formData.append(k, String(v)); });
      if (buktiRef.current?.files?.[0]) formData.append("bukti_pembayaran", buktiRef.current.files[0]);
      await api.post(`/pembayaran/${transaksi.id_kavling}/bayar`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      await fetchPembayaran(transaksi.id_kavling);
      addToast("Pembayaran berhasil dicatat", "success");
      setFormOpen(false);
      reset();
    } catch {
      addToast("Gagal mencatat pembayaran", "error");
    } finally {
      setFormLoading(false);
    }
  }

  if (!transaksi) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const sisaCicilan = Math.max(0, (transaksi.lama_cicilan ?? 0) - pembayarans.length);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/pembayaran">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Kembali
        </Button>
      </Link>

      {/* Info Transaksi */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4">Informasi Kredit</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Kavling</p>
            <p className="font-medium">{transaksi.kavling?.kode_kavling}</p>
          </div>
          <div>
            <p className="text-gray-500">Customer</p>
            <p className="font-medium">{transaksi.customer?.nama}</p>
          </div>
          <div>
            <p className="text-gray-500">Marketing</p>
            <p className="font-medium">{transaksi.marketing?.nama}</p>
          </div>
          <div>
            <p className="text-gray-500">Harga Jual</p>
            <p className="font-medium">{formatRupiah(transaksi.harga_jual)}</p>
          </div>
          <div>
            <p className="text-gray-500">DP</p>
            <p className="font-medium">{formatRupiah(transaksi.uang_muka)}</p>
          </div>
          <div>
            <p className="text-gray-500">Cicilan/Bulan</p>
            <p className="font-medium">{formatRupiah(transaksi.cicilan_per_bulan ?? 0)}</p>
          </div>
          <div>
            <p className="text-gray-500">Lama Cicilan</p>
            <p className="font-medium">{transaksi.lama_cicilan} Bulan</p>
          </div>
          <div>
            <p className="text-gray-500">Sisa Cicilan</p>
            <p className="font-medium text-red-600">{sisaCicilan} Bulan</p>
          </div>
        </div>
      </div>

      {/* Riwayat Pembayaran */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Riwayat Cicilan</h3>
          {sisaCicilan > 0 && (
            <Button size="sm" onClick={() => { reset(); setFormOpen(true); }}>
              + Catat Pembayaran
            </Button>
          )}
        </div>

        {pembayarans.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Belum ada pembayaran</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y divide-gray-100">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">Cicilan ke</th>
                  <th className="px-4 py-2 text-left">Tanggal</th>
                  <th className="px-4 py-2 text-left">Jumlah</th>
                  <th className="px-4 py-2 text-left">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pembayarans.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">#{p.pembayaran_ke}</td>
                    <td className="px-4 py-3">{formatTanggal(p.tanggal)}</td>
                    <td className="px-4 py-3">{formatRupiah(p.jumlah_bayar)}</td>
                    <td className="px-4 py-3 text-gray-500">{p.keterangan ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Bayar */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={`Catat Pembayaran Cicilan ke-${pembayarans.length + 1}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>Batal</Button>
            <Button type="submit" form="form-bayar" disabled={formLoading}>
              {formLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <form id="form-bayar" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Tanggal Pembayaran"
            type="date"
            {...register("tanggal", { required: "Wajib diisi" })}
            error={errors.tanggal?.message}
          />
          <Input
            label="Jumlah (Rp)"
            type="number"
            defaultValue={transaksi.cicilan_per_bulan}
            {...register("jumlah_bayar", { required: "Wajib diisi", valueAsNumber: true, min: { value: 1, message: "Minimal 1" } })}
            error={errors.jumlah_bayar?.message}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Bukti Pembayaran</label>
            <input ref={buktiRef} type="file" accept="image/*,.pdf" className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          <Input label="Keterangan" {...register("keterangan")} placeholder="Opsional" />
        </form>
      </Modal>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
