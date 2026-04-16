"use client";

import { useState, useCallback } from "react";
import api from "@/lib/api";
import type { DenahKavling, DenahKavlingFormData } from "@/types/kavling";
import type { ApiResponse } from "@/types/api";

export function useDenahKavling() {
  const [denahKavlings, setDenahKavlings] = useState<DenahKavling[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDenahKavlings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse<DenahKavling[]>>("/denah-kavling");
      setDenahKavlings(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDenahKavling = useCallback(async (id: number) => {
    const res = await api.get<ApiResponse<DenahKavling>>(`/denah-kavling/${id}`);
    return res.data.data!;
  }, []);

  const createDenahKavling = useCallback(async (data: DenahKavlingFormData) => {
    const res = await api.post<ApiResponse<DenahKavling>>("/denah-kavling", data);
    return res.data.data!;
  }, []);

  const deleteDenahKavling = useCallback(async (id: number) => {
    await api.delete(`/denah-kavling/${id}`);
  }, []);

  return {
    denahKavlings,
    loading,
    fetchDenahKavlings,
    fetchDenahKavling,
    createDenahKavling,
    deleteDenahKavling,
    setDenahKavlings,
  };
}
