"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Pencil, Trash2, User } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Marketing, MarketingFormData } from "@/types/marketing";

// Kept for legacy compat (not used after api integration)
const DUMMY_MARKETING: Marketing[] = [
  {
    id: 3,
    kode_marketing: "M-003",
    nama: "Sair",
    alamat: "Kebondalem - Pemalang",
    jenis_kelamin: "L",
    pekerjaan: "Wiraswasta",
    no_telp: "083154541205",
    status: 1,
  },
];

function nextKode(list: Marketing[]): string {
  const max = list.reduce((n, m) => {
    const num = parseInt(m.kode_marketing.replace("M-", ""), 10);
    return isNaN(num) ? n : Math.max(n, num);
  }, 0);
  return `M-${String(max + 1).padStart(3, "0")}`;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function MasterMarketingPage() {
  const [marketings, setMarketings] = useState<Marketing[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Marketing | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Marketing | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | undefined>();
  const [fotoFile, setFotoFile] = useState<File | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Marketing[]>>("/marketing");
      setMarketings(res.data.data ?? []);
    } catch {
      addToast("Gagal memuat data marketing", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MarketingFormData>();

  function openForm(m?: Marketing) {
    setEditTarget(m);
    setFotoPreview(m?.foto);
    reset(
      m
        ? {
            nama: m.nama,
            alamat: m.alamat,
            jenis_kelamin: m.jenis_kelamin,
            pekerjaan: m.pekerjaan,
            no_telp: m.no_telp,
            foto: m.foto,
            status: m.status,
          }
        : { nama: "", alamat: "", jenis_kelamin: "L", pekerjaan: "", no_telp: "", foto: "", status: 1 }
    );
    setFormOpen(true);
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }

  async function onSubmit(data: MarketingFormData) {
    setFormLoading(true);
    try {
      const fd = new FormData();
      fd.append("nama", data.nama);
      fd.append("alamat", data.alamat ?? "");
      fd.append("jenis_kelamin", data.jenis_kelamin);
      fd.append("pekerjaan", data.pekerjaan ?? "");
      fd.append("no_telp", data.no_telp);
      fd.append("status", String(data.status));
      if (fotoFile) fd.append("foto", fotoFile);

      if (editTarget) {
        await api.put(`/marketing/${editTarget.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
        addToast("Data marketing diperbarui", "success");
      } else {
        await api.post("/marketing", fd, { headers: { "Content-Type": "multipart/form-data" } });
        addToast("Marketing berhasil ditambahkan", "success");
      }
      setFormOpen(false);
      fetchAll();
    } catch {
      addToast("Gagal menyimpan data marketing", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/marketing/${deleteTarget.id}`);
      addToast("Marketing dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus marketing", "error");
    }
  }

  const columns = [
    {
      key: "kode_marketing",
      header: "Kode Marketing",
      render: (m: Marketing) => (
        <div className="flex items-center gap-2.5">
          {m.foto ? (
            <img src={m.foto} alt={m.nama} className="h-8 w-8 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-cyan-500" />
            </div>
          )}
          <span className="font-medium text-gray-800">{m.kode_marketing}</span>
        </div>
      ),
    },
    { key: "nama", header: "Nama Marketing" },
    {
      key: "alamat",
      header: "Alamat",
      render: (m: Marketing) => (
        <div>
          <p className="text-gray-700">{m.alamat}</p>
          <p className="text-xs text-gray-400">Telp: {m.no_telp}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (m: Marketing) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            m.status === 1
              ? "bg-green-500 text-white"
              : "bg-red-100 text-red-700"
          }`}
        >
          {m.status === 1 ? "Aktif" : "Nonaktif"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Data Marketing</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4" />
            Reload
          </Button>
          <Button size="sm" onClick={() => openForm()}>
            <Plus className="h-4 w-4" />
            Tambah Marketing
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {loading && <div className="p-6 space-y-3">{Array.from({length:4}).map((_,i)=><div key={i} className="h-12 bg-gray-100 rounded animate-pulse"/>)}</div>}
        <DataTable
          columns={columns}
          data={loading ? [] : marketings}
          emptyText="Belum ada data marketing"
          actions={(m) => (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openForm(m)}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteTarget(m)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus
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
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>
              Batal
            </Button>
            <Button type="submit" form="form-marketing" disabled={formLoading}>
              {formLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <form id="form-marketing" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Foto Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foto</label>
            <div className="flex items-center gap-4">
              <div
                className="h-20 w-20 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {fotoPreview ? (
                  <img src={fotoPreview} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Pilih Foto
                </Button>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG · maks 2 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFotoChange}
                />
              </div>
            </div>
          </div>

          <Input
            label="Nama Marketing"
            placeholder="Masukkan nama lengkap"
            {...register("nama", { required: "Wajib diisi" })}
            error={errors.nama?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Masukkan alamat lengkap"
              {...register("alamat", { required: "Wajib diisi" })}
            />
            {errors.alamat && <p className="text-xs text-red-500 mt-1">{errors.alamat.message}</p>}
          </div>

          <Select
            label="Jenis Kelamin"
            {...register("jenis_kelamin", { required: "Wajib diisi" })}
            options={[
              { value: "L", label: "Laki-laki" },
              { value: "P", label: "Perempuan" },
            ]}
          />

          <Input
            label="Pekerjaan"
            placeholder="Contoh: Agen Properti, Wiraswasta"
            {...register("pekerjaan")}
          />

          <Input
            label="No. Telp"
            placeholder="Contoh: 0812-3456-7890"
            {...register("no_telp", { required: "Wajib diisi" })}
            error={errors.no_telp?.message}
          />

          <Select
            label="Status"
            {...register("status", { valueAsNumber: true })}
            options={[
              { value: "1", label: "Aktif" },
              { value: "0", label: "Nonaktif" },
            ]}
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
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Yakin ingin menghapus marketing <strong>{deleteTarget?.nama}</strong>?
        </p>
      </Modal>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
