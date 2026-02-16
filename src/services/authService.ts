import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { createUser, findUserByEmail, findUserById } from "./dbService";
import { logger } from "../utils/logger";

// ─── Tipos ──────────────────────────────────────────────────────────

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

// ─── Funções ────────────────────────────────────────────────────────

const SALT_ROUNDS = 12;

export async function registerUser(name: string, email: string, password: string): Promise<{ user: SafeUser; tokens: AuthTokens }> {
  // Verificar se email já existe
  const existing = findUserByEmail(email);
  if (existing) {
    throw new Error("E-mail já cadastrado");
  }

  // Validar senha
  if (password.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres");
  }

  // Hash da senha
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Criar usuário
  const id = createUser({ name, email, passwordHash });

  const user: SafeUser = { id, name, email, createdAt: new Date().toISOString() };
  const tokens = generateTokens({ userId: id, email });

  logger.info(`Novo usuário registrado: ${email}`);
  return { user, tokens };
}

export async function loginUser(email: string, password: string): Promise<{ user: SafeUser; tokens: AuthTokens }> {
  const row = findUserByEmail(email);
  if (!row) {
    throw new Error("Credenciais inválidas");
  }

  const valid = await bcrypt.compare(password, row.password_hash);
  if (!valid) {
    throw new Error("Credenciais inválidas");
  }

  const user: SafeUser = {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
  const tokens = generateTokens({ userId: row.id, email: row.email });

  logger.info(`Login: ${email}`);
  return { user, tokens };
}

export function refreshAccessToken(refreshToken: string): AuthTokens {
  try {
    const payload = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as TokenPayload;

    // Verificar se o usuário ainda existe
    const user = findUserById(payload.userId);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    return generateTokens({ userId: payload.userId, email: payload.email });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new Error("Refresh token expirado. Faça login novamente.");
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new Error("Refresh token inválido");
    }
    throw err;
  }
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new Error("Token expirado");
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new Error("Token inválido");
    }
    throw err;
  }
}

export function getUserProfile(userId: string): SafeUser | null {
  const row = findUserById(userId);
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────

function generateTokens(payload: TokenPayload): AuthTokens {
  const accessToken = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  return { accessToken, refreshToken };
}
