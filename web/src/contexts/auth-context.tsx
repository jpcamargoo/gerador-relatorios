"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  apiLogin,
  apiRegister,
  apiRefreshToken,
  apiGetProfile,
  setAccessToken,
  type AuthUser,
} from "@/lib/api";

// ─── Types ──────────────────────────────────────────────────────────

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Storage keys ───────────────────────────────────────────────────

const REFRESH_KEY = "relatorios-ia-refresh-token";
const USER_KEY = "relatorios-ia-user";

// ─── Provider ───────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  // Restore session on mount
  useEffect(() => {
    const restore = async () => {
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (!refreshToken) {
        setState({ user: null, loading: false });
        return;
      }

      try {
        const { accessToken, refreshToken: newRefreshToken } = await apiRefreshToken(refreshToken);
        setAccessToken(accessToken);
        localStorage.setItem(REFRESH_KEY, newRefreshToken);
        const user = await apiGetProfile();
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        setState({ user, loading: false });
      } catch {
        // Refresh failed — clear and continue as guest
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
        setAccessToken(null);
        setState({ user: null, loading: false });
      }
    };

    restore();
  }, []);

  // Auto-refresh access token every 13 minutes (token expires in 15m)
  useEffect(() => {
    if (!state.user) return;

    const interval = setInterval(async () => {
      const refreshToken = localStorage.getItem(REFRESH_KEY);
      if (!refreshToken) return;
      try {
        const { accessToken, refreshToken: newRefreshToken } = await apiRefreshToken(refreshToken);
        setAccessToken(accessToken);
        localStorage.setItem(REFRESH_KEY, newRefreshToken);
      } catch {
        // Silently fail — next API call will get 401
      }
    }, 13 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.user]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin({ email, password });
    setAccessToken(data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ user: data.user, loading: false });
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await apiRegister({ name, email, password });
    setAccessToken(data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setState({ user: data.user, loading: false });
  }, []);

  const logout = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
