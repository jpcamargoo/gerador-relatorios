import dotenv from "dotenv";
import { z } from "zod";

// Carregar .env apenas em desenvolvimento
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // AI Provider
  AI_PROVIDER: z.enum(["openai", "anthropic", "azure", "github"]).default("github"),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AZURE_OPENAI_API_KEY: z.string().optional(),
  AZURE_OPENAI_ENDPOINT: z.string().optional(),
  AZURE_OPENAI_DEPLOYMENT: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_MODEL: z.string().default("gpt-4o-mini"),

  // JWT
  JWT_SECRET: z.string().default("dev-jwt-secret-change-in-production"),
  JWT_REFRESH_SECRET: z.string().default("dev-refresh-secret-change-in-production"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // CORS
  CORS_ORIGIN: z.string().default("*"),

  // Storage
  STORAGE_DIR: z.string().default("./storage"),

  // PDF
  PDF_OUTPUT_DIR: z.string().default("./output"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;

// Debug: Verificar valores carregados (apenas primeiros 10 chars por segurança)
console.log("🔍 NODE_ENV:", config.NODE_ENV);
console.log("🔍 JWT_SECRET (início):", config.JWT_SECRET.substring(0, 10) + "...");
console.log("🔍 JWT_REFRESH_SECRET (início):", config.JWT_REFRESH_SECRET.substring(0, 10) + "...");

// Validações de produção
if (config.NODE_ENV === "production") {
  if (config.JWT_SECRET.startsWith("dev-")) {
    console.error("❌ JWT_SECRET deve ser alterado em produção!");
    console.error("   Valor atual:", config.JWT_SECRET);
    process.exit(1);
  }
  if (config.JWT_REFRESH_SECRET.startsWith("dev-")) {
    console.error("❌ JWT_REFRESH_SECRET deve ser alterado em produção!");
    console.error("   Valor atual:", config.JWT_REFRESH_SECRET);
    process.exit(1);
  }
  console.log("✅ Validações de produção OK!");
}
