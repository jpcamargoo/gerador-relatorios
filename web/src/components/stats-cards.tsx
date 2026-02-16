"use client";

import type { AnalysisResult } from "@/lib/api";
import clsx from "clsx";

export function StatsCards({ data }: { data: AnalysisResult }) {
  const { summary } = data.analysis;

  const stats = [
    { label: "Registros", value: summary.totalRecords },
    { label: "Colunas", value: summary.columns },
    { label: "Insights", value: data.insights.length },
    { label: "Recomendações", value: data.recommendations.length },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s, i) => (
        <div key={s.label} className={clsx("rounded-2xl border bg-card p-5 card-glow transition-premium hover:scale-[1.02]", `animate-fade-up animate-fade-up-delay-${i + 1}`)}>
          <p className="text-3xl font-bold tracking-tight tabular-nums">{s.value}</p>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
