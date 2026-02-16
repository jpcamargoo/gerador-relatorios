import { Router, Request, Response } from "express";
import { registerUser, loginUser, refreshAccessToken, getUserProfile } from "../services/authService";
import { requireAuth } from "./authMiddleware";
import { z } from "zod";

const router = Router();

// ─── Schemas ────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const LoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token obrigatório"),
});

// ─── POST /auth/register ────────────────────────────────────────────

router.post("/auth/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = RegisterSchema.parse(req.body);
    const result = await registerUser(name, email.toLowerCase(), password);

    res.status(201).json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "Dados inválidos", details: error.flatten().fieldErrors });
      return;
    }
    const message = error instanceof Error ? error.message : "Erro ao registrar";
    const status = message === "E-mail já cadastrado" ? 409 : 500;
    res.status(status).json({ success: false, error: message });
  }
});

// ─── POST /auth/login ───────────────────────────────────────────────

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const result = await loginUser(email.toLowerCase(), password);

    res.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "Dados inválidos", details: error.flatten().fieldErrors });
      return;
    }
    const message = error instanceof Error ? error.message : "Erro ao fazer login";
    res.status(401).json({ success: false, error: message });
  }
});

// ─── POST /auth/refresh ─────────────────────────────────────────────

router.post("/auth/refresh", (req: Request, res: Response): void => {
  try {
    const { refreshToken } = RefreshSchema.parse(req.body);
    const tokens = refreshAccessToken(refreshToken);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: "Dados inválidos" });
      return;
    }
    const message = error instanceof Error ? error.message : "Erro ao renovar token";
    res.status(401).json({ success: false, error: message });
  }
});

// ─── GET /auth/me ───────────────────────────────────────────────────

router.get("/auth/me", requireAuth, (req: Request, res: Response): void => {
  try {
    const user = getUserProfile(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: "Usuário não encontrado" });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: "Erro ao buscar perfil" });
  }
});

export default router;
