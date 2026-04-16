"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  getToken,
  getUser,
  setToken,
  setUser,
  logout as authLogout,
} from "@/lib/auth";
import type { User, LoginRequest, LoginResponse } from "@/types/auth";
import type { ApiResponse } from "@/types/api";

export function useAuth() {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getUser();
    if (storedUser && getToken()) {
      setUserState(storedUser);
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const res = await api.post<ApiResponse<LoginResponse>>(
        "/auth/login",
        credentials
      );
      const { token, user: userData } = res.data.data!;
      setToken(token);
      setUser(userData);
      setUserState(userData);
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    authLogout();
    setUserState(null);
    router.push("/login");
  }, [router]);

  const isAdmin = user?.is_admin === 1;

  return { user, loading, login, logout, isAdmin };
}
