"use client";

import { ProgressEvent } from "@/lib/api";
import { Sparkles, Check } from "lucide-react";
import clsx from "clsx";

interface ProgressBarProps {
  progress: ProgressEvent | null;
}

const steps = [
  { id: 1, label: "Processando dados" },
  { id: 2, label: "Análise estatística" },
  { id: 3, label: "Gerando insights (IA)" },
  { id: 4, label: "Recomendações" },
  { id: 5, label: "Finalizando" },
];

export function ProgressBar({ progress }: ProgressBarProps) {
  if (!progress) return null;

  return (
    <div className="mb-10 animate-fade-up" aria-live="polite" aria-label="Progresso da análise">
      <div className="rounded-2xl border bg-card p-6 sm:p-8 card-glow">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="h-8 w-8 rounded-xl bg-foreground/5 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-foreground animate-pulse-glow" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-medium">{progress.label}</p>
            <p className="text-[11px] text-muted-foreground">
              Etapa {progress.step} de {progress.total}
            </p>
          </div>
          <span className="ml-auto text-xs font-mono text-muted-foreground tabular-nums">
            {progress.percent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden mb-6">
          <div
            className="h-full rounded-full bg-foreground transition-all duration-700 ease-out"
            ref={(el) => { if (el) el.style.width = `${progress.percent}%`; }}
          />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-5 gap-2">
          {steps.map((step) => {
            const isComplete = progress.step > step.id;
            const isCurrent = progress.step === step.id;

            return (
              <div key={step.id} className="flex flex-col items-center gap-1.5">
                <div
                  className={clsx(
                    "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all duration-500",
                    isComplete && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    isCurrent && "bg-foreground text-background scale-110",
                    !isComplete && !isCurrent && "bg-muted/40 text-muted-foreground/50"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  ) : (
                    step.id
                  )}
                </div>
                <span
                  className={clsx(
                    "text-[10px] text-center leading-tight transition-colors duration-300 hidden sm:block",
                    isCurrent ? "text-foreground font-medium" : "text-muted-foreground/60"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
