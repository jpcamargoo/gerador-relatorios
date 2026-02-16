"use client";

import type { HistoryEntry } from "@/hooks/use-history";
import { Clock, X } from "lucide-react";
import clsx from "clsx";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export function HistoryPanel({ entries, onSelect, onRemove, onClear }: HistoryPanelProps) {
  if (!entries.length) return null;

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recentes</span>
        </div>
        <button
          onClick={() => {
            if (window.confirm("Limpar todo o histórico? Esta ação não pode ser desfeita.")) {
              onClear();
            }
          }}
          className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-premium"
        >
          Limpar
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={clsx(
              "group relative shrink-0 rounded-xl border bg-card px-4 py-3 transition-premium",
              "hover:border-foreground/10 hover:shadow-sm"
            )}
          >
            <button
              aria-label={`Remover ${entry.label}`}
              onClick={() => onRemove(entry.id)}
              className="absolute top-1.5 right-1.5 z-10 p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
            <button
              onClick={() => onSelect(entry)}
              className="text-left w-full"
            >
              <p className="text-xs font-medium truncate max-w-[140px]">{entry.label}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] text-muted-foreground tabular-nums">{entry.records} reg.</span>
                <span className="text-[11px] text-muted-foreground/30">·</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">{entry.insightsCount} insights</span>
                <span className="text-[11px] text-muted-foreground/30">·</span>
                <span className="text-[11px] text-muted-foreground/40">{timeAgo(entry.timestamp)}</span>
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
