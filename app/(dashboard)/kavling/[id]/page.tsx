"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { useDenahKavling } from "@/hooks/useDenahKavling";
import { useKavling } from "@/hooks/useKavling";
import { useToast } from "@/hooks/useToast";
import { PetaInteraktif } from "@/components/kavling/PetaInteraktif";
import { FormKavling } from "@/components/kavling/FormKavling";
import { DataTable } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ToastContainer } from "@/components/ui/Toast";
import type { DenahKavling, Kavling, KavlingFormData } from "@/types/kavling";
import { KAVLING_STATUS_LABEL } from "@/types/kavling";
import { formatRupiah } from "@/lib/utils";
import type { AxiosError } from "axios";
import type { ApiResponse } from "@/types/api";

import { FormBooking } from "@/components/transaksi/FormBooking";
import { FormCash } from "@/components/transaksi/FormCash";
import { FormKredit } from "@/components/transaksi/FormKredit";
import { FormKonversi } from "@/components/transaksi/FormKonversi";

const STATUS_BADGE: Record<number, { label: string; variant: "success" | "warning" | "info" | "danger" }> = {
  0: { label: "Kosong", variant: "success" },
  1: { label: "Booking", variant: "warning" },
  2: { label: "Cash", variant: "info" },
  3: { label: "Kredit", variant: "danger" },
};

export default function DenahKavlingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const denahId = Number(params.id);

  const { fetchDenahKavling } = useDenahKavling();
  const { updateKavling } = useKavling();
  const { toasts, addToast, removeToast } = useToast();

  const [denah, setDenah] = useState<DenahKavling | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [editTarget, setEditTarget] = useState<Kavling | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [bookingKavling, setBookingKavling] = useState<Kavling | null>(null);
  const [cashKavling, setCashKavling] = useState<Kavling | null>(null);
  const [kreditKavling, setKreditKavling] = useState<Kavling | null>(null);
  const [konversiKavling, setKonversiKavling] = useState<Kavling | null>(null);

  const loadDenah = useCallback(async () => {
    setPageLoading(true);
    try {
      const data = await fetchDenahKavling(denahId);
      setDenah(data);
    } catch {
      addToast("Gagal memuat data denah kavling", "error");
    } finally {
      setPageLoading(false);
    }
  }, [denahId, fetchDenahKavling, addToast]);

  useEffect(() => {
    loadDenah();
  }, [loadDenah]);

  async function handleEditSubmit(data: KavlingFormData) {
    if (!editTarget) return;
    setFormLoading(true);
    try {
      const updated = await updateKavling(editTarget.id, data);
      setDenah((prev) =>
        prev && prev.kavlings
          ? {
              ...prev,
              kavlings: prev.kavlings.map((k) =>
                k.id === updated.id ? updated : k
              ),
            }
          : prev
      );
      addToast("Kavling berhasil diperbarui", "success");
      setFormOpen(false);
    } catch (err) {
      const msg =
        (err as AxiosError<ApiResponse>).response?.data?.message ??
        "Terjadi kesalahan";
      addToast(msg, "error");
    } finally {
      setFormLoading(false);
    }
  }

  function handleTransaksiSuccess(updatedKavling: Kavling) {
    setDenah((prev) =>
      prev && prev.kavlings
        ? {
            ...prev,
            kavlings: prev.kavlings.map((k) =>
              k.id === updatedKavling.id ? updatedKavling : k
            ),
          }
        : prev
    );
  }

  const columns = [
    { key: "kode_kavling", header: "Kode" },
    {
      key: "panjang_kanan",
      header: "P.Kanan (m)",
      render: (k: Kavling) => k.panjang_kanan || "-",
    },
    {
      key: "panjang_kiri",
      header: "P.Kiri (m)",
      render: (k: Kavling) => k.panjang_kiri || "-",
    },
    {
      key: "lebar_depan",
      header: "L.Depan (m)",
      render: (k: Kavling) => k.lebar_depan || "-",
    },
    {
      key: "lebar_belakang",
      header: "L.Belakang (m)",
      render: (k: Kavling) => k.lebar_belakang || "-",
    },
    {
      key: "luas_tanah",
      header: "Luas (m²)",
      render: (k: Kavling) => (k.luas_tanah ? `${k.luas_tanah} m²` : "-"),
    },
    {
      key: "harga_per_meter",
      header: "Harga/m²",
      render: (k: Kavling) =>
        k.harga_per_meter ? formatRupiah(k.harga_per_meter) : "-",
    },
    {
      key: "harga_jual_cash",
      header: "Harga Cash",
      render: (k: Kavling) =>
        k.harga_jual_cash ? formatRupiah(k.harga_jual_cash) : "-",
    },
    {
      key: "status",
      header: "Status",
      render: (k: Kavling) => {
        const s = STATUS_BADGE[k.status];
        return <Badge variant={s.variant}>{s.label}</Badge>;
      },
    },
  ];

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
        Memuat data denah kavling...
      </div>
    );
  }

  if (!denah) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 font-medium">Denah kavling tidak ditemukan</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => router.push("/kavling")}
        >
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/kavling")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{denah.nama}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {denah.kavlings?.length ?? 0} kavling
          </p>
        </div>
      </div>

      {/* Peta Interaktif */}
      <PetaInteraktif
        denahKavling={denah}
        onBooking={setBookingKavling}
        onCash={setCashKavling}
        onKredit={setKreditKavling}
        onKonversi={setKonversiKavling}
        onEdit={(k) => {
          setEditTarget(k);
          setFormOpen(true);
        }}
      />

      {/* Tabel Kavling */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Daftar Kavling
        </h3>
        <DataTable
          columns={columns}
          data={denah.kavlings ?? []}
          loading={false}
          emptyText="Belum ada data kavling"
          actions={(k) => (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditTarget(k);
                setFormOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        />
      </div>

      {/* Form Edit Kavling */}
      <FormKavling
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleEditSubmit}
        initial={editTarget}
        loading={formLoading}
      />

      {/* Transaksi Modals */}
      {bookingKavling && (
        <FormBooking
          open={!!bookingKavling}
          kavling={bookingKavling}
          onClose={() => setBookingKavling(null)}
          onSuccess={(k) => {
            handleTransaksiSuccess(k);
            addToast("Booking berhasil!", "success");
          }}
        />
      )}
      {cashKavling && (
        <FormCash
          open={!!cashKavling}
          kavling={cashKavling}
          onClose={() => setCashKavling(null)}
          onSuccess={(k) => {
            handleTransaksiSuccess(k);
            addToast("Transaksi cash berhasil!", "success");
          }}
        />
      )}
      {kreditKavling && (
        <FormKredit
          open={!!kreditKavling}
          kavling={kreditKavling}
          onClose={() => setKreditKavling(null)}
          onSuccess={(k) => {
            handleTransaksiSuccess(k);
            addToast("Transaksi kredit berhasil!", "success");
          }}
        />
      )}
      {konversiKavling && (
        <FormKonversi
          open={!!konversiKavling}
          kavling={konversiKavling}
          onClose={() => setKonversiKavling(null)}
          onSuccess={(k) => {
            handleTransaksiSuccess(k);
            addToast("Konversi berhasil!", "success");
          }}
        />
      )}

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
