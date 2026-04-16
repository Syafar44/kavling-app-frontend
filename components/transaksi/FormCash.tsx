"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Kavling } from "@/types/kavling";
import type { CashFormData } from "@/types/transaksi";
import type { Customer } from "@/types/customer";
import type { Marketing } from "@/types/marketing";
import type { ApiResponse } from "@/types/api";
import { formatRupiah } from "@/lib/utils";

interface FormCashProps {
  open: boolean;
  kavling: Kavling;
  bookingId?: number;
  bookingInfo?: { customer: string; marketing: string };
  onClose: () => void;
  onSuccess: (kavling: Kavling) => void;
}

export function FormCash({ open, kavling, bookingId, bookingInfo, onClose, onSuccess }: FormCashProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [marketings, setMarketings] = useState<Marketing[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CashFormData>({
    defaultValues: {
      id_kavling: kavling.id,
      id_customer: "" as unknown as number,
      id_marketing: "" as unknown as number,
      harga_jual: kavling.harga_jual_cash,
    },
  });

  useEffect(() => {
    if (open) {
      reset({ id_kavling: kavling.id, id_customer: "" as unknown as number, id_marketing: "" as unknown as number, harga_jual: kavling.harga_jual_cash });
      api.get<ApiResponse<Customer[]>>("/customers").then((r) => setCustomers(r.data.data ?? []));
      api.get<ApiResponse<Marketing[]>>("/marketing").then((r) => setMarketings(r.data.data ?? []));
    }
  }, [open, kavling.id, kavling.harga_jual_cash, reset]);

  async function onSubmit(data: CashFormData) {
    setLoading(true);
    try {
      if (bookingId) {
        await api.post(`/booking/${bookingId}/convert`, {
          jenis: "cash",
          harga_jual: data.harga_jual,
          keterangan: data.keterangan,
        });
      } else {
        await api.post("/transaksi/cash", data);
      }
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
      title={`Transaksi Cash — ${kavling.kode_kavling}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
          <Button type="submit" form="form-cash" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </>
      }
    >
      <form id="form-cash" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-blue-50 rounded-md p-3 text-sm">
          <p><strong>Kavling:</strong> {kavling.kode_kavling}</p>
          <p><strong>Harga Jual:</strong> {formatRupiah(kavling.harga_jual_cash)}</p>
          {bookingId && <p className="text-blue-600 mt-1">Konversi dari Booking #{bookingId}</p>}
        </div>
        {bookingInfo ? (
          <>
            <Input label="Customer" value={bookingInfo.customer} readOnly className="bg-gray-50 cursor-not-allowed" />
            <Input label="Marketing" value={bookingInfo.marketing || "-"} readOnly className="bg-gray-50 cursor-not-allowed" />
          </>
        ) : (
          <>
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
              {...register("id_marketing", { valueAsNumber: true })}
              options={marketings.map((m) => ({ value: m.id, label: m.nama }))}
              placeholder="Pilih marketing"
              clearable
              onClear={() => setValue("id_marketing", "" as unknown as number)}
            />
          </>
        )}
        <Input
          label="Harga Jual (Rp)"
          type="number"
          readOnly
          {...register("harga_jual", { valueAsNumber: true })}
          className="bg-gray-50 cursor-not-allowed"
        />
      </form>
    </Modal>
  );
}
