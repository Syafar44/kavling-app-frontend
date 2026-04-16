"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Kavling } from "@/types/kavling";
import type { BookingFormData } from "@/types/transaksi";
import type { Customer } from "@/types/customer";
import type { Marketing } from "@/types/marketing";
import type { ApiResponse } from "@/types/api";
import { formatRupiah } from "@/lib/utils";

interface FormBookingProps {
  open: boolean;
  kavling: Kavling;
  bookingId?: number;
  onClose: () => void;
  onSuccess: (kavling: Kavling) => void;
}

export function FormBooking({ open, kavling, onClose, onSuccess }: FormBookingProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [marketings, setMarketings] = useState<Marketing[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BookingFormData>({
    defaultValues: {
      id_kavling: kavling.id,
      id_customer: "" as unknown as number,
      id_marketing: "" as unknown as number,
      nominal_booking: 0,
      tgl_expired: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({ id_kavling: kavling.id, id_customer: "" as unknown as number, id_marketing: "" as unknown as number, nominal_booking: 0, tgl_expired: "" });
      api.get<ApiResponse<Customer[]>>("/customers").then((r) => setCustomers(r.data.data ?? []));
      api.get<ApiResponse<Marketing[]>>("/marketing").then((r) => setMarketings(r.data.data ?? []));
    }
  }, [open, kavling.id, reset]);

  async function onSubmit(data: BookingFormData) {
    setLoading(true);
    try {
      await api.post("/booking", data);
      // Refetch kavling untuk mendapatkan status terbaru (status 1 = Booking)
      const kavlingRes = await api.get<ApiResponse<Kavling>>(`/kavling/${kavling.id}`);
      onSuccess(kavlingRes.data.data!);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Booking Kavling ${kavling.kode_kavling}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
          <Button type="submit" form="form-booking" variant="warning" disabled={loading}>
            {loading ? "Menyimpan..." : "Booking"}
          </Button>
        </>
      }
    >
      <form id="form-booking" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-yellow-50 rounded-md p-3 text-sm">
          <p><strong>Kavling:</strong> {kavling.kode_kavling}</p>
          <p><strong>Harga Jual:</strong> {formatRupiah(kavling.harga_jual_cash)}</p>
        </div>
        <Select
          label="Customer"
          {...register("id_customer", { required: "Wajib diisi", valueAsNumber: true })}
          options={customers.map((c) => ({ value: c.id, label: c.nama }))}
          placeholder="Pilih customer"
          clearable
          onClear={() => setValue("id_customer", "" as unknown as number, { shouldValidate: true })}
          error={errors.id_customer?.message}
        />
        <Select
          label="Marketing"
          {...register("id_marketing", { required: "Wajib diisi", valueAsNumber: true })}
          options={marketings.map((m) => ({ value: m.id, label: m.nama }))}
          placeholder="Pilih marketing"
          clearable
          onClear={() => setValue("id_marketing", "" as unknown as number, { shouldValidate: true })}
          error={errors.id_marketing?.message}
        />
        <Input
          label="Nominal Booking (Rp)"
          type="number"
          {...register("nominal_booking", { required: "Wajib diisi", valueAsNumber: true, min: { value: 1, message: "Minimal 1" } })}
          error={errors.nominal_booking?.message}
        />
        <Input
          label="Tanggal Expired"
          type="date"
          {...register("tgl_expired", { required: "Wajib diisi" })}
          error={errors.tgl_expired?.message}
        />
        <Input
          label="Keterangan"
          {...register("keterangan")}
          placeholder="Opsional"
        />
      </form>
    </Modal>
  );
}
