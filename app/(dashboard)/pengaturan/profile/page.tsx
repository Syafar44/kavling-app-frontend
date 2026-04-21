"use client";

import { useState } from "react";
import { Building2, Save, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function PengaturanProfilePage() {
  const [form, setForm] = useState({
    nama_perusahaan: "PT. Kavling Makmur Sentosa",
    alamat: "Jl. Perintis Kemerdekaan KM.15, Makassar",
    telepon: "(0411) 555-1234",
    email: "info@kavlingapp.id",
    website: "www.kavlingapp.id",
    npwp: "12.345.678.9-012.345",
    deskripsi: "Developer kavling dan properti terpercaya di Sulawesi Selatan.",
  });

  return (
    <div className="max-w-3xl space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-20 w-20 rounded-lg bg-blue-50 flex items-center justify-center">
            <Building2 className="h-10 w-10 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Logo Perusahaan</p>
            <p className="text-xs text-gray-500 mb-2">PNG, JPG · maks 2 MB</p>
            <Button variant="outline" size="sm">
              <ImageIcon className="h-4 w-4" />
              Upload Logo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nama Perusahaan" value={form.nama_perusahaan} onChange={(v) => setForm({ ...form, nama_perusahaan: v })} />
          <Field label="NPWP" value={form.npwp} onChange={(v) => setForm({ ...form, npwp: v })} />
          <Field label="Telepon" value={form.telepon} onChange={(v) => setForm({ ...form, telepon: v })} />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} />
          <div className="md:col-span-2">
            <Field label="Alamat" value={form.alamat} onChange={(v) => setForm({ ...form, alamat: v })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button>
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
