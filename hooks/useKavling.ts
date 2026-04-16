"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import type { Kavling, KavlingFormData } from "@/types/kavling";
import type { ApiResponse } from "@/types/api";

export function useKavling() {
  const [kavlings, setKavlings] = useState<Kavling[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchKavlings = useCallback(async (denahKavlingId?: number) => {
    setLoading(true);
    try {
      const params = denahKavlingId ? { denah_kavling_id: denahKavlingId } : {};
      const res = await api.get<ApiResponse<Kavling[]>>("/kavling", { params });
      setKavlings(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateKavling = useCallback(
    async (id: number, data: KavlingFormData) => {
      const res = await api.put<ApiResponse<Kavling>>(`/kavling/${id}`, data);
      return res.data.data!;
    },
    []
  );

  const deleteKavling = useCallback(async (id: number) => {
    await api.delete(`/kavling/${id}`);
  }, []);

  return {
    kavlings,
    loading,
    fetchKavlings,
    updateKavling,
    deleteKavling,
    setKavlings,
  };
}
