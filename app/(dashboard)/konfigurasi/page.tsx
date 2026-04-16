"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import type { KonfigurasiSistem } from "@/types/keuangan";
import type { ApiResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:8080";

export default function KonfigurasiPage() {
  const [config, setConfig] = useState<KonfigurasiSistem | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetItems, setResetItems] = useState<string[]>([]);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const ttdRef = useRef<HTMLInputElement>(null);
  const { toasts, addToast, removeToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Omit<KonfigurasiSistem, "logo" | "ttd_digital" | "id">>();

  useEffect(() => {
    api.get<ApiResponse<KonfigurasiSistem>>("/konfigurasi").then((r) => {
      const data = r.data.data;
      if (data) {
        setConfig(data);
        reset({
          nama_perusahaan: data.nama_perusahaan,
          alamat: data.alamat,
          telepon: data.telepon,
          email: data.email,
          website: data.website,
          nama_ttd: data.nama_ttd,
          jabatan_ttd: data.jabatan_ttd,
        });
      }
    });
  }, [reset]);

  async function onSubmit(data: Omit<KonfigurasiSistem, "logo" | "ttd_digital" | "id">) {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => formData.append(k, String(v)));
      if (logoRef.current?.files?.[0]) formData.append("logo", logoRef.current.files[0]);
      if (ttdRef.current?.files?.[0]) formData.append("ttd_digital", ttdRef.current.files[0]);
      const res = await api.put<ApiResponse<KonfigurasiSistem>>("/konfigurasi", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setConfig(res.data.data ?? null);
      addToast("Konfigurasi disimpan", "success");
    } catch(error) {
      console.error("Error menyimpan konfigurasi:", error);
      addToast("Gagal menyimpan", "error");
    } finally {
      setLoading(false);
    }
  }

  function toggleResetItem(key: string) {
    setResetItems((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function openReset() {
    setResetItems([]);
    setResetConfirmText("");
    setResetConfirmOpen(true);
  }

  async function handleReset() {
    if (resetItems.length === 0 || resetConfirmText !== "HAPUS") return;
    setResetLoading(true);
    try {
      await api.post("/konfigurasi/reset", { items: resetItems });
      addToast("Data berhasil direset", "success");
      setResetConfirmOpen(false);
    } catch {
      addToast("Gagal mereset data", "error");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-6">Konfigurasi Sistem</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nama Perusahaan"
            {...register("nama_perusahaan", { required: "Wajib diisi" })}
            error={errors.nama_perusahaan?.message}
          />
          <Input
            label="Alamat"
            {...register("alamat", { required: "Wajib diisi" })}
            error={errors.alamat?.message}
          />
          <Input
            label="No. Telepon"
            {...register("telepon")}
            error={errors.telepon?.message}
          />
          <Input
            label="Email"
            {...register("email")}
            error={errors.email?.message}
          />
          <Input
            label="Website"
            {...register("website")}
            error={errors.website?.message}
          />
          <Input
            label="Nama Penanda Tangan"
            {...register("nama_ttd")}
            error={errors.nama_ttd?.message}
          />
          <Input
            label="Jabatan Penanda Tangan"
            {...register("jabatan_ttd")}
            error={errors.jabatan_ttd?.message}
          />

          {/* Logo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Logo Perusahaan</label>
            {config?.logo && (
              <Image
                src={`${API_URL}/uploads/konfigurasi/${config.logo}`}
                alt="Logo"
                width={120}
                height={60}
                className="rounded border object-contain mb-2"
              />
            )}
            <input ref={logoRef} type="file" accept="image/*" className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700" />
          </div>

          {/* Tanda Tangan Digital */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Tanda Tangan Digital</label>
            {config?.ttd_digital && (
              <Image
                src={`${API_URL}/uploads/konfigurasi/${config.ttd_digital}`}
                alt="TTD"
                width={120}
                height={60}
                className="rounded border object-contain mb-2"
              />
            )}
            <input ref={ttdRef} type="file" accept="image/*" className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700" />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Konfigurasi"}
          </Button>
        </form>
      </div>
      {/* Reset Data */}
      <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
        <h3 className="font-semibold text-red-700 mb-2">Reset Data</h3>
        <p className="text-sm text-gray-600 mb-4">
          Pilih kategori data yang ingin dihapus. Data konfigurasi, pengguna, dan hak akses tetap dipertahankan.
        </p>
        <Button variant="destructive" onClick={openReset}>
          Pilih & Reset Data
        </Button>
      </div>

      {/* Reset Modal dengan Checklist */}
      <Modal
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        title="Reset Data"
        footer={
          <>
            <Button variant="outline" onClick={() => setResetConfirmOpen(false)} disabled={resetLoading}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={resetLoading || resetItems.length === 0 || resetConfirmText !== "HAPUS"}
            >
              {resetLoading ? "Mereset..." : `Reset ${resetItems.length} Kategori`}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Centang kategori data yang ingin dihapus. Data yang dipilih <strong className="text-red-600">tidak dapat dikembalikan</strong>.
          </p>

          {/* Pilih Semua */}
          <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              className="w-4 h-4 accent-red-600"
              checked={resetItems.length === 6}
              onChange={(e) => {
                setResetItems(e.target.checked
                  ? ["pembayaran", "transaksi", "keuangan", "kavling", "customer", "marketing"]
                  : []
                );
              }}
            />
            <div>
              <p className="text-sm font-semibold text-gray-800">Pilih Semua</p>
              <p className="text-xs text-gray-500">Hapus seluruh data di bawah ini sekaligus</p>
            </div>
          </label>

          <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
            {([
              { key: "pembayaran", label: "Pembayaran Cicilan", desc: "Riwayat semua cicilan yang sudah dibayar" },
              { key: "transaksi", label: "Transaksi Kavling", desc: "Semua transaksi cash, kredit, dan booking" },
              { key: "keuangan", label: "Transaksi Keuangan", desc: "Arus kas (pemasukan & pengeluaran)" },
              { key: "kavling", label: "Kavling & Denah", desc: "Semua kavling dan peta denah (cascade ke transaksi)" },
              { key: "customer", label: "Customer", desc: "Semua data customer (cascade ke transaksi)" },
              { key: "marketing", label: "Marketing", desc: "Semua data marketing (cascade ke transaksi)" },
            ] as const).map(({ key, label, desc }) => (
              <label key={key} className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-red-600"
                  checked={resetItems.includes(key)}
                  onChange={() => toggleResetItem(key)}
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>

          {resetItems.length > 0 && (
            <div className="space-y-2">
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm font-medium text-red-700">
                  {resetItems.length} kategori dipilih — tindakan ini tidak dapat dibatalkan!
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Ketik <strong className="text-red-600">HAPUS</strong> untuk mengkonfirmasi:
                </label>
                <input
                  type="text"
                  value={resetConfirmText}
                  onChange={(e) => setResetConfirmText(e.target.value)}
                  placeholder="Ketik HAPUS"
                  className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
