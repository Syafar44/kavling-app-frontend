import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number ke format rupiah: Rp 1.000.000 */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

/** Format tanggal ke "dd MMM yyyy" (timezone WITA = UTC+8) */
export function formatTanggal(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "dd MMM yyyy", { locale: id });
  } catch {
    return dateStr;
  }
}

/** Format tanggal ke "dd MMMM yyyy" panjang */
export function formatTanggalPanjang(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, "dd MMMM yyyy", { locale: id });
  } catch {
    return dateStr;
  }
}

/** Format input number dengan separator ribuan */
export function formatNumberInput(value: string): string {
  const numeric = value.replace(/\D/g, "");
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Parse string dengan separator ribuan ke number */
export function parseNumberInput(value: string): number {
  return parseInt(value.replace(/\./g, ""), 10) || 0;
}

/** Hitung cicilan per bulan */
export function hitungCicilan(
  hrgJual: number,
  dp: number,
  lamaCicilan: number
): number {
  if (lamaCicilan <= 0) return 0;
  return (hrgJual - dp) / lamaCicilan;
}

/** Get label status cicilan */
export function getStatusCicilanLabel(status: string): string {
  const map: Record<string, string> = {
    lunas: "Lunas",
    terlambat: "Terlambat",
    belum_bayar: "Belum Bayar",
  };
  return map[status] ?? status;
}
