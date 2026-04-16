export interface Marketing {
  id: number;
  nama: string;
  no_telp: string;
  alamat: string;
  email: string;
  persentase_komisi: number;
  status: number;
  jumlah_open?: number;
  jumlah_closed?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MarketingFormData {
  nama: string;
  no_telp: string;
  alamat: string;
  email: string;
  persentase_komisi: number;
  status: number;
}

export interface KomisiMarketing {
  id: number;
  marketing_id: number;
  tanggal: string;
  kode_kavling: string;
  jenis: string;
  fee: number;
  total: number;
}
