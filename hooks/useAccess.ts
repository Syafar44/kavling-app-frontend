"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ApiResponse } from "@/types/api";
import type { Menu } from "@/types/pengguna";

export function useAccess() {
  const [accessMenus, setAccessMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api
      .get<ApiResponse<Menu[]>>("/menu")
      .then((res) => setAccessMenus(res.data.data ?? []))
      .catch(() => setAccessMenus([]))
      .finally(() => setLoading(false));
  }, []);

  function hasAccess(path: string): boolean {
    return accessMenus.some((m) => m.url === path);
  }

  return { accessMenus, loading, hasAccess };
}
