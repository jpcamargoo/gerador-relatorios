const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ─── Token helpers ──────────────────────────────────────────────────

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

function authHeaders(): Record<string, string> {
  if (!accessToken) return {};
  return { Authorization: `Bearer ${accessToken}` };
}

// ─── Auth API ───────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function apiRegister(data: { name: string; email: string; password: string }): Promise<AuthTokens> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erro ao registrar");
  return json.data;
}

export async function apiLogin(data: { email: string; password: string }): Promise<AuthTokens> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Credenciais inválidas");
  return json.data;
}

export async function apiRefreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Token expirado");
  return json.data;
}

export async function apiGetProfile(): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { ...authHeaders() },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Não autenticado");
  return json.data;
}

// ─── Types ──────────────────────────────────────────────────────────

export interface Insight {
  title: string;
  description: string;
  importance: "high" | "medium" | "low";
  category: string;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionItems: string[];
}

export interface AnalysisResult {
  analysis: {
    summary: {
      totalRecords: number;
      columns: number;
      dataTypes: Record<string, string>;
      nullCounts: Record<string, number>;
    };
    statistics: {
      numeric: Record<string, { min: number; max: number; mean: number; median: number }>;
      categorical: Record<string, { uniqueValues: number; topValues: { value: string; count: number }[] }>;
    };
    categories: string[];
  };
  insights: Insight[];
  executiveSummary: string;
  recommendations: Recommendation[];
}

export async function analyzeData(data: {
  format: string;
  content: string;
  options?: { language?: string; includeRecommendations?: boolean; includeExecutiveSummary?: boolean };
}): Promise<AnalysisResult> {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erro na análise");
  return json.data;
}

export async function analyzeFile(file: File, options?: { language?: string }): Promise<AnalysisResult> {
  const form = new FormData();
  form.append("file", file);
  if (options?.language) form.append("language", options.language);

  const res = await fetch(`${API_URL}/api/upload/analyze`, { method: "POST", headers: { ...authHeaders() }, body: form });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erro na análise");
  return json.data;
}

export async function generateReport(data: {
  format: string;
  content: string;
  title?: string;
  author?: string;
}): Promise<Blob> {
  const res = await fetch(`${API_URL}/api/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao gerar PDF");
  }
  return res.blob();
}

export async function generateReportFromFile(file: File, options?: { title?: string; author?: string }): Promise<Blob> {
  const form = new FormData();
  form.append("file", file);
  if (options?.title) form.append("title", options.title);
  if (options?.author) form.append("author", options.author);

  const res = await fetch(`${API_URL}/api/upload/report`, { method: "POST", headers: { ...authHeaders() }, body: form });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Erro ao gerar PDF");
  }
  return res.blob();
}

// ─── SSE Streaming Analysis ─────────────────────────────────────────

export interface ProgressEvent {
  step: number;
  total: number;
  label: string;
  percent: number;
}

export async function analyzeDataStream(
  data: { format: string; content: string; options?: { language?: string; includeRecommendations?: boolean; includeExecutiveSummary?: boolean } },
  onProgress: (progress: ProgressEvent) => void,
): Promise<AnalysisResult> {
  const res = await fetch(`${API_URL}/api/analyze/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let msg = `SSE falhou (${res.status})`;
    try { const err = await res.json(); msg = err.error || msg; } catch {}
    throw new Error(msg);
  }
  if (!res.body) throw new Error("Stream não suportado neste navegador");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: AnalysisResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    let eventType = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (eventType === "progress") {
            onProgress(parsed as ProgressEvent);
          } else if (eventType === "result") {
            result = parsed as AnalysisResult;
          } else if (eventType === "error") {
            throw new Error(parsed.message);
          }
        } catch (e) {
          if (e instanceof Error && e.message !== "Unexpected end of JSON input") throw e;
        }
      }
    }
  }

  if (!result) throw new Error("Nenhum resultado recebido");
  return result;
}

// ─── Server-Side History ────────────────────────────────────────────

export interface HistoryItem {
  id: string;
  label: string;
  format: string;
  records: number;
  insightsCount: number;
  createdAt: string;
}

export interface HistoryDetail extends HistoryItem {
  result: AnalysisResult | null;
}

export async function fetchHistory(limit = 20, offset = 0): Promise<{ items: HistoryItem[]; total: number }> {
  const res = await fetch(`${API_URL}/api/history?limit=${limit}&offset=${offset}`, {
    headers: { ...authHeaders() },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erro ao buscar histórico");
  return { items: json.data, total: json.pagination.total };
}

export async function fetchHistoryDetail(id: string): Promise<HistoryDetail> {
  const res = await fetch(`${API_URL}/api/history/${id}`, {
    headers: { ...authHeaders() },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Análise não encontrada");
  return json.data;
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/history/${id}`, { method: "DELETE", headers: { ...authHeaders() } });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erro ao remover");
}

export async function clearServerHistory(): Promise<void> {
  const res = await fetch(`${API_URL}/api/history`, { method: "DELETE", headers: { ...authHeaders() } });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erro ao limpar histórico");
}
