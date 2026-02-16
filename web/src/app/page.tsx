"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  FileDown,
  Loader2,
  BarChart3,
  Lightbulb,
  FileText,
  Target,
  Database,
  Zap,
  Play,
  Keyboard,
} from "lucide-react";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { DropZone } from "@/components/drop-zone";
import { StatsCards } from "@/components/stats-cards";
import { InsightsList } from "@/components/insights-list";
import { RecommendationsList } from "@/components/recommendations-list";
import { DataTable } from "@/components/data-table";
import { ThemeToggle } from "@/components/theme-toggle";
import { HistoryPanel } from "@/components/history-panel";
import { AnalysisSkeleton } from "@/components/analysis-skeleton";
import { ExportMenu } from "@/components/export-menu";
import { ProgressBar } from "@/components/progress-bar";
import { UserMenu } from "@/components/user-menu";
import { useHistory, type HistoryEntry } from "@/hooks/use-history";

const AnalysisCharts = dynamic(() => import("@/components/analysis-charts").then(m => m.AnalysisCharts), { ssr: false });
import {
  analyzeData,
  analyzeFile,
  analyzeDataStream,
  generateReport,
  generateReportFromFile,
  type AnalysisResult,
  type ProgressEvent,
} from "@/lib/api";

type InputMode = "file" | "text";
type Tab = "insights" | "summary" | "recommendations" | "charts" | "data";

