"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  message?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
  message = "Apakah Anda yakin?",
  description = "Data ini akan dihapus secara permanen!",
  confirmLabel = "Ya, Hapus",
  cancelLabel = "Batal",
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-xl shadow-2xl focus:outline-none p-8 text-center data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Warning icon */}
          <div className="flex items-center justify-center mb-5">
            <div className="h-16 w-16 rounded-full border-4 border-yellow-400 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-yellow-400" strokeWidth={2.5} />
            </div>
          </div>

          <Dialog.Title className="text-lg font-semibold text-gray-800 mb-1">
            {message}
          </Dialog.Title>
          <p className="text-sm text-gray-500 mb-6">{description}</p>

          <div className="flex justify-center gap-3">
            <Button variant="destructive" onClick={onConfirm} disabled={loading}>
              {loading ? "Menghapus..." : confirmLabel}
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
