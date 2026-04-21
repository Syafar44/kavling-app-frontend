"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: React.ReactNode;
  headerVariant?: "default" | "primary";
}

const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  footer,
  headerVariant = "default",
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full rounded-lg bg-white shadow-xl focus:outline-none",
            "flex flex-col max-h-[80vh]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            sizeMap[size]
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "flex items-center justify-between px-6 py-4 shrink-0 rounded-t-lg",
              headerVariant === "primary"
                ? "bg-blue-700 text-white border-b border-blue-800"
                : "border-b text-gray-900"
            )}
          >
            <Dialog.Title
              className={cn(
                "text-base font-semibold",
                headerVariant === "primary" ? "text-white" : "text-gray-900"
              )}
            >
              {title}
            </Dialog.Title>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={cn(
                "h-7 w-7",
                headerVariant === "primary" && "text-white hover:bg-blue-600"
              )}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body — scrollable */}
          <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 rounded-b-lg shrink-0">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