export default function Home() {
  const [mode, setMode] = useState<InputMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState("csv");
  const [language, setLanguage] = useState("pt");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("insights");
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const history = useHistory();

  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(null);
    try {
      let data: AnalysisResult;
      if (mode === "file" && file) {
        data = await analyzeFile(file, { language });
      } else if (mode === "text" && content.trim()) {
        const opts = { language, includeRecommendations: true, includeExecutiveSummary: true };
        // Tenta SSE para progresso em tempo real, fallback para endpoint regular
        try {
          data = await analyzeDataStream(
            { format, content, options: opts },
            (p) => setProgress(p),
          );
        } catch {
          setProgress(null);
          data = await analyzeData({ format, content, options: opts });
        }
      } else {
        throw new Error("Adicione dados para analisar.");
      }
      setResult(data);
      setActiveTab("insights");
      setProgress(null);
      history.refresh();
      toast.success("Análise concluída", {
        description: `${data.insights.length} insights · ${data.recommendations.length} recomendações`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(msg);
      setProgress(null);
      toast.error("Falha na análise", { description: msg });
    } finally {
      setLoading(false);
    }
  }, [mode, file, format, content, language, history]);

  const handlePdf = useCallback(async () => {
    setLoadingPdf(true);
    setError(null);
    try {
      let blob: Blob;
      const opts = { title: title || undefined, author: author || undefined };
      if (mode === "file" && file) {
        blob = await generateReportFromFile(file, opts);
      } else if (mode === "text" && content.trim()) {
        blob = await generateReport({ format, content, ...opts });
      } else {
        throw new Error("Adicione dados para gerar o relatório.");
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF gerado", { description: "Download iniciado" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar PDF";
      setError(msg);
      toast.error("Erro no PDF", { description: msg });
    } finally {
      setLoadingPdf(false);
    }
  }, [mode, file, format, content, title, author]);

  // ─── Sample Data Quick Start ──────────────────────────────
  const loadSampleData = useCallback(() => {
    setMode("text");
    setFormat("csv");
    setContent(
      `produto,vendas,receita,regiao,categoria
Notebook Pro,150,450000,Sul,Eletrônicos
Smartphone X,320,640000,Sudeste,Eletrônicos
Fone Bluetooth,280,56000,Nordeste,Acessórios
Tablet Plus,95,190000,Sul,Eletrônicos
Carregador USB,420,42000,Norte,Acessórios
Monitor 4K,60,180000,Sudeste,Periféricos
Teclado Mech,175,87500,Centro-Oeste,Periféricos
Mouse Gamer,210,63000,Sul,Periféricos
Webcam HD,130,52000,Nordeste,Acessórios
SSD 1TB,190,171000,Sudeste,Componentes`
    );
    toast.info("Dados de exemplo carregados", { description: "10 produtos com 5 colunas" });
  }, []);

  // ─── Keyboard Shortcuts ───────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Enter or Cmd+Enter → Analisar
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleAnalyze();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleAnalyze]);

  const handleHistorySelect = useCallback(async (entry: HistoryEntry) => {
    // Carregar do servidor
    setLoading(true);
    try {
      const data = await history.load(entry.id);
      if (data) {
        setResult(data);
        setActiveTab("insights");
      } else {
        toast.error("Dados não encontrados");
      }
    } catch {
      toast.error("Erro ao carregar análise");
    } finally {
      setLoading(false);
    }
  }, [history]);

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
    { id: "insights", label: "Insights", icon: Lightbulb },
    { id: "summary", label: "Resumo", icon: FileText },
    { id: "recommendations", label: "Recomendações", icon: Target },
    { id: "charts", label: "Gráficos", icon: BarChart3 },
    { id: "data", label: "Dados", icon: Database },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b glass">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-foreground">
              <BarChart3 className="h-3.5 w-3.5 text-background" strokeWidth={2} />
            </div>
            <span className="text-sm font-semibold tracking-tight">Relatórios&nbsp;IA</span>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-3 rounded-lg flex items-center text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-premium"
            >
              API Docs
            </a>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        {/* Hero */}
        <div className="mb-14 animate-fade-up">
          <div className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 mb-5 card-glow">
            <Zap className="h-3 w-3 text-amber-500 animate-pulse-glow" strokeWidth={2} />
            <span className="text-[11px] font-medium text-muted-foreground">Powered by AI</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl gradient-text">
            Análise inteligente
          </h1>
          <p className="mt-3 text-muted-foreground text-base max-w-md leading-relaxed">
            Transforme dados brutos em insights e relatórios profissionais com inteligência artificial.
          </p>
          <button
            onClick={loadSampleData}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-premium"
          >
            <Play className="h-3 w-3" strokeWidth={2} />
            Experimentar com dados de exemplo
          </button>
        </div>

        {/* History */}
        {history.entries.length > 0 && (
          <div className="mb-10">
            <HistoryPanel
              entries={history.entries}
              onSelect={handleHistorySelect}
              onRemove={history.remove}
              onClear={history.clear}
            />
          </div>
        )}

        {/* Input Section */}
        <section className="mb-16 animate-fade-up animate-fade-up-delay-1">
          <div className="rounded-2xl border bg-card p-6 sm:p-8 card-glow">
            {/* Mode Switch */}
            <div className="flex gap-1 mb-6 p-1 rounded-xl bg-muted/60 w-fit" role="tablist" aria-label="Modo de entrada">
              {(["file", "text"] as const).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m ? "true" : "false"}
                  onClick={() => setMode(m)}
                  className={clsx(
                    "rounded-lg px-5 py-2 text-sm transition-premium",
                    mode === m
                      ? "bg-background text-foreground shadow-sm card-glow"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "file" ? "Arquivo" : "Texto"}
                </button>
              ))}
            </div>

            {/* File Mode */}
            {mode === "file" && (
              <DropZone file={file} onFile={setFile} onClear={() => setFile(null)} />
            )}

            {/* Text Mode */}
            {mode === "text" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="format-select" className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Formato</label>
                    <select
                      id="format-select"
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none input-premium"
                    >
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                      <option value="text">Texto</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="language-select" className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Idioma</label>
                    <select
                      id="language-select"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none input-premium"
                    >
                      <option value="pt">Português</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="data-input" className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Dados</label>
                  <textarea
                    id="data-input"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={"produto,vendas,regiao\nNotebook,150,Sul\nSmartphone,320,Sudeste"}
                    className="w-full rounded-xl border bg-background px-3.5 py-3 text-sm font-mono outline-none input-premium min-h-[160px] resize-y placeholder:text-muted-foreground/30"
                  />
                </div>
              </div>
            )}

            {/* Options */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div>
                <label htmlFor="title-input" className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Título</label>
                <input
                  id="title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Relatório Automático"
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none input-premium placeholder:text-muted-foreground/30"
                />
              </div>
              <div>
                <label htmlFor="author-input" className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Autor</label>
                <input
                  id="author-input"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Sistema IA"
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none input-premium placeholder:text-muted-foreground/30"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-500 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-7">
              <button
                onClick={handleAnalyze}
                disabled={loading || (mode === "file" ? !file : !content.trim())}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium",
                  "btn-premium text-primary-foreground",
                  "disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                )}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                )}
                {loading ? "Analisando..." : "Analisar com IA"}
              </button>
              <button
                onClick={handlePdf}
                disabled={loadingPdf || (mode === "file" ? !file : !content.trim())}
                className={clsx(
                  "flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-premium",
                  "hover:bg-muted/50 hover:border-foreground/10",
                  "disabled:opacity-30 disabled:cursor-not-allowed"
                )}
              >
                {loadingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" strokeWidth={1.5} />
                )}
                PDF
              </button>
            </div>

            {/* Keyboard shortcut hint */}
            <div className="flex items-center gap-1.5 mt-3 justify-end">
              <Keyboard className="h-3 w-3 text-muted-foreground/40" strokeWidth={1.5} />
              <span className="text-[10px] text-muted-foreground/40">
                Ctrl + Enter para analisar
              </span>
            </div>
          </div>
        </section>

        {/* Loading — Progress bar (SSE) or Skeleton */}
        {loading && (
          progress ? <ProgressBar progress={progress} /> : <AnalysisSkeleton />
        )}

        {/* Empty state */}
        {!result && !loading && (
          <section className="mb-16 animate-fade-up">
            <div className="rounded-2xl border border-dashed bg-card/50 p-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                <BarChart3 className="h-6 w-6 text-muted-foreground/40" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-muted-foreground">Os resultados da análise aparecerão aqui</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Adicione dados e clique em "Analisar com IA"</p>
            </div>
          </section>
        )}

        {/* Results */}
        {result && !loading && (
          <section className="space-y-6 animate-fade-up">
            {/* Stats */}
            <div className="flex items-center justify-between">
              <div />
              <ExportMenu data={result} />
            </div>
            <StatsCards data={result} />

            {/* Tabs */}
            <div className="rounded-2xl border bg-card overflow-hidden card-glow">
              <div className="flex border-b overflow-x-auto" role="tablist" aria-label="Resultados da análise">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={activeTab === id ? "true" : "false"}
                    aria-controls={`panel-${id}`}
                    onClick={() => setActiveTab(id)}
                    className={clsx(
                      "flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-premium whitespace-nowrap",
                      activeTab === id
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-6 sm:p-8" role="tabpanel" id={`panel-${activeTab}`}>
                {activeTab === "insights" && <InsightsList insights={result.insights} />}
                {activeTab === "summary" && (
                  <div className="rounded-xl bg-muted/20 border border-border/50 p-6 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {result.executiveSummary}
                  </div>
                )}
                {activeTab === "recommendations" && (
                  <RecommendationsList recommendations={result.recommendations} />
                )}
                {activeTab === "charts" && <AnalysisCharts data={result} />}
                {activeTab === "data" && <DataTable data={result} />}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="mx-auto max-w-5xl px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
            <span className="text-xs text-muted-foreground">Sistema ativo</span>
          </div>
          <span className="text-[11px] text-muted-foreground/40">Relatórios IA — v1.0</span>
        </div>
      </footer>
    </div>
  );
}
