"use client";

import type { Recommendation } from "@/lib/api";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";

const badgeStyles = {
  high: "bg-red-500/10 text-red-500 dark:bg-red-400/10 dark:text-red-400",
  medium: "bg-amber-500/10 text-amber-500 dark:bg-amber-400/10 dark:text-amber-400",
  low: "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/10 dark:text-emerald-400",
};

export function RecommendationsList({ recommendations }: { recommendations: Recommendation[] }) {
  if (!recommendations.length) return <p className="text-sm text-muted-foreground">Nenhuma recomendação.</p>;

  return (
    <div className="space-y-3">
      {recommendations.map((rec, i) => (
        <div key={i} className="rounded-xl border bg-card p-5 transition-premium hover:border-foreground/10 hover:shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground/40 font-mono">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-sm font-medium">{rec.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {rec.description}
              </p>
            </div>
            <span className={clsx("shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium", badgeStyles[rec.priority])}>
              {rec.priority === "high" ? "Alta" : rec.priority === "medium" ? "Média" : "Baixa"}
            </span>
          </div>

          {rec.actionItems.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t pt-3">
              {rec.actionItems.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
