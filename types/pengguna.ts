export interface Pengguna {
  id: number;
  username: string;
  nama: string;
  is_admin: 0 | 1;
  status: "AKTIF" | "BLOKIR";
  created_at?: string;
}

export interface PenggunaFormData {
  username: string;
  nama: string;
  password?: string;
  is_admin: 0 | 1;
  status: "AKTIF" | "BLOKIR";
}

export interface Menu {
  id: number;
  nama: string;
  icon: string;
  url: string;
  urutan: number;
  parent_id: number | null;
}

export interface HakAkses {
  id: number;
  id_user: number;
  id_menu: number;
  status_hak: number;
  menu: Menu;
}

export interface LogAktivitas {
  id: number;
  id_user: number | null;
  aksi: string;
  keterangan: string;
  ip_address: string;
  created_at: string;
  user?: { id: number; username: string; nama: string };
}
