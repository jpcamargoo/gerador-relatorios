import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card-glow rounded-2xl p-10 max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center">
          <FileQuestion className="w-7 h-7 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">404</h1>
          <p className="text-sm text-muted-foreground">
            Página não encontrada
          </p>
        </div>

        <Link
          href="/"
          className="btn-premium inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
