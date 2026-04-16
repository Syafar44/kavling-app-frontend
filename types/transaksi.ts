export interface Booking {
  id: number;
  no_booking: string;
  id_kavling: number;
  id_customer: number;
  id_marketing?: number;
  nominal_booking: number;
  tgl_booking: string;
  tgl_expired?: string;
  keterangan?: string;
  status: number; // 1=aktif, 2=converted, 0=cancelled
  kavling?: { id: number; kode_kavling: string };
  customer?: { nama: string };
  marketing?: { nama: string };
  created_at?: string;
}

export interface BookingFormData {
  id_kavling: number;
  id_customer: number;
  id_marketing?: number;
  nominal_booking: number;
  tgl_expired: string;
  keterangan?: string;
}

export interface TransaksiKavling {
  id: number;
  no_transaksi: string;
  id_kavling: number;
  id_customer: number;
  id_marketing?: number;
  id_booking?: number;
  jenis_pembelian: number; // 2=CASH, 3=KREDIT
  harga_jual: number;
  uang_muka: number;
  lama_cicilan: number;
  cicilan_per_bulan: number;
  tgl_transaksi: string;
  tgl_mulai_cicilan?: string;
  keterangan?: string;
  jumlah_cicilan_terbayar?: number;
  total_terbayar?: number;
  kavling?: { kode_kavling: string };
  customer?: { nama: string };
  marketing?: { nama: string };
  created_at?: string;
}

export interface CashFormData {
  id_kavling: number;
  id_customer: number;
  id_marketing?: number;
  harga_jual: number;
  keterangan?: string;
}

export interface KreditFormData {
  id_kavling: number;
  id_customer: number;
  id_marketing?: number;
  harga_jual: number;
  uang_muka: number;
  lama_cicilan: number;
  tgl_mulai_cicilan: string;
  keterangan?: string;
}

export interface ConvertInput {
  jenis: "cash" | "kredit";
  harga_jual: number;
  uang_muka?: number;
  lama_cicilan?: number;
  tgl_mulai_cicilan?: string;
  keterangan?: string;
}

export interface Pembayaran {
  id: number;
  id_transaksi: number;
  id_kavling: number;
  pembayaran_ke: number;
  tanggal: string;
  jumlah_bayar: number;
  id_bank?: number;
  bukti_pembayaran?: string;
  keterangan?: string;
  created_at?: string;
}

export interface PembayaranFormData {
  tanggal: string;
  jumlah_bayar: number;
  keterangan?: string;
}
