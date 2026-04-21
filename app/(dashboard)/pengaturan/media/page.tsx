"use client";

import { useState, useEffect, useRef } from "react";
import { Building2, ImageIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type MediaItem = {
  id: number;
  jenis_data: string;
  keterangan: string;
  nama_file: string;
  path_file: string;
  is_logo: boolean;
};

export default function PengaturanMediaPage() {
  const [list, setList] = useState<MediaItem[]>([]);
  const [previewTarget, setPreviewTarget] = useState<MediaItem | null>(null);
  const [updateTarget, setUpdateTarget] = useState<MediaItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    api.get<ApiResponse<MediaItem[]>>("/media").then((r) => setList(r.data.data ?? [])).catch(() => {});
  }, []);

  async function handleUpdate() {
    if (!updateTarget || !selectedFile) { addToast("Pilih file terlebih dahulu", "error"); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);
      const res = await api.put(`/media/${updateTarget.id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      addToast("File berhasil diperbarui", "success");
      setUpdateTarget(null);
      setSelectedFile(null);
      const updated = (res.data as ApiResponse<MediaItem>).data;
      if (updated) setList((prev) => prev.map((m) => m.id === updated.id ? updated : m));
    } catch {
      addToast("Gagal memperbarui file", "error");
    } finally {
      setSaving(false);
    }
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ?? "http://localhost:8080";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Pengaturan Media</h1>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600 w-12">No</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Jenis Data</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Keterangan</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">File</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nama File</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <td className="px-4 py-4 text-gray-500">{idx + 1}</td>
                <td className="px-4 py-4 text-gray-700">{item.jenis_data}</td>
                <td className="px-4 py-4 text-gray-700">{item.keterangan}</td>
                <td className="px-4 py-4 text-center">
                  {item.path_file ? (
                    <img src={`${apiBase}/uploads/${item.path_file}`} alt={item.jenis_data} className="h-10 w-auto mx-auto object-contain" />
                  ) : item.is_logo ? (
                    <div className="inline-flex items-center gap-1 text-blue-800 font-bold text-sm">
                      <Building2 className="h-5 w-5 text-blue-700" /> Prosofia
                    </div>
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-300 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-4 text-gray-700">{item.nama_file}</td>
                <td className="px-4 py-4">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => setPreviewTarget(item)}
                      className="px-3 py-1 rounded text-xs font-medium bg-yellow-400 hover:bg-yellow-500 text-white">
                      Preview
                    </button>
                    <button onClick={() => { setUpdateTarget(item); setSelectedFile(null); }}
                      className="px-3 py-1 rounded text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white">
                      Update
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 text-sm text-gray-500 border-t border-gray-100">
          Showing 1 to {list.length} of {list.length} entries
        </div>
      </div>

      {/* Preview Modal */}
      <Modal open={!!previewTarget} onClose={() => setPreviewTarget(null)} title={`Preview — ${previewTarget?.jenis_data ?? ""}`}
        footer={<Button variant="destructive" onClick={() => setPreviewTarget(null)}>Tutup</Button>}>
        <div className="flex items-center justify-center bg-gray-50 rounded-lg min-h-48">
          {previewTarget?.path_file ? (
            <img src={`${apiBase}/uploads/${previewTarget.path_file}`} alt="preview" className="max-h-64 object-contain" />
          ) : (
            <div className="text-center text-gray-400">
              <ImageIcon className="h-16 w-16 mx-auto mb-2" />
              <p className="text-sm">{previewTarget?.nama_file || "Belum ada file"}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Update Modal */}
      <Modal open={!!updateTarget} onClose={() => setUpdateTarget(null)} title={`Update — ${updateTarget?.jenis_data ?? ""}`}
        headerVariant="primary"
        footer={
          <>
            <Button variant="destructive" onClick={() => setUpdateTarget(null)} disabled={saving}>Batal</Button>
            <Button onClick={handleUpdate} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">File saat ini: <span className="font-medium">{updateTarget?.nama_file || "—"}</span></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih File Baru</label>
            <input ref={fileRef} type="file" accept="image/*,.webp" className="w-full text-sm border border-gray-300 rounded-md px-3 py-2"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
