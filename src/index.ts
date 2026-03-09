import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { config } from "./config/env";
import routes from "./api/routes";
import uploadRoutes from "./api/uploadRoutes";
import sseRoutes from "./api/sseRoutes";
import historyRoutes from "./api/historyRoutes";
import authRoutes from "./api/authRoutes";
import { closeDb } from "./services/dbService";
import { swaggerDocument } from "./api/swagger";
import { errorHandler, requestLogger } from "./api/middleware";
import { storageService } from "./services/storageService";
import { logger } from "./utils/logger";

async function main(): Promise<void> {
  // Inicializar diretórios de storage
  await storageService.init();

  const app = express();

  // Segurança
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

  // Rate limiting — diferente para autenticados vs anônimos
  const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: (req) => {
      // Autenticados: 60 req/min — Anônimos: 15 req/min
      const authHeader = req.headers.authorization;
      return authHeader?.startsWith("Bearer ") ? 60 : 15;
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: "Muitas requisições. Tente novamente em 1 minuto." },
    skip: () => config.NODE_ENV === "test",
    // Desabilitar validação de IPv6 (fix para containers sem suporte IPv6)
    validate: { ip: false, trustProxy: false },
    keyGenerator: (req) => {
      // Usar userId como chave quando autenticado, senão IP
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const token = authHeader.slice(7);
          const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
          return `user:${payload.userId}`;
        } catch { /* fallback to IP */ }
      }
      // Fix: Normalizar IPv6 para IPv4 quando possível
      const ip = req.ip || req.socket.remoteAddress || "unknown";
      // Converter ::ffff:127.0.0.1 → 127.0.0.1
      return ip.replace(/^::ffff:/, "");
    },
  });
  app.use("/api", limiter);

  // Middlewares globais
  // CORS
  app.use(cors({
    origin: config.CORS_ORIGIN === "*" ? true : config.CORS_ORIGIN.split(","),
    credentials: true,
  }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Swagger docs
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "API Docs — Gerador de Relatórios",
  }));

  // Rotas
  app.use("/api", authRoutes);
  app.use("/api", routes);
  app.use("/api", uploadRoutes);
  app.use("/api", sseRoutes);
  app.use("/api", historyRoutes);

  // Error handler
  app.use(errorHandler);

  // Graceful shutdown
  const shutdown = () => {
    logger.info("Encerrando servidor...");
    closeDb();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Start
  app.listen(config.PORT, () => {
    logger.info(`
╔══════════════════════════════════════════════════════════╗
║   🚀 Gerador de Relatórios Automáticos                   ║
║   App:       http://localhost:${config.PORT}                      ║
║   API Docs:  http://localhost:${config.PORT}/api-docs              ║
║   Ambiente:  ${config.NODE_ENV.padEnd(43)}║
║   IA:        ${config.AI_PROVIDER.padEnd(43)}║
╚══════════════════════════════════════════════════════════╝`);
  });
}

main().catch((error) => {
  logger.error("Falha ao iniciar o servidor:", error);
  process.exit(1);
});
