"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type CustomerItem = {
  id: number;
  kode_kontrak: string;
  nama: string;
  no_ktp: string;
  no_telp: string;
  lokasi?: { id: number; nama: string } | null;
};

type CustomerDetail = {
  customer: CustomerItem;
  kavlings: { id: number; kode_kavling: string }[];
};

type CustomerFile = {
  id: number;
  id_customer: number;
  tanggal: string;
  nama_file: string;
  path_file: string;
  keterangan: string;
};

const NAMA_FILE_OPTIONS = [
  "Foto KTP",
  "Foto Kartu Keluarga",
  "Foto Pemohon",
  "Foto KTP Pasangan",
  "Foto NPWP",
  "Foto BPJS",
];

const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:8080";

export default function UploadFilePage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [selectedDetail, setSelectedDetail] = useState<CustomerDetail | null>(null);
  const [files, setFiles] = useState<CustomerFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<CustomerFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerFile | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [form, setForm] = useState({ tanggal: new Date().toISOString().split("T")[0], nama_file: "", keterangan: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    api.get("/customer?per_page=500")
      .then((r) => setCustomers((r.data as any).data ?? []))
      .catch(() => addToast("Gagal memuat daftar nasabah", "error"));
  }, []);

  const fetchCustomerData = useCallback(async (id: number) => {
    setLoadingFiles(true);
    setFiles([]);
    setSelectedDetail(null);
    try {
      const [detailRes, filesRes] = await Promise.all([
        api.get<ApiResponse<CustomerDetail>>(`/customer/${id}`),
        api.get<ApiResponse<CustomerFile[]>>(`/customer/${id}/file`),
      ]);
      setSelectedDetail(detailRes.data.data ?? null);
      setFiles(filesRes.data.data ?? []);
    } catch {
      addToast("Gagal memuat data nasabah", "error");
    } finally {
      setLoadingFiles(false);
    }
  }, [addToast]);

  function handleSelectCustomer(id: number | "") {
    setSelectedId(id);
    if (id) fetchCustomerData(id as number);
    else { setSelectedDetail(null); setFiles([]); }
  }

  function openUpload() {
    setForm({ tanggal: new Date().toISOString().split("T")[0], nama_file: "", keterangan: "" });
    if (fileRef.current) fileRef.current.value = "";
    setUploadOpen(true);
  }

  async function handleSave() {
    if (!selectedId) return;
    if (!form.nama_file) { addToast("Pilih nama file terlebih dahulu", "error"); return; }
    if (!fileRef.current?.files?.[0]) { addToast("Pilih file untuk diupload", "error"); return; }
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", fileRef.current.files[0]);
      fd.append("nama_file", form.nama_file);
      fd.append("keterangan", form.keterangan);
      fd.append("tanggal", form.tanggal);
      await api.post(`/customer/${selectedId}/file`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      addToast("File berhasil diupload", "success");
      setUploadOpen(false);
      fetchCustomerData(selectedId as number);
    } catch {
      addToast("Gagal mengupload file", "error");
    } finally {
      setUploadLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !selectedId) return;
    try {
      await api.delete(`/customer/${selectedId}/file/${deleteTarget.id}`);
      addToast("File dihapus", "success");
      setDeleteTarget(null);
      fetchCustomerData(selectedId as number);
    } catch {
      addToast("Gagal menghapus file", "error");
    }
  }

  const customer = selectedDetail?.customer;
  const kavlingKode = selectedDetail?.kavlings?.[0]?.kode_kavling ?? "—";

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Data Lampiran File Nasabah</h1>

      {/* Nasabah Info Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-4">
          <span className="w-44 text-sm text-gray-600 shrink-0">Nama Nasabah</span>
          <select
            value={selectedId}
            onChange={(e) => handleSelectCustomer(e.target.value ? Number(e.target.value) : "")}
            className="w-80 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Pilih Nasabah</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.kode_kontrak} - {c.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-8">
          <div className="flex items-center gap-4 flex-1">
            <span className="w-44 text-sm text-gray-600 shrink-0">No. KTP</span>
            <div className="flex-1 bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 min-h-9">
              {customer?.no_ktp ?? ""}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-1">
            <span className="w-28 text-sm text-gray-600 shrink-0">No. Telp</span>
            <div className="flex-1 bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 min-h-9">
              {customer?.no_telp ?? ""}
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="flex items-center gap-4 flex-1">
            <span className="w-44 text-sm text-gray-600 shrink-0">Lokasi Perumahan</span>
            <div className="flex-1 bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 min-h-9">
              {customer?.lokasi?.nama ?? ""}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-1">
            <span className="w-28 text-sm text-gray-600 shrink-0">Lokasi Kav/Blok</span>
            <div className="flex-1 bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 min-h-9">
              {selectedId ? kavlingKode : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-end px-4 pt-4">
          <Button
            size="sm"
            onClick={openUpload}
            disabled={!selectedId}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <Upload className="h-4 w-4" />
            Upload File
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 w-16">No</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nama File</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">File Lampiran</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loadingFiles ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8">
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
                    </div>
                  </td>
                </tr>
              ) : files.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400">
                    {selectedId ? "Belum ada file lampiran" : "Pilih nasabah terlebih dahulu"}
                  </td>
                </tr>
              ) : (
                files.map((f, idx) => (
                  <tr key={f.id} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="px-4 py-3 text-gray-700">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-900">{f.nama_file}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPreviewTarget(f)}
                          className="px-3 py-1 rounded text-xs font-medium bg-cyan-500 hover:bg-cyan-600 text-white"
                        >
                          View
                        </button>
                        <a
                          href={`${apiBase}/uploads/${f.path_file}`}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded text-xs font-medium bg-green-600 hover:bg-green-700 text-white"
                        >
                          Download
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteTarget(f)}
                        className="px-3 py-1 rounded text-xs font-medium bg-red-500 hover:bg-red-600 text-white"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload File Nasabah"
        headerVariant="primary"
        footer={
          <>
            <Button variant="destructive" onClick={() => setUploadOpen(false)} disabled={uploadLoading}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={uploadLoading}>
              {uploadLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Upload</label>
            <input
              type="date"
              value={form.tanggal}
              onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama File</label>
            <select
              value={form.nama_file}
              onChange={(e) => setForm((f) => ({ ...f, nama_file: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Nama File --</option>
              {NAMA_FILE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File Lampiran</label>
            <input
              ref={fileRef}
              type="file"
              className="w-full text-sm text-gray-700 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
            <textarea
              rows={3}
              value={form.keterangan}
              onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        title={`Preview — ${previewTarget?.nama_file ?? ""}`}
        size="md"
        footer={<Button onClick={() => setPreviewTarget(null)}>Tutup</Button>}
      >
        <div className="flex items-center justify-center bg-gray-50 rounded-lg min-h-64">
          {previewTarget?.path_file ? (
            <img
              src={`${apiBase}/uploads/${previewTarget.path_file}`}
              alt="preview"
              className="max-h-96 max-w-full object-contain"
            />
          ) : (
            <p className="text-gray-400 text-sm">File tidak tersedia</p>
          )}
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message="Apakah Anda yakin?"
        description="File lampiran ini akan dihapus secara permanen!"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
