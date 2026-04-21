"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Pencil, Trash2, Image as ImageIcon, Code } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import { LOKASI_SVG_LAYOUTS, generateSvgContent } from "@/lib/data/lokasi-kavling";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type LokasiKavling = {
  id: number;
  nama: string;
  nama_singkat: string;
  header: string;
  alamat: string;
  nama_perusahaan: string;
  nama_admin: string;
  nama_mengetahui: string;
  alamat_perusahaan: string;
  telp_perusahaan: string;
  kota_penandatangan: string;
  nama_penandatangan: string;
  jabatan_penandatangan: string;
  jenis_pembelian: string;
  urutan_lokasi: number;
  jumlah_kavling: number;
  kop_surat?: string;
  kwitansi?: string;
  foto_kavling?: string;
  svg_content?: string;
};

type FormData = Omit<LokasiKavling, "id" | "jumlah_kavling" | "kop_surat" | "kwitansi" | "foto_kavling" | "svg_content">;

/* ─── Image upload helper ─── */
function ImageUploadField({
  label, value, onChange,
}: {
  label: string; value?: string; onChange: (url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div
        className="h-24 w-full rounded-md border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden"
        onClick={() => ref.current?.click()}
      >
        {value ? (
          <img src={value} alt={label} className="h-full w-auto object-contain" />
        ) : (
          <div className="text-center">
            <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
            <p className="text-xs text-gray-500">Klik untuk upload</p>
          </div>
        )}
      </div>
      <input
        ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(URL.createObjectURL(file));
        }}
      />
    </div>
  );
}

