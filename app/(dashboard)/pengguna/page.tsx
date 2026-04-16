"use client";

import React, { useEffect, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import api from "@/lib/api";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import { useForm } from "react-hook-form";
import type { Pengguna, PenggunaFormData, Menu, HakAkses, LogAktivitas } from "@/types/pengguna";
import type { ApiResponse } from "@/types/api";
import { formatTanggal } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function PenggunaPage() {
  const [users, setUsers] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Pengguna | undefined>();
  const [formLoading, setFormLoading] = useState(false);
  const [hakAksesTarget, setHakAksesTarget] = useState<Pengguna | null>(null);
  const [allMenus, setAllMenus] = useState<Menu[]>([]);
  const [checkedMenuIds, setCheckedMenuIds] = useState<Set<number>>(new Set());
  const [logs, setLogs] = useState<LogAktivitas[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PenggunaFormData>();

  useEffect(() => { fetchUsers(); fetchLogs(); }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<Pengguna[]>>("/users");
      setUsers(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogs() {
    setLogsLoading(true);
    try {
      const res = await api.get<ApiResponse<LogAktivitas[]>>("/activity-log");
      setLogs(res.data.data ?? []);
    } finally {
      setLogsLoading(false);
    }
  }

  function openForm(u?: Pengguna) {
    setEditTarget(u);
    reset(u ? { username: u.username, nama: u.nama, is_admin: u.is_admin, status: u.status } : { username: "", nama: "", is_admin: 0, status: "AKTIF" });
    setFormOpen(true);
  }

  async function onSubmit(data: PenggunaFormData) {
    setFormLoading(true);
    try {
      if (editTarget) {
        const res = await api.put<ApiResponse<Pengguna>>(`/users/${editTarget.id}`, data);
        setUsers((prev) => prev.map((u) => u.id === editTarget.id ? res.data.data! : u));
        addToast("Pengguna diperbarui", "success");
      } else {
        const res = await api.post<ApiResponse<Pengguna>>("/users", data);
        setUsers((prev) => [...prev, res.data.data!]);
        addToast("Pengguna ditambahkan", "success");
      }
      setFormOpen(false);
    } catch {
      addToast("Terjadi kesalahan", "error");
    } finally {
      setFormLoading(false);
    }
  }

  async function openHakAkses(u: Pengguna) {
    setHakAksesTarget(u);
    const [menusRes, aksesRes] = await Promise.all([
      api.get<ApiResponse<Menu[]>>("/menu"),
      api.get<ApiResponse<HakAkses[]>>(`/users/${u.id}/access`),
    ]);
    setAllMenus(menusRes.data.data ?? []);
    const ids = new Set((aksesRes.data.data ?? []).map((a) => a.id_menu));
    setCheckedMenuIds(ids);
  }

  function toggleMenu(menuId: number) {
    setCheckedMenuIds((prev) => {
      const next = new Set(prev);
      if (next.has(menuId)) next.delete(menuId);
      else next.add(menuId);
      return next;
    });
  }

  async function saveHakAkses() {
    if (!hakAksesTarget) return;
    try {
      await api.put(`/users/${hakAksesTarget.id}/access`, { menu_ids: Array.from(checkedMenuIds) });
      addToast("Hak akses disimpan", "success");
      setHakAksesTarget(null);
    } catch {
      addToast("Gagal menyimpan", "error");
    }
  }

  const userColumns = [
    { key: "username", header: "Username" },
    { key: "nama", header: "Nama" },
    {
      key: "is_admin",
      header: "Role",
      render: (u: Pengguna) => (
        <Badge variant={u.is_admin === 1 ? "info" : "default"}>
          {u.is_admin === 1 ? "Admin" : "Staff"}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (u: Pengguna) => (
        <Badge variant={u.status === "AKTIF" ? "success" : "danger"}>
          {u.status === "AKTIF" ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
    },
  ];

  const logColumns = [
    { key: "user", header: "User", render: (l: LogAktivitas) => l.user ? `${l.user.nama} (${l.user.username})` : "-" },
    { key: "aksi", header: "Aksi" },
    { key: "keterangan", header: "Keterangan" },
    { key: "ip_address", header: "IP" },
    { key: "created_at", header: "Waktu", render: (l: LogAktivitas) => formatTanggal(l.created_at) },
  ];

  return (
    <Tabs.Root defaultValue="users">
      <div className="space-y-4">
        <Tabs.List className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1 w-fit">
          {[{ value: "users", label: "Pengguna" }, { value: "logs", label: "Log Aktivitas" }].map((t) => (
            <Tabs.Trigger
              key={t.value}
              value={t.value}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                "data-[state=active]:bg-blue-600 data-[state=active]:text-white",
                "data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-50"
              )}
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="users">
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => openForm()}>
                <Plus className="h-4 w-4 mr-1" />
                Tambah Pengguna
              </Button>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <DataTable
                columns={userColumns}
                data={users}
                loading={loading}
                emptyText="Belum ada pengguna"
                actions={(u) => (
                  <>
                    <Button size="sm" variant="outline" onClick={() => openHakAkses(u)} title="Hak Akses">
                      <Shield className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openForm(u)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              />
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="logs">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <DataTable
              columns={logColumns}
              data={logs}
              loading={logsLoading}
              emptyText="Belum ada log aktivitas"
            />
          </div>
        </Tabs.Content>
      </div>

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? "Edit Pengguna" : "Tambah Pengguna"}
        footer={
          <>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>Batal</Button>
            <Button type="submit" form="form-pengguna" disabled={formLoading}>
              {formLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </>
        }
      >
        <form id="form-pengguna" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Username" {...register("username", { required: "Wajib diisi" })} error={errors.username?.message} />
          <Input label="Nama" {...register("nama", { required: "Wajib diisi" })} error={errors.nama?.message} />
          <Input
            label={editTarget ? "Password Baru (kosongkan jika tidak diubah)" : "Password"}
            type="password"
            {...register("password", { required: !editTarget ? "Wajib diisi" : false })}
            error={errors.password?.message}
          />
          <Select
            label="Role"
            {...register("is_admin", { valueAsNumber: true })}
            options={[{ value: 0, label: "Staff" }, { value: 1, label: "Admin" }]}
          />
          <Select
            label="Status"
            {...register("status")}
            options={[{ value: "AKTIF", label: "Aktif" }, { value: "BLOKIR", label: "Nonaktif" }]}
          />
        </form>
      </Modal>

      {/* Hak Akses Modal */}
      <Modal
        open={!!hakAksesTarget}
        onClose={() => setHakAksesTarget(null)}
        title={`Hak Akses — ${hakAksesTarget?.nama}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setHakAksesTarget(null)}>Batal</Button>
            <Button onClick={saveHakAkses}>Simpan</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-x-4">
          {allMenus.map((m) => (
            <label key={m.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={checkedMenuIds.has(m.id)}
                onChange={() => toggleMenu(m.id)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">{m.nama}</span>
              {m.url && <span className="text-xs text-gray-400 truncate">{m.url}</span>}
            </label>
          ))}
        </div>
      </Modal>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </Tabs.Root>
  );
}
