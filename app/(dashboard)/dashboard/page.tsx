"use client";

import { useEffect, useState } from "react";
import {
  Map,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Landmark,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { DenahKavling } from "@/types/kavling";
import type { RekapKredit } from "@/types/keuangan";
import type { Booking } from "@/types/transaksi";

interface MonthStat {
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

  const [totalKavling, setTotalKavling] = useState(0);
  const [kosong, setKosong] = useState(0);
  const [booking, setBooking] = useState(0);
  const [kredit, setKredit] = useState(0);
  const [cash, setCash] = useState(0);
  const [tunggakan, setTunggakan] = useState(0);
  const [monthStats, setMonthStats] = useState<MonthStat[]>([]);
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    async function load() {
      try {
        const [denahRes, bookingRes, rekapRes, statRes] = await Promise.all([
          api.get<ApiResponse<DenahKavling[]>>("/denah-kavling"),
          api.get<ApiResponse<Booking[]>>("/booking"),
          api.get<ApiResponse<RekapKredit[]>>("/keuangan/rekap-kredit"),
          api.get<ApiResponse<MonthStat[]>>(`/statistik?year=${new Date().getFullYear()}`),
        ]);

        const denahs = denahRes.data.data ?? [];
        const tot = denahs.reduce((s, d) => s + (d.jumlah_kavling ?? 0), 0);
        const kos = denahs.reduce((s, d) => s + (d.jumlah_kosong ?? 0), 0);
        const terjual = denahs.reduce((s, d) => s + (d.jumlah_terjual ?? 0), 0);

        const bk = (bookingRes.data.data ?? []).length;
        const kr = (rekapRes.data.data ?? []).length;
        const tng = (rekapRes.data.data ?? []).filter((r) => r.tunggakan > 0).length;
        const cs = Math.max(0, terjual - bk - kr);

        setTotalKavling(tot);
        setKosong(kos);
        setBooking(bk);
        setKredit(kr);
        setCash(cs);
        setTunggakan(tng);
        setMonthStats(statRes.data.data ?? []);
      } catch {
        // silently fail — cards show 0
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pemasukanBulanIni = monthStats.find((m) => m.bulan === currentMonth)?.pemasukan ?? 0;
  const maxNominal = Math.max(...monthStats.map((m) => Math.max(m.pemasukan, m.pengeluaran)), 1);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-xl border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Kavling Status */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Status Kavling
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Kavling Kosong"
            value={kosong}
            icon={<Map className="h-5 w-5 text-green-600" />}
            color="bg-green-50"
            subtitle="Tersedia"
          />
          <StatCard
            title="Booking"
            value={booking}
            icon={<Clock className="h-5 w-5 text-yellow-600" />}
            color="bg-yellow-50"
            subtitle="Menunggu konversi"
          />
          <StatCard
            title="Cash"
            value={cash}
            icon={<CheckCircle className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50"
            subtitle="Terjual tunai"
          />
          <StatCard
            title="Kredit"
            value={kredit}
            icon={<Users className="h-5 w-5 text-purple-500" />}
            color="bg-purple-50"
            subtitle="Cicilan aktif"
          />
        </div>
      </div>

      {/* Keuangan */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Keuangan Bulan Ini
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Pemasukan Bulan Ini"
            value={formatRupiah(pemasukanBulanIni)}
            icon={<TrendingUp className="h-5 w-5 text-green-600" />}
            color="bg-green-50"
          />
          <StatCard
            title="Tunggakan Cicilan"
            value={tunggakan}
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
            color="bg-red-50"
            subtitle="Customer terlambat bayar"
          />
          <StatCard
            title="Total Kavling"
            value={totalKavling}
            icon={<Landmark className="h-5 w-5 text-blue-600" />}
            color="bg-blue-50"
            subtitle={`${kosong} kosong · ${totalKavling - kosong} terjual`}
          />
        </div>
      </div>

      {/* Tren Arus Kas */}
      {monthStats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Arus Kas {new Date().getFullYear()}
          </h3>
          <div className="flex items-end gap-1 h-36 mb-2">
            {BULAN.map((label, i) => {
              const bulanNum = i + 1;
              const stat = monthStats.find((s) => s.bulan === bulanNum);
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
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-400 rounded inline-block" /> Pemasukan
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-400 rounded inline-block" /> Pengeluaran
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
