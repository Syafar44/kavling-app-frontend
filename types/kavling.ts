export type KavlingStatus = 0 | 1 | 2 | 3; // 0=Kosong, 1=Booking, 2=Cash, 3=Kredit

export interface Kavling {
  id: number;
  denah_kavling_id: number;
  kode_kavling: string;
  kode_map: string;
  panjang_kanan: number;
  panjang_kiri: number;
  lebar_depan: number;
  lebar_belakang: number;
  luas_tanah: number;
  harga_per_meter: number;
  harga_jual_cash: number;
  status: KavlingStatus;
  created_at?: string;
  updated_at?: string;
}

export interface KavlingFormData {
  panjang_kanan: number;
  panjang_kiri: number;
  lebar_depan: number;
  lebar_belakang: number;
  luas_tanah: number;
  harga_per_meter: number;
  harga_jual_cash: number;
  status: KavlingStatus;
}

export interface DenahKavling {
  id: number;
  nama: string;
  svg_content?: string;
  viewbox: string;
  kavlings?: Kavling[];
  jumlah_kavling?: number;
  jumlah_kosong?: number;
  jumlah_terjual?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DenahKavlingFormData {
  nama: string;
  svg_content: string;
}

export const KAVLING_STATUS_LABEL: Record<KavlingStatus, string> = {
  0: "Kosong",
  1: "Booking",
  2: "Cash",
  3: "Kredit",
};

export const KAVLING_STATUS_COLOR: Record<KavlingStatus, string> = {
  0: "#22c55e", // green-500
  1: "#eab308", // yellow-500
  2: "#3b82f6", // blue-500
  3: "#ef4444", // red-500
};
