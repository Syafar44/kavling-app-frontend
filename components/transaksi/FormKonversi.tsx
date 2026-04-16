"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormCash } from "./FormCash";
import { FormKredit } from "./FormKredit";
import type { Kavling } from "@/types/kavling";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Booking } from "@/types/transaksi";

interface FormKonversiProps {
  open: boolean;
  kavling: Kavling;
  onClose: () => void;
  onSuccess: (kavling: Kavling) => void;
}

export function FormKonversi({ open, kavling, onClose, onSuccess }: FormKonversiProps) {
  const [step, setStep] = useState<"choose" | "cash" | "kredit">("choose");
  const [booking, setBooking] = useState<Booking | undefined>();

  React.useEffect(() => {
    if (open) {
      setStep("choose");
      setBooking(undefined);
      api
        .get<ApiResponse<Booking[]>>("/booking")
        .then((r) => {
          const b = (r.data.data ?? []).find((bk) => bk.id_kavling === kavling.id);
          if (b) setBooking(b);
        })
        .catch(() => {});
    }
  }, [open, kavling.id]);

  if (step === "cash") {
    return (
      <FormCash
        open={open}
        kavling={kavling}
        bookingId={booking?.id}
        bookingInfo={booking ? { customer: booking.customer?.nama ?? "", marketing: booking.marketing?.nama ?? "" } : undefined}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }
  if (step === "kredit") {
    return (
      <FormKredit
        open={open}
        kavling={kavling}
        bookingId={booking?.id}
        bookingInfo={booking ? { customer: booking.customer?.nama ?? "", marketing: booking.marketing?.nama ?? "" } : undefined}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Konversi Booking — ${kavling.kode_kavling}`}
    >
      <p className="text-sm text-gray-600 mb-4">
        Pilih jenis konversi untuk kavling <strong>{kavling.kode_kavling}</strong>:
      </p>
      <div className="flex gap-3">
        <Button className="flex-1" onClick={() => setStep("cash")}>
          Konversi ke Cash
        </Button>
        <Button variant="destructive" className="flex-1" onClick={() => setStep("kredit")}>
          Konversi ke Kredit
        </Button>
      </div>
    </Modal>
  );
}
