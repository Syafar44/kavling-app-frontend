export interface User {
  id: number;
  username: string;
  nama: string;
  is_admin: 0 | 1;
  status: 0 | 1;
  created_at?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  captcha?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AccessMenu {
  menu_id: number;
  menu_name: string;
  menu_path: string;
  can_access: boolean;
}
