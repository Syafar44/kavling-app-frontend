"use client";

import { useEffect, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Download, Search } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { DataTable } from "@/components/ui/DataTable";
import type { ApiResponse } from "@/types/api";
import type { Customer } from "@/types/customer";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { cn } from "@/lib/utils";

type TabType = "umum" | "per_customer" | "per_kategori";

interface LaporanRow {
  id: number;
  no_transaksi: string;
  tanggal: string;
  jenis: string;
  kategori: string;
  keterangan: string;
  nominal: number;
}

interface LaporanResponse {
  transaksi: LaporanRow[];
  pemasukan?: number;
  pengeluaran?: number;
  saldo?: number;
}

const ENDPOINT: Record<TabType, string> = {
  umum: "/laporan/umum",
  per_customer: "/laporan/per-customer",
  per_kategori: "/laporan/per-kategori",
};

export default function LaporanPage() {
  const [tab, setTab] = useState<TabType>("umum");
  const [dari, setDari] = useState("");
  const [sampai, setSampai] = useState("");
  const [idCustomer, setIdCustomer] = useState("");
  const [kategori, setKategori] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [data, setData] = useState<LaporanRow[]>([]);
  const [summary, setSummary] = useState({ pemasukan: 0, pengeluaran: 0, saldo: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<ApiResponse<Customer[]>>("/customers").then((r) => setCustomers(r.data.data ?? []));
  }, []);

  async function fetchLaporan() {
    if (tab === "per_customer" && !idCustomer) {
      alert("Pilih customer terlebih dahulu");
      return;
    }
    if (tab === "per_kategori" && !kategori) {
      alert("Masukkan kategori terlebih dahulu");
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (dari) params.set("dari", dari);
    if (sampai) params.set("sampai", sampai);
    if (tab === "per_customer") params.set("id_customer", idCustomer);
    if (tab === "per_kategori") params.set("kategori", kategori);

    try {
      const res = await api.get<ApiResponse<LaporanResponse>>(`${ENDPOINT[tab]}?${params}`);
      const d = res.data.data;
      setData(d?.transaksi ?? []);
      setSummary({ pemasukan: d?.pemasukan ?? 0, pengeluaran: d?.pengeluaran ?? 0, saldo: d?.saldo ?? 0 });
    } finally {
      setLoading(false);
    }
  }

  async function exportExcel() {
    const params = new URLSearchParams();
    if (dari) params.set("dari", dari);
    if (sampai) params.set("sampai", sampai);
    const res = await api.get(`/laporan/export-excel?${params}`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan-${tab}-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const TABS = [
    { value: "umum", label: "Laporan Umum" },
    { value: "per_customer", label: "Per Customer" },
    { value: "per_kategori", label: "Per Kategori" },
  ];

  const columns = [
    { key: "tanggal", header: "Tanggal", render: (r: LaporanRow) => formatTanggal(r.tanggal) },
    {
      key: "jenis",
      header: "Jenis",
      render: (r: LaporanRow) => (
        <span className={r.jenis === "Pemasukan" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
          {r.jenis}
        </span>
      ),
    },
    { key: "kategori", header: "Kategori" },
    { key: "keterangan", header: "Keterangan" },
    {
      key: "nominal",
      header: "Nominal",
      render: (r: LaporanRow) => (
        <span className={r.jenis === "Pemasukan" ? "text-green-600" : "text-red-600"}>
          {formatRupiah(r.nominal)}
        </span>
      ),
    },
  ];

  return (
    <Tabs.Root value={tab} onValueChange={(v) => { setTab(v as TabType); setData([]); setSummary({ pemasukan: 0, pengeluaran: 0, saldo: 0 }); }}>
      <div className="space-y-4">
        <Tabs.List className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1 w-fit">
          {TABS.map((t) => (
            <Tabs.Trigger
              key={t.value}
              value={t.value}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                "data-[state=active]:bg-blue-600 data-[state=active]:text-white",
                "data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:bg-gray-50"
              )}
            >
              {t.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
          <Input label="Dari" type="date" value={dari} onChange={(e) => setDari(e.target.value)} className="w-40" />
          <Input label="Sampai" type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} className="w-40" />
          {tab === "per_customer" && (
            <Select
              label="Customer"
              value={idCustomer}
              onChange={(e) => setIdCustomer(e.target.value)}
              options={customers.map((c) => ({ value: c.id, label: c.nama }))}
              placeholder="Semua Customer"
              className="w-52"
            />
          )}
          {tab === "per_kategori" && (
            <Input
              label="Kategori"
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              placeholder="Contoh: Bayar Angsuran"
              className="w-52"
            />
          )}
          <Button size="sm" onClick={fetchLaporan}>
            <Search className="h-4 w-4 mr-1" />
            Tampilkan
          </Button>
          <Button size="sm" variant="success" onClick={exportExcel} disabled={data.length === 0}>
            <Download className="h-4 w-4 mr-1" />
            Export Excel
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          {TABS.map((t) => (
            <Tabs.Content key={t.value} value={t.value}>
              <DataTable
                columns={columns}
                data={data}
                loading={loading}
                searchable={false}
                emptyText="Klik 'Tampilkan' untuk memuat data"
              />
              {data.length > 0 && tab === "umum" && (
                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-gray-500">Total Pemasukan</p>
                    <p className="font-semibold text-green-600">{formatRupiah(summary.pemasukan)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Total Pengeluaran</p>
                    <p className="font-semibold text-red-600">{formatRupiah(summary.pengeluaran)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500">Saldo</p>
                    <p className={`font-semibold ${summary.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatRupiah(summary.saldo)}
                    </p>
                  </div>
                </div>
              )}
            </Tabs.Content>
          ))}
        </div>
      </div>
    </Tabs.Root>
  );
}
