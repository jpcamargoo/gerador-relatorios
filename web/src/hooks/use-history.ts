"use client";

import { useState, useEffect, useCallback } from "react";
import type { AnalysisResult } from "@/lib/api";
import {
  fetchHistory,
  fetchHistoryDetail,
  deleteHistoryItem,
  clearServerHistory,
  type HistoryItem,
} from "@/lib/api";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  label: string;
  records: number;
  insightsCount: number;
}

function mapItem(item: HistoryItem): HistoryEntry {
  return {
    id: item.id,
    timestamp: new Date(item.createdAt).getTime(),
    label: item.label,
    records: item.records,
    insightsCount: item.insightsCount,
  };
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { items } = await fetchHistory(20, 0);
      setEntries(items.map(mapItem));
    } catch {
      // Fallback localStorage (offline)
      try {
        const raw = localStorage.getItem("relatorios-ia-history");
        if (raw) setEntries(JSON.parse(raw));
      } catch { /* ignore */ }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(() => {
    // Análise é salva automaticamente no servidor pelos endpoints
    // Apenas atualiza a lista local
    refresh();
  }, [refresh]);

  const load = useCallback(async (id: string): Promise<AnalysisResult | null> => {
    try {
      const detail = await fetchHistoryDetail(id);
      return detail.result;
    } catch {
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteHistoryItem(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // Fallback: remover localmente
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  }, []);

  const clear = useCallback(async () => {
    try {
      await clearServerHistory();
      setEntries([]);
    } catch {
      setEntries([]);
    }
  }, []);

  return { entries, loading, save, load, remove, clear, refresh };
}
