"use client";

import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import type { Marketing, MarketingFormData, KomisiMarketing } from "@/types/marketing";
import type { ApiResponse } from "@/types/api";
import { formatRupiah, formatTanggal } from "@/lib/utils";

export default function MarketingPage() {
  const [marketings, setMarketings] = useState<Marketing[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Marketing | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Marketing | null>(null);
  const [komisiTarget, setKomisiTarget] = useState<Marketing | null>(null);
  const [komisis, setKomisis] = useState<KomisiMarketing[]>([]);
  const { toasts, addToast, removeToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MarketingFormData>();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Marketing[]>>("/marketing");
      setMarketings(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function openKomisi(m: Marketing) {
    setKomisiTarget(m);
    try {
      const res = await api.get<ApiResponse<KomisiMarketing[]>>(`/marketing/${m.id}/komisi`);
      setKomisis(res.data.data ?? []);
    } catch {
      setKomisis([]);
    }
  }

  function openForm(m?: Marketing) {
    setEditTarget(m);
    reset(m ?? { nama: "", no_telp: "", alamat: "", email: "", persentase_komisi: 0, status: 1 });
    setFormOpen(true);
  }

  async function onSubmit(data: MarketingFormData) {
    setFormLoading(true);
    try {
      if (editTarget) {
        const res = await api.put<ApiResponse<Marketing>>(`/marketing/${editTarget.id}`, data);
        setMarketings((prev) => prev.map((m) => m.id === editTarget.id ? res.data.data! : m));
        addToast("Marketing diperbarui", "success");
      } else {
        const res = await api.post<ApiResponse<Marketing>>("/marketing", data);
        setMarketings((prev) => [...prev, res.data.data!]);
        addToast("Marketing ditambahkan", "success");
      }
      setFormOpen(false);
    } catch {
      addToast("Terjadi kesalahan", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/marketing/${deleteTarget.id}`);
      setMarketings((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      addToast("Marketing dihapus", "success");
      setDeleteTarget(null);
    } catch {
      addToast("Gagal menghapus", "error");
    }
  }

  const columns = [
    { key: "nama", header: "Nama" },
    { key: "no_telp", header: "No. Telepon" },
    { key: "email", header: "Email" },
    { key: "alamat", header: "Alamat" },
    {
      key: "persentase_komisi",
      header: "Komisi (%)",
      render: (m: Marketing) => `${m.persentase_komisi}%`,
    },
    {
      key: "status",
      header: "Status",
      render: (m: Marketing) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.status === 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {m.status === 1 ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
    {
      key: "jumlah_open",
      header: "Open",
      render: (m: Marketing) => m.jumlah_open ?? 0,
    },
    {
      key: "jumlah_closed",
      header: "Closed",
      render: (m: Marketing) => m.jumlah_closed ?? 0,
    },
  ];

  const komisiColumns = [
    { key: "tanggal", header: "Tanggal", render: (k: KomisiMarketing) => formatTanggal(k.tanggal) },
    { key: "kode_kavling", header: "Kavling" },
    { key: "jenis", header: "Jenis" },
    { key: "fee", header: "Fee", render: (k: KomisiMarketing) => formatRupiah(k.fee) },
    { key: "total", header: "Total", render: (k: KomisiMarketing) => formatRupiah(k.total) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openForm()}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah Marketing
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <DataTable
          columns={columns}
          data={marketings}
          loading={loading}
          emptyText="Belum ada data marketing"
          actions={(m) => (
            <>
              <Button size="sm" variant="outline" onClick={() => openKomisi(m)}>
                <FileText className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => openForm(m)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(m)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        />
      </div>

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? "Edit Marketing" : "Tambah Marketing"}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>Batal</Button>
            <Button type="submit" form="form-marketing" disabled={formLoading}>
              {formLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <form id="form-marketing" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nama" {...register("nama", { required: "Wajib diisi" })} error={errors.nama?.message} />
          <Input label="No. Telepon" {...register("no_telp")} error={errors.no_telp?.message} />
          <Input label="Email" {...register("email")} error={errors.email?.message} />
          <Input label="Alamat" {...register("alamat")} error={errors.alamat?.message} />
          <Input label="Persentase Komisi (%)" type="number" step="0.1" {...register("persentase_komisi", { valueAsNumber: true })} error={errors.persentase_komisi?.message} />
          <Select
            label="Status"
            {...register("status", { valueAsNumber: true })}
            options={[{ value: "1", label: "Aktif" }, { value: "0", label: "Nonaktif" }]}
          />
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Marketing"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Yakin ingin menghapus marketing <strong>{deleteTarget?.nama}</strong>?
        </p>
      </Modal>

      {/* Komisi Modal */}
      <Modal
        open={!!komisiTarget}
        onClose={() => setKomisiTarget(null)}
        title={`Komisi — ${komisiTarget?.nama}`}
        size="xl"
      >
        <DataTable columns={komisiColumns} data={komisis} emptyText="Belum ada data komisi" />
      </Modal>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
