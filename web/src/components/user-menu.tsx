"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function UserMenu() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading) {
    return <div className="h-8 w-8 rounded-lg skeleton" />;
  }

  if (!user) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="h-8 px-3 rounded-lg flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-premium"
      >
        <LogIn className="h-3.5 w-3.5" strokeWidth={2} />
        Entrar
      </button>
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-xs font-semibold text-foreground hover:bg-muted/80 transition-premium"
        aria-label="Menu do usuário"
        title={user.name}
      >
        {initials || <User className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-52 rounded-xl border bg-card p-2 card-glow z-50 animate-fade-up">
          <div className="px-3 py-2 border-b mb-1">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-premium"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={2} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
