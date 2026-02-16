import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

/**
 * Middleware de tratamento de erros global.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  logger.error("❌ Erro não tratado:", { message: err.message, stack: err.stack });

  res.status(500).json({
    success: false,
    error: "Erro interno do servidor",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
}

/**
 * Middleware de log de requisições.
 */
export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
}
