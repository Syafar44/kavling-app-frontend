import Cookies from "js-cookie";
import type { User } from "@/types/auth";

const TOKEN_KEY = "token";
const USER_KEY = "user";

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function setToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: "strict" });
}

export function removeToken(): void {
  Cookies.remove(TOKEN_KEY);
}

export function getUser(): User | null {
  const userStr = Cookies.get(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  Cookies.set(USER_KEY, JSON.stringify(user), {
    expires: 7,
    sameSite: "strict",
  });
}

export function removeUser(): void {
  Cookies.remove(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  removeToken();
  removeUser();
}
