"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

type Arsip = {
  id: number;
  tanggal: string;
  nama: string;
  lokasi: string;
  status_progres: string;
  marketing?: { nama: string } | null;
};

const STATUS_VARIANT: Record<Arsip["status_progres"], "success" | "warning" | "danger" | "info"> = {
  Pelunasan:   "success",
  Pembatalan:  "warning",
  "Gagal Bayar": "danger",
  Aktif:       "info",
};

export default function ArsipPage() {
  const [list, setList] = useState<Arsip[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Arsip | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  const fetchAll = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<Arsip[]>>("/customer/arsip");
      setList(res.data.data ?? []);
    } catch {
      addToast("Gagal memuat data arsip", "error");
    }
  }, [addToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/customer/arsip/${deleteTarget.id}`);
      addToast("Data arsip dihapus", "success");
      setDeleteTarget(null);
      fetchAll();
    } catch {
      addToast("Gagal menghapus arsip", "error");
    }
  }

  const columns = [
    { key: "tanggal", header: "Tanggal" },
    { key: "nama",    header: "Nama Nasabah" },
    {
      key: "marketing",
      header: "Marketing",
      render: (r: Arsip) => r.marketing?.nama ?? "—",
    },
    { key: "lokasi",  header: "Lokasi" },
    {
      key: "status_progres",
      header: "Status Progres",
      render: (r: Arsip) => {
        const variant = STATUS_VARIANT[r.status_progres as keyof typeof STATUS_VARIANT] ?? "info";
        return <Badge variant={variant}>{r.status_progres}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Arsip Customer</h1>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="h-4 w-4" />
          Reload
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <DataTable
          columns={columns}
          data={list}
          emptyText="Belum ada data arsip"
          actions={(a) => (
            <>
              <Button
                size="sm"
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDeleteTarget(a)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus
              </Button>
            </>
          )}
        />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message="Apakah Anda yakin?"
        description="Data arsip ini akan dihapus secara permanen!"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
