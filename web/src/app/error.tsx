"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card-glow rounded-2xl p-10 max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Algo deu errado</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ocorreu um erro inesperado. Tente novamente ou recarregue a página.
          </p>
        </div>

        {error.message && (
          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground font-mono text-left break-all">
            {error.message}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-premium inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-muted/50 transition-colors"
          >
            Recarregar
          </button>
        </div>
      </div>
    </div>
  );
}
