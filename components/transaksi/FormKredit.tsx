"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import api from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Kavling } from "@/types/kavling";
import type { KreditFormData } from "@/types/transaksi";
import type { Customer } from "@/types/customer";
import type { Marketing } from "@/types/marketing";
import type { ApiResponse } from "@/types/api";
import { formatRupiah, hitungCicilan } from "@/lib/utils";

interface FormKreditProps {
  open: boolean;
  kavling: Kavling;
  bookingId?: number;
  bookingInfo?: { customer: string; marketing: string };
  onClose: () => void;
  onSuccess: (kavling: Kavling) => void;
}

export function FormKredit({ open, kavling, bookingId, bookingInfo, onClose, onSuccess }: FormKreditProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [marketings, setMarketings] = useState<Marketing[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<KreditFormData>({
    defaultValues: {
      id_kavling: kavling.id,
      id_customer: "" as unknown as number,
      id_marketing: "" as unknown as number,
      harga_jual: kavling.harga_jual_cash,
      uang_muka: 0,
      lama_cicilan: 12,
    },
  });

  const harga_jual = useWatch({ control, name: "harga_jual" });
  const uang_muka = useWatch({ control, name: "uang_muka" });
  const lama_cicilan = useWatch({ control, name: "lama_cicilan" });
  const cicilan = hitungCicilan(harga_jual || 0, uang_muka || 0, lama_cicilan || 12);

  useEffect(() => {
    if (open) {
      reset({ id_kavling: kavling.id, id_customer: "" as unknown as number, id_marketing: "" as unknown as number, harga_jual: kavling.harga_jual_cash, uang_muka: 0, lama_cicilan: 12 });
      api.get<ApiResponse<Customer[]>>("/customers").then((r) => setCustomers(r.data.data ?? []));
      api.get<ApiResponse<Marketing[]>>("/marketing").then((r) => setMarketings(r.data.data ?? []));
    }
  }, [open, kavling.id, kavling.harga_jual_cash, reset]);

  async function onSubmit(data: KreditFormData) {
    setLoading(true);
    try {
      if (bookingId) {
        await api.post(`/booking/${bookingId}/convert`, {
          jenis: "kredit",
          harga_jual: data.harga_jual,
          uang_muka: data.uang_muka,
          lama_cicilan: data.lama_cicilan,
          tgl_mulai_cicilan: data.tgl_mulai_cicilan,
          keterangan: data.keterangan,
        });
      } else {
        await api.post("/transaksi/kredit", data);
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
      title={`Transaksi Kredit — ${kavling.kode_kavling}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
          <Button type="submit" form="form-kredit" variant="destructive" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </>
      }
    >
      <form id="form-kredit" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-red-50 rounded-md p-3 text-sm">
          <p><strong>Kavling:</strong> {kavling.kode_kavling}</p>
          <p><strong>Harga Jual:</strong> {formatRupiah(kavling.harga_jual_cash)}</p>
          {bookingId && <p className="text-red-600 mt-1">Konversi dari Booking #{bookingId}</p>}
        </div>
        {bookingInfo ? (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Customer" value={bookingInfo.customer} readOnly className="bg-gray-50 cursor-not-allowed" />
            <Input label="Marketing" value={bookingInfo.marketing || "-"} readOnly className="bg-gray-50 cursor-not-allowed" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
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
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Harga Jual (Rp)"
            type="number"
            readOnly
            {...register("harga_jual", { valueAsNumber: true })}
            className="bg-gray-50 cursor-not-allowed"
          />
          <Input
            label="Uang Muka (Rp)"
            type="number"
            {...register("uang_muka", { required: "Wajib diisi", valueAsNumber: true, min: 0 })}
            error={errors.uang_muka?.message}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Lama Cicilan"
            {...register("lama_cicilan", { required: "Wajib diisi", valueAsNumber: true })}
            options={[
              { value: 12, label: "12 Bulan" },
              { value: 24, label: "24 Bulan" },
              { value: 36, label: "36 Bulan" },
              { value: 48, label: "48 Bulan" },
              { value: 60, label: "60 Bulan" },
            ]}
          />
          <Input
            label="Tanggal Mulai Cicilan"
            type="date"
            {...register("tgl_mulai_cicilan", { required: "Wajib diisi" })}
            error={errors.tgl_mulai_cicilan?.message}
          />
        </div>

        <div className="bg-gray-50 rounded-md p-3 text-sm">
          <p className="font-medium text-gray-700">
            Cicilan/Bulan:{" "}
            <span className="text-red-600 font-bold">{formatRupiah(cicilan)}</span>
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            ({formatRupiah(harga_jual || 0)} - {formatRupiah(uang_muka || 0)}) / {lama_cicilan || 12} bulan
          </p>
        </div>
      </form>
    </Modal>
  );
}
