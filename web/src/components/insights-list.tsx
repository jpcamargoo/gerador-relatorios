"use client";

import type { Insight } from "@/lib/api";
import clsx from "clsx";

const badgeStyles = {
  high: "bg-red-500/10 text-red-500 dark:bg-red-400/10 dark:text-red-400",
  medium: "bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400",
  low: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400",
};

const barStyles = {
  high: "bg-red-500/60",
  medium: "bg-amber-500/60",
  low: "bg-emerald-500/60",
};

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (!insights.length) return <p className="text-sm text-muted-foreground">Nenhum insight gerado.</p>;

  return (
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <div
          key={i}
          className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-premium hover:border-foreground/10 hover:shadow-sm"
        >
          {/* Left bar */}
          <div className={clsx("absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full", barStyles[insight.importance])} />

          <div className="flex items-start justify-between gap-3 ml-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium leading-snug">{insight.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {insight.description}
              </p>
            </div>
            <span className={clsx("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium", badgeStyles[insight.importance])}>
              {insight.importance === "high" ? "Alta" : insight.importance === "medium" ? "Média" : "Baixa"}
            </span>
          </div>

          {insight.category && (
            <span className="ml-2 mt-2 inline-block text-[11px] text-muted-foreground/60">
              {insight.category}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
