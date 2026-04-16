"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Kavling, KavlingFormData } from "@/types/kavling";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

interface FormKavlingProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: KavlingFormData) => Promise<void>;
  initial?: Kavling;
  loading?: boolean;
}

const defaultValues: KavlingFormData = {
  panjang_kanan: 0,
  panjang_kiri: 0,
  lebar_depan: 0,
  lebar_belakang: 0,
  luas_tanah: 0,
  harga_per_meter: 0,
  harga_jual_cash: 0,
  status: 0,
};

export function FormKavling({
  open,
  onClose,
  onSubmit,
  initial,
  loading,
}: FormKavlingProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<KavlingFormData>({
    defaultValues: initial
      ? {
          panjang_kanan: initial.panjang_kanan,
          panjang_kiri: initial.panjang_kiri,
          lebar_depan: initial.lebar_depan,
          lebar_belakang: initial.lebar_belakang,
          luas_tanah: initial.luas_tanah,
          harga_per_meter: initial.harga_per_meter,
          harga_jual_cash: initial.harga_jual_cash,
          status: initial.status,
        }
      : defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(
        initial
          ? {
              panjang_kanan: initial.panjang_kanan,
              panjang_kiri: initial.panjang_kiri,
              lebar_depan: initial.lebar_depan,
              lebar_belakang: initial.lebar_belakang,
              luas_tanah: initial.luas_tanah,
              harga_per_meter: initial.harga_per_meter,
              harga_jual_cash: initial.harga_jual_cash,
              status: initial.status,
            }
          : defaultValues
      );
    }
  }, [open, initial, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Edit Kavling${initial ? ` — ${initial.kode_kavling}` : ""}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" form="form-kavling" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </>
      }
    >
      <form
        id="form-kavling"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {initial && (
          <div className="rounded-md bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-500">
            Kode Kavling: <span className="font-semibold text-gray-700">{initial.kode_kavling}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Panjang Kanan (m)"
            type="number"
            step="0.01"
            {...register("panjang_kanan", {
              valueAsNumber: true,
              min: { value: 0, message: "Minimal 0" },
            })}
            error={errors.panjang_kanan?.message}
          />
          <Input
            label="Panjang Kiri (m)"
            type="number"
            step="0.01"
            {...register("panjang_kiri", {
              valueAsNumber: true,
              min: { value: 0, message: "Minimal 0" },
            })}
            error={errors.panjang_kiri?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Lebar Depan (m)"
            type="number"
            step="0.01"
            {...register("lebar_depan", {
              valueAsNumber: true,
              min: { value: 0, message: "Minimal 0" },
            })}
            error={errors.lebar_depan?.message}
          />
          <Input
            label="Lebar Belakang (m)"
            type="number"
            step="0.01"
            {...register("lebar_belakang", {
              valueAsNumber: true,
              min: { value: 0, message: "Minimal 0" },
            })}
            error={errors.lebar_belakang?.message}
          />
        </div>

        <Input
          label="Luas Tanah (m²)"
          type="number"
          step="0.01"
          {...register("luas_tanah", {
            valueAsNumber: true,
            min: { value: 0, message: "Minimal 0" },
          })}
          error={errors.luas_tanah?.message}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Harga per m² (Rp)"
            type="number"
            {...register("harga_per_meter", {
              valueAsNumber: true,
              min: { value: 0, message: "Minimal 0" },
            })}
            error={errors.harga_per_meter?.message}
          />
          <Input
            label="Harga Jual Cash (Rp)"
            type="number"
            {...register("harga_jual_cash", {
              valueAsNumber: true,
              min: { value: 0, message: "Minimal 0" },
            })}
            error={errors.harga_jual_cash?.message}
          />
        </div>

        <Select
          label="Status"
          {...register("status", { valueAsNumber: true })}
          options={[
            { value: 0, label: "Kosong" },
            { value: 1, label: "Booking" },
            { value: 2, label: "Cash" },
            { value: 3, label: "Kredit" },
          ]}
        />
      </form>
    </Modal>
  );
}
