"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          body.ge { margin:0; font-family:system-ui,-apple-system,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; background:#fafaf9; color:#1c1917 }
          .ge-wrap { text-align:center; padding:2rem; max-width:400px }
          .ge-icon { font-size:3rem; margin-bottom:1rem }
          .ge-title { font-size:1.25rem; margin-bottom:0.5rem }
          .ge-msg { font-size:0.875rem; color:#78716c; margin-bottom:1.5rem }
          .ge-btn { padding:0.625rem 1.25rem; border-radius:0.75rem; border:1px solid #d6d3d1; background:#1c1917; color:#fafaf9; cursor:pointer; font-size:0.875rem; font-weight:500 }
        ` }} />
      </head>
      <body className="ge">
        <div className="ge-wrap">
          <div className="ge-icon">⚠️</div>
          <h1 className="ge-title">
            Erro crítico
          </h1>
          <p className="ge-msg">
            A aplicação encontrou um erro fatal. Por favor, tente recarregar.
          </p>
          <button onClick={reset} className="ge-btn">
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
