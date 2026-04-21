"use client";

import { useEffect, useState } from "react";
import { Map, Users, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, Landmark } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

interface Ringkasan {
  total_kavling: number;
  kosong: number;
  hold: number;
  bf: number;
  akad: number;
  lunas: number;
  user_cancel: number;
  jumlah_customer: number;
  jumlah_prospek: number;
  jumlah_tunggakan: number;
  nominal_tunggakan: number;
}

interface ArusKasBulan {
  bulan: number;
  pemasukan: number;
  pengeluaran: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);
  const [arusKas, setArusKas] = useState<ArusKasBulan[]>([]);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    async function load() {
      try {
        const [ringRes, arusRes] = await Promise.all([
          api.get<ApiResponse<Ringkasan>>("/beranda/ringkasan"),
          api.get<ApiResponse<ArusKasBulan[]>>(`/beranda/arus-kas?tahun=${currentYear}`),
        ]);
        setRingkasan(ringRes.data.data ?? null);
        setArusKas(arusRes.data.data ?? []);
      } catch {
        // silently fail — cards show 0
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentYear]);

  const pemasukanBulanIni = arusKas.find((m) => m.bulan === currentMonth)?.pemasukan ?? 0;
  const maxNominal = Math.max(...arusKas.map((m) => Math.max(m.pemasukan, m.pengeluaran)), 1);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-xl border animate-pulse" />
        ))}
      </div>
    );
  }

  const r = ringkasan;

  return (
    <div className="space-y-6">
      {/* Kavling Status */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Status Kavling</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Kavling Kosong" value={r?.kosong ?? 0} icon={<Map className="h-5 w-5 text-green-600" />} color="bg-green-50" subtitle="Tersedia" />
          <StatCard title="HOLD / BF" value={(r?.hold ?? 0) + (r?.bf ?? 0)} icon={<Clock className="h-5 w-5 text-yellow-600" />} color="bg-yellow-50" subtitle="Dalam proses" />
          <StatCard title="AKAD" value={r?.akad ?? 0} icon={<CheckCircle className="h-5 w-5 text-blue-600" />} color="bg-blue-50" subtitle="Sudah akad" />
          <StatCard title="LUNAS" value={r?.lunas ?? 0} icon={<Users className="h-5 w-5 text-purple-500" />} color="bg-purple-50" subtitle="Sudah lunas" />
        </div>
      </div>

      {/* Keuangan & Customer */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Ringkasan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Pemasukan Bulan Ini" value={formatRupiah(pemasukanBulanIni)} icon={<TrendingUp className="h-5 w-5 text-green-600" />} color="bg-green-50" />
          <StatCard
            title="Tunggakan Cicilan"
            value={r?.jumlah_tunggakan ?? 0}
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            color="bg-red-50"
            subtitle={r?.nominal_tunggakan ? formatRupiah(r.nominal_tunggakan) : "Tidak ada"}
          />
          <StatCard
            title="Total Kavling"
            value={r?.total_kavling ?? 0}
            icon={<Landmark className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50"
            subtitle={`${r?.kosong ?? 0} kosong · ${(r?.total_kavling ?? 0) - (r?.kosong ?? 0)} terjual`}
          />
        </div>
      </div>

      {/* Customer & Prospek */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Customer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard title="Total Customer" value={r?.jumlah_customer ?? 0} icon={<Users className="h-5 w-5 text-blue-600" />} color="bg-blue-50" subtitle="Customer aktif" />
          <StatCard title="Total Prospek" value={r?.jumlah_prospek ?? 0} icon={<DollarSign className="h-5 w-5 text-orange-500" />} color="bg-orange-50" subtitle="Calon customer" />
        </div>
      </div>

      {/* Tren Arus Kas */}
      {arusKas.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Arus Kas {currentYear}</h3>
          <div className="flex items-end gap-1 h-36 mb-2">
            {BULAN.map((label, i) => {
              const bulanNum = i + 1;
              const stat = arusKas.find((s) => s.bulan === bulanNum);
              const pem = stat?.pemasukan ?? 0;
              const pen = stat?.pengeluaran ?? 0;
              const isCurrentMonth = bulanNum === currentMonth;
              return (
                <div key={bulanNum} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex gap-0.5 items-end" style={{ height: "120px" }}>
                    <div
                      className={`flex-1 rounded-t ${isCurrentMonth ? "bg-green-500" : "bg-green-300"}`}
                      style={{ height: `${(pem / maxNominal) * 100}%`, minHeight: pem > 0 ? 2 : 0 }}
                      title={`Pemasukan: ${formatRupiah(pem)}`}
                    />
                    <div
                      className={`flex-1 rounded-t ${isCurrentMonth ? "bg-red-500" : "bg-red-300"}`}
                      style={{ height: `${(pen / maxNominal) * 100}%`, minHeight: pen > 0 ? 2 : 0 }}
                      title={`Pengeluaran: ${formatRupiah(pen)}`}
                    />
                  </div>
                  <span className={`text-xs truncate w-full text-center ${isCurrentMonth ? "text-blue-600 font-semibold" : "text-gray-400"}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded inline-block" /> Pemasukan</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded inline-block" /> Pengeluaran</span>
          </div>
        </div>
      )}
    </div>
  );
}
