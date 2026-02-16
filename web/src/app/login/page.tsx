"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChart3, Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/contexts/auth-context";

type Mode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim()) throw new Error("Informe seu nome");
        if (password.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres");
        await register(name.trim(), email.trim(), password);
        toast.success("Conta criada", { description: "Bem-vindo!" });
      } else {
        await login(email.trim(), password);
        toast.success("Login realizado");
      }
      router.push("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro inesperado";
      toast.error(mode === "login" ? "Falha no login" : "Falha no registro", {
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Background dots */}
      <div className="fixed inset-0 dot-grid opacity-40 pointer-events-none" />

      <div className="w-full max-w-sm relative animate-fade-up">
        {/* Back link */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-premium mb-8"
        >
          <ArrowLeft className="h-3 w-3" />
          Voltar
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-foreground">
            <BarChart3 className="h-4 w-4 text-background" strokeWidth={2} />
          </div>
          <span className="text-base font-semibold tracking-tight">Relatórios&nbsp;IA</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-6 sm:p-8 card-glow">
          <h1 className="text-lg font-semibold tracking-tight mb-1">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "login"
              ? "Acesse sua conta para ver seu histórico"
              : "Crie uma conta para salvar suas análises"}
          </p>

          {/* Mode Switch */}
          <div className="flex gap-1 mb-6 p-1 rounded-xl bg-muted/60 w-full" role="tablist" aria-label="Modo de autenticação">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m ? "true" : "false"}
                onClick={() => setMode(m)}
                className={clsx(
                  "flex-1 rounded-lg px-4 py-2 text-sm transition-premium",
                  mode === m
                    ? "bg-background text-foreground shadow-sm card-glow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "login" ? "Entrar" : "Registrar"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2"
                >
                  Nome
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  autoComplete="name"
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none input-premium placeholder:text-muted-foreground/30"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2"
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoComplete="email"
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none input-premium placeholder:text-muted-foreground/30"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Mínimo 6 caracteres" : "Sua senha"}
                  required
                  minLength={mode === "register" ? 6 : undefined}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 pr-10 text-sm outline-none input-premium placeholder:text-muted-foreground/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-premium"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium",
                "btn-premium text-primary-foreground",
                "disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {loading
                ? "Aguarde..."
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta"}
            </button>
          </form>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
          <button
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            className="text-muted-foreground hover:text-foreground transition-premium underline underline-offset-2"
          >
            {mode === "login" ? "Registre-se" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}
