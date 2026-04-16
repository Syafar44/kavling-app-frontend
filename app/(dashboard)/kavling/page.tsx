"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Eye, Map } from "lucide-react";
import { useDenahKavling } from "@/hooks/useDenahKavling";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ToastContainer } from "@/components/ui/Toast";
import type { DenahKavling } from "@/types/kavling";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@/types/api";

export default function KavlingPage() {
  const router = useRouter();
  const {
    denahKavlings,
    loading,
    fetchDenahKavlings,
    createDenahKavling,
    deleteDenahKavling,
    setDenahKavlings,
  } = useDenahKavling();
  const { toasts, addToast, removeToast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [nama, setNama] = useState("");
  const [svgContent, setSvgContent] = useState("");
  const [namaError, setNamaError] = useState("");
  const [svgError, setSvgError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<DenahKavling | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchDenahKavlings();
  }, [fetchDenahKavlings]);

  function handleOpenForm() {
    setNama("");
    setSvgContent("");
    setNamaError("");
    setSvgError("");
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;
    if (!nama.trim()) {
      setNamaError("Nama denah wajib diisi");
      valid = false;
    } else {
      setNamaError("");
    }
    if (!svgContent.trim()) {
      setSvgError("Kode SVG wajib diisi");
      valid = false;
    } else if (!svgContent.includes("<svg") || !svgContent.includes("<path")) {
      setSvgError("Format SVG tidak valid atau tidak ada path kavling");
      valid = false;
    } else {
      setSvgError("");
    }
    if (!valid) return;

    setFormLoading(true);
    try {
      const created = await createDenahKavling({ nama: nama.trim(), svg_content: svgContent.trim() });
      setDenahKavlings((prev) => [...prev, created]);
      addToast(`Denah "${created.nama}" berhasil dibuat dengan ${created.kavlings?.length ?? 0} kavling`, "success");
      setFormOpen(false);
      router.push(`/kavling/${created.id}`);
    } catch (err) {
      const msg = (err as AxiosError<ApiResponse>).response?.data?.message ?? "Gagal membuat denah kavling";
      addToast(msg, "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteDenahKavling(deleteTarget.id);
      setDenahKavlings((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      addToast(`Denah "${deleteTarget.nama}" berhasil dihapus`, "success");
      setDeleteTarget(null);
    } catch (err) {
      const msg = (err as AxiosError<ApiResponse>).response?.data?.message ?? "Gagal menghapus";
      addToast(msg, "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Denah Kavling</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola denah kavling dan plot tanah
          </p>
        </div>
        <Button size="sm" onClick={handleOpenForm}>
          <Plus className="h-4 w-4 mr-1" />
          Tambah Denah Kavling
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
          Memuat data...
        </div>
      ) : denahKavlings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Map className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">Belum ada denah kavling</p>
          <p className="text-gray-400 text-sm mt-1">
            Klik "Tambah Denah Kavling" untuk mulai membuat denah
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {denahKavlings.map((denah) => (
            <div
              key={denah.id}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {denah.nama}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {denah.jumlah_kavling ?? denah.kavlings?.length ?? 0} kavling
                  </p>
                  <div className="flex gap-3 mt-1 text-xs">
                    <span className="text-green-600">
                      Kosong: {denah.jumlah_kosong ?? 0}
                    </span>
                    <span className="text-red-500">
                      Terjual: {denah.jumlah_terjual ?? 0}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/kavling/${denah.id}`)}
                    title="Lihat detail"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteTarget(denah)}
                    title="Hapus denah"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Denah Kavling */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Tambah Denah Kavling"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>
              Batal
            </Button>
            <Button type="submit" form="form-denah" disabled={formLoading}>
              {formLoading ? "Memproses..." : "Buat Denah"}
            </Button>
          </>
        }
      >
        <form id="form-denah" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Denah"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Contoh: Blok A, Cluster Melati"
            error={namaError}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Kode SVG
            </label>
            <textarea
              value={svgContent}
              onChange={(e) => setSvgContent(e.target.value)}
              placeholder={`Paste kode SVG di sini...\n<svg width="564" height="687" viewBox="0 0 564 687" ...>\n  <path id="A-1" d="M133.008 158.064..." fill="#FF0000"/>\n  ...\n</svg>`}
              rows={12}
              className={`w-full rounded-md border px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                svgError ? "border-red-400" : "border-gray-300"
              }`}
            />
            {svgError && (
              <p className="text-xs text-red-500">{svgError}</p>
            )}
            <p className="text-xs text-gray-400">
              Hanya elemen <code>&lt;path&gt;</code> dengan atribut <code>id</code> yang akan dijadikan kavling. Elemen lain (line, rect, dll) akan menjadi dekorasi peta.
            </p>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Denah Kavling"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? "Menghapus..." : "Hapus"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Yakin ingin menghapus denah{" "}
          <strong>{deleteTarget?.nama}</strong>? Semua kavling di dalamnya (
          {deleteTarget?.jumlah_kavling ?? deleteTarget?.kavlings?.length ?? 0} kavling) juga akan dihapus. Aksi
          ini tidak dapat dibatalkan.
        </p>
      </Modal>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