export default function LokasiKavlingPage() {
  const [lokasis, setLokasis] = useState<LokasiKavling[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LokasiKavling | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LokasiKavling | null>(null);
  const [kopSurat, setKopSurat] = useState<string | undefined>();
  const [kwitansi, setKwitansi] = useState<string | undefined>();
  const [fotoKavling, setFotoKavling] = useState<string | undefined>();
  const [svgContent, setSvgContent] = useState<string>("");
  const [svgTab, setSvgTab] = useState<"editor" | "preview">("editor");
  const { toasts, addToast, removeToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<LokasiKavling[]>>("/lokasi-kavling");
      setLokasis(res.data.data ?? []);
    } catch {
      addToast("Gagal memuat data lokasi kavling", "error");
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openForm(l?: LokasiKavling) {
    setEditTarget(l);
    setKopSurat(l?.kop_surat);
    setKwitansi(l?.kwitansi);
    setFotoKavling(l?.foto_kavling);
    setSvgContent(
      l?.svg_content ??
      (LOKASI_SVG_LAYOUTS[l?.nama ?? ""]
        ? generateSvgContent(LOKASI_SVG_LAYOUTS[l?.nama ?? ""])
        : "")
    );
    setSvgTab("editor");
    reset(
      l
        ? {
            nama: l.nama, nama_singkat: l.nama_singkat, header: l.header,
            alamat: l.alamat, nama_perusahaan: l.nama_perusahaan,
            nama_admin: l.nama_admin, nama_mengetahui: l.nama_mengetahui,
            alamat_perusahaan: l.alamat_perusahaan, telp_perusahaan: l.telp_perusahaan,
            kota_penandatangan: l.kota_penandatangan, nama_penandatangan: l.nama_penandatangan,
            jabatan_penandatangan: l.jabatan_penandatangan, jenis_pembelian: l.jenis_pembelian,
            urutan_lokasi: l.urutan_lokasi,
          }
        : {
            nama: "", nama_singkat: "", header: "", alamat: "", nama_perusahaan: "",
            nama_admin: "", nama_mengetahui: "", alamat_perusahaan: "", telp_perusahaan: "",
            kota_penandatangan: "", nama_penandatangan: "", jabatan_penandatangan: "",
            jenis_pembelian: "cash_kredit", urutan_lokasi: lokasis.length + 1,
          }
    );
    setFormOpen(true);
  }

  async function onSubmit(data: FormData) {
    setFormLoading(true);
    try {
      const payload = { ...data, kop_surat: kopSurat, kwitansi, foto_kavling: fotoKavling, svg_content: svgContent };
      if (editTarget) {
        await api.put(`/lokasi-kavling/${editTarget.id}`, payload);
        addToast("Lokasi kavling diperbarui", "success");
      } else {
        await api.post("/lokasi-kavling", payload);
        addToast("Lokasi kavling ditambahkan", "success");
      }
      setFormOpen(false);
      fetchAll();
    } catch {
      addToast("Gagal menyimpan lokasi kavling", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/lokasi-kavling/${deleteTarget.id}`);
      addToast("Lokasi dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus lokasi", "error");
    }
  }

  const columns = [
    {
      key: "nama",
      header: "Nama Kavling",
      render: (l: LokasiKavling) => (
        <div>
          <p className="font-semibold text-gray-800">{l.nama}</p>
          <p className="text-xs text-gray-500">{l.nama_perusahaan}</p>
        </div>
      ),
    },
    { key: "alamat", header: "Alamat Kavling" },
    {
      key: "jumlah_kavling",
      header: "Jumlah",
      render: (l: LokasiKavling) => (
        <span className="font-medium text-gray-800">{l.jumlah_kavling}</span>
      ),
    },
    {
      key: "svg_content",
      header: "Denah SVG",
      render: (l: LokasiKavling) =>
        l.svg_content ? (
          <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
            <Code className="h-3 w-3" /> Tersedia
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: "detail",
      header: "Detail",
      render: () => (
        <Button size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-white border-0 font-medium">
          Detail Kavling
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Data Lokasi Kavling</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4" /> Reload
          </Button>
          <Button size="sm" onClick={() => openForm()}>
            <Plus className="h-4 w-4" /> Tambah Lokasi Kavling
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <DataTable
          columns={columns}
          data={lokasis}
          emptyText="Belum ada data lokasi kavling"
          actions={(l) => (
            <>
              <Button size="sm" variant="outline" onClick={() => openForm(l)} className="border-blue-300 text-blue-600 hover:bg-blue-50">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(l)}>
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
        title={editTarget ? "Edit Lokasi Kavling" : "Tambah Lokasi Kavling"}
        size="xl"
        headerVariant="primary"
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>Batal</Button>
            <Button type="submit" form="form-lokasi" disabled={formLoading}>
              {formLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <form id="form-lokasi" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Informasi Lokasi */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Informasi Lokasi</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nama Lokasi Kavling" placeholder="Contoh: Punten Regency"
                {...register("nama", { required: "Wajib diisi" })} error={errors.nama?.message} />
              <Input label="Nama Singkat" placeholder="Contoh: PR"
                {...register("nama_singkat", { required: "Wajib diisi" })} error={errors.nama_singkat?.message} />
              <div className="md:col-span-2">
                <Input label="Header" placeholder="Contoh: KAVLING PUNTEN REGENCY" {...register("header")} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Kavling</label>
                <textarea rows={2} placeholder="Masukkan alamat kavling"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register("alamat", { required: "Wajib diisi" })} />
                {errors.alamat && <p className="text-xs text-red-500 mt-1">{errors.alamat.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4 md:col-span-2">
                <Input label="Jenis Pembelian" placeholder="-" {...register("jenis_pembelian")} />
                <Input label="Urutan Lokasi" type="number" {...register("urutan_lokasi", { valueAsNumber: true })} />
              </div>
            </div>
          </div>

          {/* Informasi Perusahaan */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Informasi Perusahaan</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nama Perusahaan" placeholder="Contoh: PT. BERKAH KAVLING NUSANTARA" {...register("nama_perusahaan")} />
              <Input label="Nama Admin" placeholder="Nama admin penanggung jawab" {...register("nama_admin")} />
              <Input label="Nama Mengetahui" placeholder="Jabatan yang mengetahui" {...register("nama_mengetahui")} />
              <Input label="Telp Perusahaan" placeholder="Contoh: (0341) 555-0001" {...register("telp_perusahaan")} />
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Perusahaan</label>
                <textarea rows={2} placeholder="Masukkan alamat perusahaan"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register("alamat_perusahaan")} />
              </div>
            </div>
          </div>

          {/* Penandatangan */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Penandatangan</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Kota Penandatangan" placeholder="Contoh: Kota Batu" {...register("kota_penandatangan")} />
              <Input label="Nama Penandatangan" placeholder="Nama lengkap" {...register("nama_penandatangan")} />
              <Input label="Jabatan Penandatangan" placeholder="Contoh: Direktur" {...register("jabatan_penandatangan")} />
            </div>
          </div>

          {/* Upload Gambar */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Upload Gambar</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ImageUploadField label="Kop Surat" value={kopSurat} onChange={setKopSurat} />
              <ImageUploadField label="Kwitansi" value={kwitansi} onChange={setKwitansi} />
              <ImageUploadField label="Foto Kavling" value={fotoKavling} onChange={setFotoKavling} />
            </div>
          </div>

          {/* Denah SVG */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Denah SVG</p>
            {/* Tab editor / preview */}
            <div className="flex border-b border-gray-200 mb-3 gap-1">
              {(["editor", "preview"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSvgTab(t)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-t border-b-2 transition-colors ${
                    svgTab === t
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t === "editor" ? "Editor SVG" : "Preview Denah"}
                </button>
              ))}
            </div>

            {svgTab === "editor" ? (
              <div>
                <textarea
                  rows={10}
                  value={svgContent}
                  onChange={(e) => setSvgContent(e.target.value)}
                  placeholder="Paste konten SVG denah di sini..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  spellCheck={false}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Paste atau ketik konten SVG denah. Setiap kavling harus memiliki atribut <code className="bg-gray-100 px-1 rounded">id</code> sesuai kode kavling (contoh: <code className="bg-gray-100 px-1 rounded">id=&quot;A-1&quot;</code>).
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-gray-200 bg-[#ede9e0] overflow-hidden" style={{ minHeight: 200 }}>
                {svgContent ? (
                  <div
                    className="w-full overflow-auto"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
                    Belum ada konten SVG
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Lokasi Kavling"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Yakin ingin menghapus lokasi <strong>{deleteTarget?.nama}</strong>?
        </p>
      </Modal>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
