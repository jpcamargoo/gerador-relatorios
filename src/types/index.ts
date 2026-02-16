import { z } from "zod";

// ─── Schemas de validação ───────────────────────────────────────────

export const DataInputSchema = z.object({
  format: z.enum(["json", "csv", "text"]),
  content: z.string().min(1, "O conteúdo não pode estar vazio"),
  options: z
    .object({
      language: z.enum(["pt", "en"]).default("pt"),
      includeRecommendations: z.boolean().default(true),
      includeExecutiveSummary: z.boolean().default(true),
    })
    .optional()
    .default({
      language: "pt",
      includeRecommendations: true,
      includeExecutiveSummary: true,
    }),
});

export type DataInput = z.infer<typeof DataInputSchema>;

// ─── Tipos do domínio ───────────────────────────────────────────────

export interface ParsedData {
  headers: string[];
  rows: Record<string, unknown>[];
  totalRecords: number;
  dataTypes: Record<string, string>;
}

export interface DataAnalysis {
  summary: {
    totalRecords: number;
    columns: number;
    dataTypes: Record<string, string>;
    nullCounts: Record<string, number>;
  };
  statistics: {
    numeric: Record<
      string,
      {
        min: number;
        max: number;
        mean: number;
        median: number;
      }
    >;
    categorical: Record<
      string,
      {
        uniqueValues: number;
        topValues: { value: string; count: number }[];
      }
    >;
  };
  categories: string[];
}

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

export interface ReportResult {
  analysis: DataAnalysis;
  insights: Insight[];
  executiveSummary: string;
  recommendations: Recommendation[];
}

export interface PDFReport {
  buffer: Buffer;
  filename: string;
  generatedAt: Date;
  pages: number;
}

// ─── Schemas de request ─────────────────────────────────────────────

export const AnalyzeRequestSchema = DataInputSchema;

export const ReportRequestSchema = DataInputSchema.extend({
  title: z.string().optional().default("Relatório Automático"),
  author: z.string().optional().default("Sistema de Relatórios IA"),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type ReportRequest = z.infer<typeof ReportRequestSchema>;
