export interface Transaksi {
  id: number;
  no_transaksi: string;
  jenis: string; // "Pemasukan" | "Pengeluaran"
  kategori: string;
  keterangan: string;
  nominal: number;
  id_bank?: number;
  tanggal: string;
  created_at?: string;
}

export interface ArusKasResponse {
  transaksi: Transaksi[];
  pemasukan: number;
  pengeluaran: number;
  saldo: number;
}

export interface TransaksiFormData {
  tanggal: string;
  jenis: string;
  kategori: string;
  nominal: number;
  keterangan: string;
}

export interface RekapKredit {
  id_transaksi: number;
  id_kavling: number;
  id_customer: number;
  kode_kavling: string;
  nama_customer: string;
  harga_jual: number;
  uang_muka: number;
  cicilan_per_bulan: number;
  lama_cicilan: number;
  jumlah_pembayaran: number;
  sisa_angsuran: number;
  bulan_berjalan: number;
  tunggakan: number;
  nominal_tunggakan: number;
  tgl_mulai_cicilan: string;
  status_bulan_ini: string;
}

export interface KonfigurasiSistem {
  id?: number;
  nama_perusahaan: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  nama_ttd: string;
  jabatan_ttd: string;
  logo?: string;
  ttd_digital?: string;
}
