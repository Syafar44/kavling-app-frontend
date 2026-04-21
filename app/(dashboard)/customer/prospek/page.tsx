"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type Prospek = {
  id: number;
  tanggal: string;
  nama: string;
  no_telp: string;
  usia: number | null;
  pekerjaan: string;
  penghasilan: number | null;
  sumber_informasi: string;
  rangking: string;
  id_marketing: number | null;
  keterangan: string;
  marketing?: { id: number; nama: string } | null;
};

type MarketingOption = { id: number; nama: string };

type FormData = {
  tanggal: string;
  nama: string;
  no_telp: string;
  usia: string;
  pekerjaan: string;
  penghasilan: string;
  sumber_informasi: string;
  rangking: string;
  id_marketing: string;
  keterangan: string;
};

const RANKINGS = ["A", "B", "C", "X"];

export default function ProspekPage() {
  const [list, setList] = useState<Prospek[]>([]);
  const [marketings, setMarketings] = useState<MarketingOption[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Prospek | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Prospek | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<Prospek[]>>("/prospek");
      setList(res.data.data ?? []);
    } catch {
      addToast("Gagal memuat data prospek", "error");
    }
  }, [addToast]);

  useEffect(() => {
    fetchAll();
    api.get<ApiResponse<MarketingOption[]>>("/marketing").then((r) => setMarketings(r.data.data ?? [])).catch(() => {});
  }, [fetchAll]);

  function openForm(p?: Prospek) {
    setEditTarget(p);
    reset(
      p
        ? {
            tanggal: p.tanggal ? p.tanggal.split("T")[0] : new Date().toISOString().split("T")[0],
            nama: p.nama,
            no_telp: p.no_telp,
            usia: p.usia != null ? String(p.usia) : "",
            pekerjaan: p.pekerjaan,
            penghasilan: p.penghasilan != null ? String(p.penghasilan) : "",
            sumber_informasi: p.sumber_informasi,
            rangking: p.rangking,
            id_marketing: p.id_marketing != null ? String(p.id_marketing) : "",
            keterangan: p.keterangan,
          }
        : {
            tanggal: new Date().toISOString().split("T")[0],
            nama: "", no_telp: "", usia: "", pekerjaan: "",
            penghasilan: "", sumber_informasi: "", rangking: "",
            id_marketing: "", keterangan: "",
          }
    );
    setFormOpen(true);
  }

  async function onSubmit(data: FormData) {
    setFormLoading(true);
    try {
      const payload = {
        tanggal: data.tanggal ? new Date(data.tanggal).toISOString() : new Date().toISOString(),
        nama: data.nama,
        no_telp: data.no_telp,
        usia: data.usia ? Number(data.usia) : null,
        pekerjaan: data.pekerjaan,
        penghasilan: data.penghasilan ? Number(data.penghasilan) : null,
        sumber_informasi: data.sumber_informasi,
        rangking: data.rangking,
        id_marketing: data.id_marketing ? Number(data.id_marketing) : null,
        keterangan: data.keterangan,
      };
      if (editTarget) {
        await api.put(`/prospek/${editTarget.id}`, payload);
        addToast("Data prospek diperbarui", "success");
      } else {
        await api.post("/prospek", payload);
        addToast("Prospek berhasil ditambahkan", "success");
      }
      setFormOpen(false);
      fetchAll();
    } catch {
      addToast("Gagal menyimpan data prospek", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/prospek/${deleteTarget.id}`);
      addToast("Prospek dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus prospek", "error");
    }
  }

  const columns = [
    {
      key: "nama",
      header: "Nama User",
      render: (row: Prospek) => (
        <div>
          <div className="font-medium text-gray-900">{row.nama}</div>
          {row.marketing && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-cyan-500 text-white">
              {row.marketing.nama}
            </span>
          )}
        </div>
      ),
    },
    { key: "no_telp", header: "No.Tlp" },
    { key: "pekerjaan", header: "Pekerjaan" },
    { key: "rangking", header: "Rangking" },
    { key: "keterangan", header: "Keterangan" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Data Prospek</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4" />
            Reload
          </Button>
          <Button size="sm" onClick={() => openForm()}>
            <Plus className="h-4 w-4" />
            Tambah Prospek
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <DataTable
          columns={columns}
          data={list}
          emptyText="Belum ada data prospek"
          actions={(p) => (
            <>
              <Button size="sm" variant="outline" onClick={() => openForm(p)} className="border-blue-300 text-blue-600 hover:bg-blue-50">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(p)}>
                <Trash2 className="h-3.5 w-3.5" /> Hapus
              </Button>
            </>
          )}
        />
      </div>

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Form Data Prospek"
        headerVariant="primary"
        footer={
          <>
            <Button variant="destructive" onClick={() => setFormOpen(false)} disabled={formLoading}>Batal</Button>
            <Button type="submit" form="form-prospek" disabled={formLoading}>
              {formLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <form id="form-prospek" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Tanggal" type="date" {...register("tanggal", { required: "Wajib diisi" })} error={errors.tanggal?.message} />
          <Input label="Nama Lengkap" placeholder="Nama lengkap prospek" {...register("nama", { required: "Wajib diisi" })} error={errors.nama?.message} />
          <Input label="No. Telp" placeholder="Contoh: 08123456789" {...register("no_telp", { required: "Wajib diisi" })} error={errors.no_telp?.message} />
          <Input label="Usia (tahun)" type="number" placeholder="Contoh: 26" {...register("usia")} />
          <div className="flex gap-3">
            <div className="flex-1">
              <Input label="Pekerjaan" placeholder="Pekerjaan" {...register("pekerjaan")} />
            </div>
            <div className="flex-1">
              <Input label="Penghasilan" type="number" placeholder="Contoh: 4000000" {...register("penghasilan")} />
            </div>
          </div>
          <Input label="Sumber Informasi" placeholder="Contoh: Kantor, Instagram, dll" {...register("sumber_informasi")} />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rangking</label>
              <select
                {...register("rangking")}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Pilih Rangking —</option>
                {RANKINGS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Marketing</label>
              <select
                {...register("id_marketing")}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Pilih Marketing —</option>
                {marketings.map((m) => (
                  <option key={m.id} value={m.id}>{m.nama}</option>
                ))}
              </select>
            </div>
          </div>
          <Input label="Keterangan" placeholder="-" {...register("keterangan")} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message="Apakah Anda yakin?"
        description="Data prospek ini akan dihapus secara permanen!"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
