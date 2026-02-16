import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type TokenPayload } from "../services/authService";

/**
 * Estende o Request do Express para incluir dados do usuário autenticado.
 */
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * Middleware obrigatório: rejeita requisições sem token válido.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Token de autenticação não fornecido" });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token inválido";
    res.status(401).json({ success: false, error: message });
  }
}

/**
 * Middleware opcional: extrai o usuário se o token existir, mas não bloqueia.
 * Útil para rotas que funcionam com e sem autenticação.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (header && header.startsWith("Bearer ")) {
    const token = header.slice(7);
    try {
      const payload = verifyAccessToken(token);
      req.user = payload;
    } catch {
      // Token inválido — ignorar silenciosamente
    }
  }

  next();
}
