"use client";

import clsx from "clsx";
import type { AnalysisResult } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

const CHART_COLORS = [
  "var(--foreground)",
  "var(--muted-foreground)",
  "color-mix(in srgb, var(--foreground) 60%, transparent)",
  "color-mix(in srgb, var(--foreground) 40%, transparent)",
  "color-mix(in srgb, var(--foreground) 25%, transparent)",
  "color-mix(in srgb, var(--foreground) 15%, transparent)",
];

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "8px 12px",
  fontSize: "12px",
  color: "var(--foreground)",
  boxShadow: "0 4px 16px var(--glow)",
};

export function AnalysisCharts({ data }: { data: AnalysisResult }) {
  const numericKeys = Object.keys(data.analysis.statistics.numeric);
  const catKeys = Object.keys(data.analysis.statistics.categorical);

  // Bar chart data: numeric stats comparison
  const barData = numericKeys.map((key) => {
    const s = data.analysis.statistics.numeric[key];
    return {
      name: key.length > 12 ? key.slice(0, 12) + "…" : key,
      Média: Number(s.mean.toFixed(2)),
      Mediana: s.median,
      Max: s.max,
    };
  });

  // Pie chart data: first categorical field
  const firstCatKey = catKeys[0];
  const pieData = firstCatKey
    ? data.analysis.statistics.categorical[firstCatKey].topValues.slice(0, 6).map((tv) => ({
        name: tv.value.length > 16 ? tv.value.slice(0, 16) + "…" : tv.value,
        value: tv.count,
      }))
    : [];

  // Radar chart: importance distribution
  const importanceCounts = { high: 0, medium: 0, low: 0 };
  data.insights.forEach((i) => importanceCounts[i.importance]++);
  const priorityCounts = { high: 0, medium: 0, low: 0 };
  data.recommendations.forEach((r) => priorityCounts[r.priority]++);
  const radarData = [
    { subject: "Insights Alta", A: importanceCounts.high, B: priorityCounts.high },
    { subject: "Insights Média", A: importanceCounts.medium, B: priorityCounts.medium },
    { subject: "Insights Baixa", A: importanceCounts.low, B: priorityCounts.low },
    { subject: "Rec. Alta", A: importanceCounts.high, B: priorityCounts.high },
    { subject: "Rec. Média", A: importanceCounts.medium, B: priorityCounts.medium },
    { subject: "Rec. Baixa", A: importanceCounts.low, B: priorityCounts.low },
  ];

  const hasNumeric = barData.length > 0;
  const hasCategorical = pieData.length > 0;
  const hasRadar = data.insights.length > 0 || data.recommendations.length > 0;

  if (!hasNumeric && !hasCategorical && !hasRadar) {
    return <p className="text-sm text-muted-foreground">Nenhum dado para visualização.</p>;
  }

  return (
    <div className="space-y-8">
      {/* Numeric Bar Chart */}
      {hasNumeric && (
        <div>
          <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Comparativo Numérico
          </h3>
          <div className="rounded-xl border bg-card p-4 card-glow">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barCategoryGap="20%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--glow)" }} />
                <Bar dataKey="Média" fill="var(--foreground)" radius={[6, 6, 0, 0]} />
                <Bar
                  dataKey="Mediana"
                  fill="color-mix(in srgb, var(--foreground) 50%, transparent)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="Max"
                  fill="color-mix(in srgb, var(--foreground) 25%, transparent)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-2">
              {["Média", "Mediana", "Max"].map((label, i) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div
                    className={clsx(
                      "h-2.5 w-2.5 rounded-full",
                      i === 0 && "bg-foreground",
                      i === 1 && "bg-foreground/50",
                      i === 2 && "bg-foreground/25"
                    )}
                  />
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Pie Chart */}
        {hasCategorical && (
          <div>
            <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">
              {firstCatKey}
            </h3>
            <div className="rounded-xl border bg-card p-4 card-glow">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-1">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div
                      className={clsx(
                        "h-2 w-2 rounded-full shrink-0",
                        i % CHART_COLORS.length === 0 && "bg-foreground",
                        i % CHART_COLORS.length === 1 && "bg-foreground/70",
                        i % CHART_COLORS.length === 2 && "bg-foreground/50",
                        i % CHART_COLORS.length === 3 && "bg-foreground/35",
                        i % CHART_COLORS.length === 4 && "bg-foreground/25",
                        i % CHART_COLORS.length === 5 && "bg-foreground/15"
                      )}
                    />
                    <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Radar Chart */}
        {hasRadar && (
          <div>
            <h3 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Distribuição de Prioridades
            </h3>
            <div className="rounded-xl border bg-card p-4 card-glow">
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar
                    name="Insights"
                    dataKey="A"
                    stroke="var(--foreground)"
                    fill="var(--foreground)"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                  />
                  <Radar
                    name="Recomendações"
                    dataKey="B"
                    stroke="var(--muted-foreground)"
                    fill="var(--muted-foreground)"
                    fillOpacity={0.1}
                    strokeWidth={1.5}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-1">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
                  <span className="text-[11px] text-muted-foreground">Insights</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">Recomendações</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
