"use client";

import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import api from "@/lib/api";

type ResetItem = {
  key: string;
  label: string;
  description: string;
  tables: string;
};

const RESET_ITEMS: ResetItem[] = [
  {
    key: "pembayaran",
    label: "Pembayaran",
    description: "Hapus semua data pembayaran",
    tables: "pembayaran",
  },
  {
    key: "transaksi",
    label: "Transaksi",
    description: "Hapus semua data transaksi kavling, booking, dan pembayaran",
    tables: "pembayaran, transaksi_kavling, transaksi_booking",
  },
  {
    key: "keuangan",
    label: "Keuangan",
    description: "Hapus semua data transaksi keuangan",
    tables: "transaksi",
  },
  {
    key: "kavling",
    label: "Kavling",
    description: "Hapus semua data kavling, denah, transaksi, dan pembayaran",
    tables: "pembayaran, transaksi_kavling, transaksi_booking, kavling_peta, denah_kavling",
  },
  {
    key: "customer",
    label: "Customer",
    description: "Hapus semua data customer beserta transaksi dan pembayaran terkait",
    tables: "pembayaran, transaksi_kavling, transaksi_booking, customer",
  },
  {
    key: "marketing",
    label: "Marketing",
    description: "Hapus semua data marketing beserta transaksi dan pembayaran terkait",
    tables: "pembayaran, transaksi_kavling, transaksi_booking, marketing",
  },
];

export default function ResetDataPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  function toggleItem(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === RESET_ITEMS.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(RESET_ITEMS.map((i) => i.key)));
    }
  }

  async function handleReset() {
    setLoading(true);
    setConfirmOpen(false);
    try {
      const items = Array.from(selected);
      await api.post("/konfigurasi/reset", { items });
      addToast("Data berhasil direset", "success");
      setSelected(new Set());
    } catch {
      addToast("Gagal mereset data", "error");
    } finally {
      setLoading(false);
    }
  }

  const allSelected = selected.size === RESET_ITEMS.length;
  const someSelected = selected.size > 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Reset Data</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pilih kategori data yang ingin direset. Data yang direset akan dihapus permanen.
        </p>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div className="text-sm text-red-700">
          <span className="font-semibold">Peringatan:</span> Tindakan ini tidak dapat dibatalkan.
          Semua data yang dipilih akan dihapus secara permanen dari database.
        </div>
      </div>

      {/* Item list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Select all row */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
          <input
            type="checkbox"
            id="select-all"
            checked={allSelected}
            onChange={toggleAll}
            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
          />
          <label htmlFor="select-all" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
            Pilih Semua
          </label>
          {someSelected && (
            <span className="ml-auto text-xs text-gray-500">
              {selected.size} dari {RESET_ITEMS.length} dipilih
            </span>
          )}
        </div>

        {/* Items */}
        <div className="divide-y divide-gray-100">
          {RESET_ITEMS.map((item) => {
            const checked = selected.has(item.key);
            return (
              <label
                key={item.key}
                htmlFor={`item-${item.key}`}
                className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors ${
                  checked ? "bg-red-50" : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  id={`item-${item.key}`}
                  checked={checked}
                  onChange={() => toggleItem(item.key)}
                  className="h-4 w-4 mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${checked ? "text-red-700" : "text-gray-800"}`}>
                      {item.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Tabel: <span className="font-mono">{item.tables}</span>
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Action */}
      <div className="flex justify-end">
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={!someSelected || loading}
          className="bg-red-600 hover:bg-red-700 text-white border-0 gap-2"
        >
          <Trash2 className="h-4 w-4" />
          {loading ? "Mereset..." : `Reset ${selected.size > 0 ? `(${selected.size})` : ""} Data`}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleReset}
        message="Apakah Anda yakin ingin mereset data?"
        description={`Data berikut akan dihapus permanen: ${Array.from(selected)
          .map((k) => RESET_ITEMS.find((i) => i.key === k)?.label)
          .join(", ")}. Tindakan ini tidak dapat dibatalkan!`}
        confirmLabel="Ya, Reset Data"
        cancelLabel="Batal"
      />

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
