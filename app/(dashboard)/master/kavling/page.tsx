"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { RefreshCw, Pencil } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

// ─── Types ─────────────────────────────────────────────────────────────────────
type LokasiKavling = {
  id: number;
  nama: string;
};

type MasterKavling = {
  id: number;
  id_lokasi: number;
  kode_kavling: string;
  panjang_kanan: number;
  panjang_kiri: number;
  lebar_depan: number;
  lebar_belakang: number;
  luas_tanah: number;
  harga_per_meter: number;
  harga_jual_cash: number;
  no_sertipikat: string;
  keterangan: string;
  status: number;
  lokasi?: LokasiKavling | null;
};

type EditFormData = {
  panjang_kanan: number;
  panjang_kiri: number;
  lebar_depan: number;
  lebar_belakang: number;
  luas_tanah: number;
  harga_per_meter: number;
  harga_jual_cash: number;
  no_sertipikat: string;
  keterangan: string;
};

const STATUS_LABELS: Record<number, string> = {
  0: "Kosong",
  1: "HOLD",
  2: "BF",
  3: "AKAD",
  4: "User Cancel",
  5: "LUNAS",
};

// ─── Component ──────────────────────────────────────────────────────────────────
export default function MasterKavlingPage() {
  const [kavlings, setKavlings] = useState<MasterKavling[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<MasterKavling | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditFormData>();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<MasterKavling[]>>("/kavling");
      setKavlings(res.data.data ?? []);
    } catch {
      addToast("Gagal memuat data kavling", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openEdit(k: MasterKavling) {
    setEditTarget(k);
    reset({
      panjang_kanan: k.panjang_kanan,
      panjang_kiri: k.panjang_kiri,
      lebar_depan: k.lebar_depan,
      lebar_belakang: k.lebar_belakang,
      luas_tanah: k.luas_tanah,
      harga_per_meter: k.harga_per_meter,
      harga_jual_cash: k.harga_jual_cash,
      no_sertipikat: k.no_sertipikat,
      keterangan: k.keterangan,
    });
  }

  async function onEditSubmit(data: EditFormData) {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      await api.put(`/kavling/${editTarget.id}`, data);
      addToast("Kavling berhasil diperbarui", "success");
      setEditTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal memperbarui kavling", "error");
    } finally {
      setEditLoading(false);
    }
  }

  const columns = [
    {
      key: "nama_cluster",
      header: "Nama Cluster",
      render: (k: MasterKavling) => (
        <span className="font-medium text-gray-800">{k.lokasi?.nama ?? "—"}</span>
      ),
    },
    {
      key: "kode_kavling",
      header: "Lokasi",
      render: (k: MasterKavling) => (
        <span className="px-2 py-0.5 bg-gray-100 rounded text-sm font-mono text-gray-700">{k.kode_kavling}</span>
      ),
    },
    {
      key: "panjang",
      header: "Panjang",
      render: (k: MasterKavling) => (
        <div className="text-sm leading-relaxed">
          <p>pjg kanan: <span className="font-semibold text-blue-700">{k.panjang_kanan} m</span></p>
          <p>pjg kiri: <span className="font-semibold text-blue-700">{k.panjang_kiri} m</span></p>
        </div>
      ),
    },
    {
      key: "lebar",
      header: "Lebar",
      render: (k: MasterKavling) => (
        <div className="text-sm leading-relaxed">
          <p>lebar depan: <span className="font-semibold text-blue-700">{k.lebar_depan} m</span></p>
          <p>lebar belakang: <span className="font-semibold text-blue-700">{k.lebar_belakang} m</span></p>
        </div>
      ),
    },
    {
      key: "luas_tanah",
      header: "Luas",
      render: (k: MasterKavling) => (
        <span className="text-sm">
          luas tanah: <span className="font-semibold text-blue-700">{k.luas_tanah} m²</span>
        </span>
      ),
    },
    {
      key: "harga_jual_cash",
      header: "Harga",
      render: (k: MasterKavling) => (
        <span className="text-sm font-medium text-gray-800">
          {k.harga_jual_cash.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (k: MasterKavling) => (
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          k.status === 0 ? "bg-green-100 text-green-700" :
          k.status === 5 ? "bg-blue-100 text-blue-700" :
          "bg-yellow-100 text-yellow-700"
        }`}>
          {STATUS_LABELS[k.status] ?? "—"}
        </span>
      ),
    },
    {
      key: "keterangan",
      header: "Keterangan",
      render: (k: MasterKavling) => (
        <span className="text-sm text-gray-500">{k.keterangan || "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Data Kavling</h1>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Reload
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={kavlings}
            emptyText="Belum ada data kavling"
            actions={(k) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() => openEdit(k)}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
            )}
          />
        )}
      </div>

      {/* ── Edit Modal ── */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Kavling"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={editLoading}>
              Batal
            </Button>
            <Button type="submit" form="form-edit-kavling" disabled={editLoading}>
              {editLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        {editTarget && (
          <form id="form-edit-kavling" onSubmit={handleSubmit(onEditSubmit)} className="space-y-5">
            {/* Readonly info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Lokasi / Cluster</label>
                <div className="h-9 px-3 flex items-center rounded-md border border-gray-200 bg-gray-100 text-sm text-gray-700">
                  {editTarget.lokasi?.nama ?? "—"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Kode Kavling</label>
                <div className="h-9 px-3 flex items-center rounded-md border border-gray-200 bg-gray-100 text-sm text-gray-700 font-mono">
                  {editTarget.kode_kavling}
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Panjang Kanan"
                type="number"
                step="0.01"
                {...register("panjang_kanan", { valueAsNumber: true })}
              />
              <Input
                label="Panjang Kiri"
                type="number"
                step="0.01"
                {...register("panjang_kiri", { valueAsNumber: true })}
              />
              <Input
                label="Lebar Depan"
                type="number"
                step="0.01"
                {...register("lebar_depan", { valueAsNumber: true })}
              />
              <Input
                label="Lebar Belakang"
                type="number"
                step="0.01"
                {...register("lebar_belakang", { valueAsNumber: true })}
              />
            </div>

            <Input
              label="Luas Tanah"
              type="number"
              step="0.01"
              {...register("luas_tanah", { valueAsNumber: true })}
            />

            <Input
              label="Harga Per Meter"
              type="number"
              {...register("harga_per_meter", { valueAsNumber: true })}
            />

            <Input
              label="Harga Jual Cash"
              type="number"
              {...register("harga_jual_cash", { valueAsNumber: true })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
              <textarea
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                {...register("keterangan")}
              />
            </div>

            <Input
              label="No. Sertifikat"
              {...register("no_sertipikat")}
            />
          </form>
        )}
      </Modal>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
