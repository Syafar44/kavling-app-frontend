export interface Customer {
  id: number;
  nama: string;
  no_ktp: string;
  no_telp: string;
  alamat: string;
  pekerjaan: string;
  foto_ktp?: string;
  foto_kk?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerFormData {
  nama: string;
  no_ktp: string;
  no_telp: string;
  alamat: string;
  pekerjaan: string;
  foto_ktp?: File;
  foto_kk?: File;
}
