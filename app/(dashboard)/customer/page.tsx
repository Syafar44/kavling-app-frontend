"use client";

import React, { useEffect, useState, useRef } from "react";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import type { Customer, CustomerFormData } from "@/types/customer";
import type { ApiResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:8080";

export default function CustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [previewCustomer, setPreviewCustomer] = useState<Customer | null>(null);
  const ktpRef = useRef<HTMLInputElement>(null);
  const kkRef = useRef<HTMLInputElement>(null);
  const { toasts, addToast, removeToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Omit<CustomerFormData, "foto_ktp" | "foto_kk">>();

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Customer[]>>("/customers");
      setCustomers(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  function openForm(c?: Customer) {
    setEditTarget(c);
    reset(c ? { nama: c.nama, no_ktp: c.no_ktp, no_telp: c.no_telp, alamat: c.alamat, pekerjaan: c.pekerjaan } : { nama: "", no_ktp: "", no_telp: "", alamat: "", pekerjaan: "" });
    setFormOpen(true);
  }

  async function onSubmit(data: Omit<CustomerFormData, "foto_ktp" | "foto_kk">) {
    setFormLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => formData.append(k, String(v)));
      if (ktpRef.current?.files?.[0]) formData.append("foto_ktp", ktpRef.current.files[0]);
      if (kkRef.current?.files?.[0]) formData.append("foto_kk", kkRef.current.files[0]);

      if (editTarget) {
        const res = await api.put<ApiResponse<Customer>>(`/customers/${editTarget.id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
        setCustomers((prev) => prev.map((c) => c.id === editTarget.id ? res.data.data! : c));
        addToast("Customer diperbarui", "success");
      } else {
        const res = await api.post<ApiResponse<Customer>>("/customers", formData, { headers: { "Content-Type": "multipart/form-data" } });
        setCustomers((prev) => [...prev, res.data.data!]);
        addToast("Customer ditambahkan", "success");
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
      await api.delete(`/customers/${deleteTarget.id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      addToast("Customer dihapus", "success");
      setDeleteTarget(null);
    } catch {
      addToast("Gagal menghapus", "error");
    }
  }

  const columns = [
    { key: "nama", header: "Nama" },
    { key: "no_ktp", header: "No. KTP" },
    { key: "no_telp", header: "No. Telepon" },
    { key: "pekerjaan", header: "Pekerjaan" },
    { key: "alamat", header: "Alamat" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => openForm()}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah Customer
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <DataTable
          columns={columns}
          data={customers}
          loading={loading}
          emptyText="Belum ada data customer"
          actions={(c) => (
            <>
              <Button size="sm" variant="outline" onClick={() => setPreviewCustomer(c)}>
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => openForm(c)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(c)}>
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
        title={editTarget ? "Edit Customer" : "Tambah Customer"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>Batal</Button>
            <Button type="submit" form="form-customer" disabled={formLoading}>
              {formLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <form id="form-customer" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nama" {...register("nama", { required: "Wajib diisi" })} error={errors.nama?.message} />
          <Input label="No. KTP" {...register("no_ktp", { required: "Wajib diisi" })} error={errors.no_ktp?.message} />
          <Input label="Alamat" {...register("alamat", { required: "Wajib diisi" })} error={errors.alamat?.message} />
          <Input label="No. Telepon" {...register("no_telp")} error={errors.no_telp?.message} />
          <Input label="Pekerjaan" {...register("pekerjaan")} error={errors.pekerjaan?.message} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Foto KTP</label>
              <input ref={ktpRef} type="file" accept="image/*" className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Foto KK</label>
              <input ref={kkRef} type="file" accept="image/*" className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Customer"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Yakin ingin menghapus customer <strong>{deleteTarget?.nama}</strong>?
        </p>
      </Modal>

      {/* Preview Dokumen */}
      <Modal
        open={!!previewCustomer}
        onClose={() => setPreviewCustomer(null)}
        title={`Dokumen — ${previewCustomer?.nama}`}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">FOTO KTP</p>
            {previewCustomer?.foto_ktp ? (
              <Image
                src={`${API_URL}/${previewCustomer.foto_ktp}`}
                alt="KTP"
                width={300}
                height={200}
                className="rounded border object-cover w-full"
              />
            ) : (
              <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                Tidak ada foto
              </div>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">FOTO KK</p>
            {previewCustomer?.foto_kk ? (
              <Image
                src={`${API_URL}/${previewCustomer.foto_kk}`}
                alt="KK"
                width={300}
                height={200}
                className="rounded border object-cover w-full"
              />
            ) : (
              <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                Tidak ada foto
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
