"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type Pengguna = {
  id: number;
  nama_lengkap: string;
  username: string;
  email: string;
  role: string;
  status: "AKTIF" | "NONAKTIF";
};

type FormData = { role: string; nama_lengkap: string; username: string; password: string; email: string; status: string };

const ROLE_OPTIONS = ["Marketing", "Admin", "Super Admin"];
const STATUS_OPTIONS = ["AKTIF", "NONAKTIF"];

const ROLE_STYLE: Record<string, string> = {
  "Marketing":  "bg-cyan-500 text-white",
  "Admin":      "bg-green-600 text-white",
  "Super Admin":"bg-red-500 text-white",
};

const emptyForm = (): FormData => ({ role: "", nama_lengkap: "", username: "", password: "", email: "", status: "AKTIF" });

export default function PenggunaPage() {
  const [list, setList] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Pengguna | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Pengguna | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm());
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Pengguna[]>>("/users");
      setList(res.data.data ?? []);
    } catch {
      addToast("Gagal memuat data pengguna", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openAdd() { setEditTarget(undefined); setForm(emptyForm()); setFormOpen(true); }
  function openEdit(p: Pengguna) {
    setEditTarget(p);
    setForm({ role: p.role, nama_lengkap: p.nama_lengkap, username: p.username, password: "", email: p.email, status: p.status });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.nama_lengkap || !form.username || !form.role) {
      addToast("Role, Nama Lengkap, dan Username wajib diisi", "error");
      return;
    }
    if (!editTarget && !form.password) {
      addToast("Password wajib diisi untuk pengguna baru", "error");
      return;
    }
    setFormLoading(true);
    try {
      if (editTarget) {
        const payload: Record<string, unknown> = {
          nama_lengkap: form.nama_lengkap,
          email: form.email,
          role: form.role,
          status: form.status,
        };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${editTarget.id}`, payload);
        addToast("Pengguna diperbarui", "success");
      } else {
        await api.post("/users", {
          username: form.username,
          password: form.password,
          nama_lengkap: form.nama_lengkap,
          email: form.email,
          role: form.role,
        });
        addToast("Pengguna berhasil ditambahkan", "success");
      }
      setFormOpen(false);
      fetchAll();
    } catch {
      addToast("Gagal menyimpan data pengguna", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      addToast("Pengguna dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus pengguna", "error");
    }
  }

  const columns = [
    { key: "nama_lengkap", header: "Nama Lengkap" },
    { key: "username",     header: "Username" },
    { key: "email",        header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (r: Pengguna) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${ROLE_STYLE[r.role] ?? "bg-gray-200 text-gray-700"}`}>{r.role}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r: Pengguna) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${r.status === "AKTIF" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{r.status}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Pengaturan Pengguna</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4" /> Reload
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Tambah Pengguna
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {loading && (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        )}
        <DataTable
          columns={columns}
          data={loading ? [] : list}
          emptyText="Belum ada pengguna"
          actions={(p) => (
            <>
              <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="border-blue-300 text-blue-600 hover:bg-blue-50">Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(p)}>Hapus</Button>
            </>
          )}
        />
      </div>

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title="Form Data Pengguna"
        headerVariant="primary"
        footer={
          <>
            <Button variant="destructive" onClick={() => setFormOpen(false)} disabled={formLoading}>Batal</Button>
            <Button onClick={handleSave} disabled={formLoading}>{formLoading ? "Menyimpan..." : "Simpan"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            {editTarget ? (
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : (
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Pilih Role</option>
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input type="text" value={form.nama_lengkap} onChange={(e) => setForm((f) => ({ ...f, nama_lengkap: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              {editTarget ? (
                <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700">{form.username}</div>
              ) : (
                <input type="text" value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {editTarget && <span className="text-gray-400 font-normal">(kosongkan jika tidak diganti)</span>}
              </label>
              <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status Pengguna</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message="Apakah Anda yakin?"
        description="Pengguna ini akan dihapus secara permanen!"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
