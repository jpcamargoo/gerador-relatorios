"use client";

import { Download } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import type { AnalysisResult } from "@/lib/api";

interface ExportMenuProps {
  data: AnalysisResult;
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportMenu({ data }: ExportMenuProps) {
  const exportJSON = () => {
    const payload = {
      analysis: data.analysis,
      insights: data.insights,
      executiveSummary: data.executiveSummary,
      recommendations: data.recommendations,
      exportedAt: new Date().toISOString(),
    };
    downloadBlob(JSON.stringify(payload, null, 2), `analise_${Date.now()}.json`, "application/json");
    toast.success("JSON exportado");
  };

  const exportCSV = () => {
    const lines: string[] = [];

    // Numeric stats
    const numKeys = Object.keys(data.analysis.statistics.numeric);
    if (numKeys.length > 0) {
      lines.push("campo,min,max,media,mediana");
      numKeys.forEach((key) => {
        const s = data.analysis.statistics.numeric[key];
        lines.push(`${key},${s.min},${s.max},${s.mean.toFixed(2)},${s.median}`);
      });
      lines.push("");
    }

    // Insights
    if (data.insights.length > 0) {
      lines.push("insight_titulo,descricao,importancia,categoria");
      data.insights.forEach((ins) => {
        lines.push(`"${ins.title}","${ins.description}",${ins.importance},${ins.category}`);
      });
      lines.push("");
    }

    // Recommendations
    if (data.recommendations.length > 0) {
      lines.push("recomendacao_titulo,descricao,prioridade,acoes");
      data.recommendations.forEach((rec) => {
        lines.push(
          `"${rec.title}","${rec.description}",${rec.priority},"${rec.actionItems.join("; ")}"`
        );
      });
    }

    downloadBlob(lines.join("\n"), `analise_${Date.now()}.csv`, "text/csv");
    toast.success("CSV exportado");
  };

  const exportMD = () => {
    let md = `# Relatório de Análise\n\n`;
    md += `> Exportado em ${new Date().toLocaleString("pt-BR")}\n\n`;

    md += `## Resumo Executivo\n\n${data.executiveSummary}\n\n`;

    md += `## Estatísticas\n\n`;
    md += `- **Registros:** ${data.analysis.summary.totalRecords}\n`;
    md += `- **Colunas:** ${data.analysis.summary.columns}\n\n`;

    const numKeys = Object.keys(data.analysis.statistics.numeric);
    if (numKeys.length > 0) {
      md += `| Campo | Min | Max | Média | Mediana |\n| --- | ---: | ---: | ---: | ---: |\n`;
      numKeys.forEach((key) => {
        const s = data.analysis.statistics.numeric[key];
        md += `| ${key} | ${s.min} | ${s.max} | ${s.mean.toFixed(2)} | ${s.median} |\n`;
      });
      md += `\n`;
    }

    if (data.insights.length > 0) {
      md += `## Insights\n\n`;
      data.insights.forEach((ins, i) => {
        md += `### ${i + 1}. ${ins.title}\n\n`;
        md += `**Importância:** ${ins.importance === "high" ? "Alta" : ins.importance === "medium" ? "Média" : "Baixa"}  \n`;
        md += `${ins.description}\n\n`;
      });
    }

    if (data.recommendations.length > 0) {
      md += `## Recomendações\n\n`;
      data.recommendations.forEach((rec, i) => {
        md += `### ${i + 1}. ${rec.title}\n\n`;
        md += `**Prioridade:** ${rec.priority === "high" ? "Alta" : rec.priority === "medium" ? "Média" : "Baixa"}  \n`;
        md += `${rec.description}\n\n`;
        if (rec.actionItems.length > 0) {
          md += `**Ações:**\n`;
          rec.actionItems.forEach((a) => (md += `- ${a}\n`));
          md += `\n`;
        }
      });
    }

    downloadBlob(md, `analise_${Date.now()}.md`, "text/markdown");
    toast.success("Markdown exportado");
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground/50 mr-1">Exportar</span>
      {[
        { label: "JSON", onClick: exportJSON },
        { label: "CSV", onClick: exportCSV },
        { label: "MD", onClick: exportMD },
      ].map((btn) => (
        <button
          key={btn.label}
          onClick={btn.onClick}
          aria-label={`Exportar como ${btn.label}`}
          className={clsx(
            "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-premium",
            "text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-foreground/10"
          )}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
