export interface Marketing {
  id: number;
  kode_marketing: string;
  nama: string;
  alamat: string;
  jenis_kelamin: "L" | "P";
  pekerjaan: string;
  no_telp: string;
  foto?: string;
  status: number;
  // legacy / komisi
  email?: string;
  persentase_komisi?: number;
  jumlah_open?: number;
  jumlah_closed?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MarketingFormData {
  nama: string;
  alamat: string;
  jenis_kelamin: "L" | "P";
  pekerjaan: string;
  no_telp: string;
  foto?: string;
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
