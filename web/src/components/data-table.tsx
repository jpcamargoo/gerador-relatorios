"use client";

import type { AnalysisResult } from "@/lib/api";

export function DataTable({ data }: { data: AnalysisResult }) {
  const numericKeys = Object.keys(data.analysis.statistics.numeric);
  const catKeys = Object.keys(data.analysis.statistics.categorical);

  return (
    <div className="space-y-6">
      {/* Numeric */}
      {numericKeys.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Estatísticas Numéricas
          </h3>
          <div className="overflow-x-auto rounded-xl border card-glow">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Campo</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Min</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Max</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Média</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground text-xs">Mediana</th>
                </tr>
              </thead>
              <tbody>
                {numericKeys.map((key) => {
                  const s = data.analysis.statistics.numeric[key];
                  return (
                    <tr key={key} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-mono text-xs">{key}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{s.min}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{s.max}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{s.mean.toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{s.median}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categorical */}
      {catKeys.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Dados Categóricos
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {catKeys.map((key) => {
              const s = data.analysis.statistics.categorical[key];
              return (
                <div key={key} className="rounded-xl border bg-card p-4 transition-premium hover:border-foreground/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs">{key}</span>
                    <span className="text-xs text-muted-foreground">{s.uniqueValues} únicos</span>
                  </div>
                  <div className="space-y-2">
                    {s.topValues.slice(0, 4).map((tv) => {
                      const pct = s.topValues[0].count > 0 ? (tv.count / s.topValues[0].count) * 100 : 0;
                      return (
                        <div key={tv.value}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{tv.value}</span>
                            <span className="tabular-nums">{tv.count}</span>
                          </div>
                          <div className="h-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-foreground/20 transition-all"
                              ref={(el) => { if (el) el.style.width = `${pct}%`; }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Types */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Tipos de Dados
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.analysis.summary.dataTypes).map(([key, type]) => (
            <span
              key={key}
              className="rounded-lg border bg-muted/20 px-3 py-1.5 text-xs transition-premium hover:bg-muted/40"
            >
              <span className="font-mono">{key}</span>
              <span className="text-muted-foreground ml-1.5">{type}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
