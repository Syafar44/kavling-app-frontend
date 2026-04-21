"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import { Plus, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";

type Notaris = {
  id: number;
  nama: string;
  alamat: string;
  no_telp: string;
  keterangan: string;
};

type FormData = Omit<Notaris, "id">;

const DUMMY: Notaris[] = [
  { id: 1, nama: "DJAROT MUJATMIKO, SH, M.Kn", alamat: "JL. RAYA PEMALANG RANDUNONGKAL", no_telp: "081261215252", keterangan: "NOTARIS" },
  { id: 2, nama: "HENDROTOMO, SH, M.Kn",        alamat: "JL. RAYA PEMALANG RANDUNONGKAL", no_telp: "081262127666", keterangan: "NOTARIS" },
  { id: 3, nama: "AMALIA WIDIATY, SH, M.Kn",    alamat: "JL. RAYA PEMALANG RANDUNONGKAL", no_telp: "081267887555", keterangan: "NOTARIS" },
];

export default function NotarisPage() {
  const [list, setList] = useState<Notaris[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Notaris | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Notaris | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<Notaris[]>>("/notaris");
      setList(res.data.data ?? []);
    } catch { /* noop */ }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openForm(n?: Notaris) {
    setEditTarget(n);
    reset(
      n
        ? { nama: n.nama, alamat: n.alamat, no_telp: n.no_telp, keterangan: n.keterangan }
        : { nama: "", alamat: "", no_telp: "", keterangan: "NOTARIS" }
    );
    setFormOpen(true);
  }

  async function onSubmit(data: FormData) {
    setFormLoading(true);
    try {
      if (editTarget) {
        await api.put(`/notaris/${editTarget.id}`, data);
        addToast("Data notaris diperbarui", "success");
      } else {
        await api.post("/notaris", data);
        addToast("Notaris berhasil ditambahkan", "success");
      }
      setFormOpen(false);
      fetchAll();
    } catch {
      addToast("Gagal menyimpan notaris", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/notaris/${deleteTarget.id}`);
      addToast("Notaris dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus notaris", "error");
    }
  }

  const columns = [
    { key: "nama",       header: "Nama Notaris" },
    { key: "alamat",     header: "Alamat" },
    { key: "no_telp",    header: "No Telp" },
    { key: "keterangan", header: "Keterangan" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Data Notaris</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4" />
            Reload
          </Button>
          <Button size="sm" onClick={() => openForm()}>
            <Plus className="h-4 w-4" />
            Tambah Notaris
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <DataTable
          columns={columns}
          data={list}
          emptyText="Belum ada data notaris"
          actions={(n) => (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openForm(n)}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteTarget(n)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus
              </Button>
            </>
          )}
        />
      </div>

      {/* Form Modal — blue header */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Form Data Notaris"
        headerVariant="primary"
        footer={
          <>
            <Button variant="destructive" onClick={() => setFormOpen(false)} disabled={formLoading}>
              Batal
            </Button>
            <Button type="submit" form="form-notaris" disabled={formLoading}>
              {formLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <form id="form-notaris" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nama Notaris"
            placeholder="Contoh: DJAROT MUJATMIKO, SH, M.Kn"
            {...register("nama", { required: "Wajib diisi" })}
            error={errors.nama?.message}
          />
          <Input
            label="Alamat"
            placeholder="Alamat kantor notaris"
            {...register("alamat", { required: "Wajib diisi" })}
            error={errors.alamat?.message}
          />
          <Input
            label="No Telp"
            placeholder="Contoh: 081261215252"
            {...register("no_telp", { required: "Wajib diisi" })}
            error={errors.no_telp?.message}
          />
          <Input
            label="Keterangan"
            placeholder="Contoh: NOTARIS"
            {...register("keterangan")}
          />
        </form>
      </Modal>

      {/* Confirm Delete — warning style */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message="Apakah Anda yakin?"
        description="Data ini akan dihapus secara permanen!"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
