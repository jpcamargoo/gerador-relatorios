import { Router, Request, Response } from "express";
import {
  listHistory,
  getHistoryById,
  deleteHistory,
  clearHistory,
  clearUserHistory,
} from "../services/dbService";
import { optionalAuth } from "./authMiddleware";
import { logger } from "../utils/logger";

const router = Router();

/**
 * GET /history
 * Lista o histórico de análises com paginação.
 * Se autenticado, filtra pelo userId.
 */
router.get("/history", optionalAuth, (req: Request, res: Response): void => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const result = listHistory(limit, offset, req.user?.userId);

    res.json({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        limit,
        offset,
        hasMore: offset + limit < result.total,
      },
    });
  } catch (error) {
    logger.error("Erro no GET /history:", error);
    res.status(500).json({ success: false, error: "Erro ao listar histórico" });
  }
});

/**
 * GET /history/:id
 * Retorna um item de histórico com resultado completo.
 */
router.get("/history/:id", optionalAuth, (req: Request, res: Response): void => {
  try {
    const entry = getHistoryById(req.params.id as string);

    if (!entry) {
      res.status(404).json({ success: false, error: "Análise não encontrada" });
      return;
    }

    // Se autenticado, verificar ownership
    if (req.user && entry.user_id && entry.user_id !== req.user.userId) {
      res.status(403).json({ success: false, error: "Sem permissão" });
      return;
    }

    res.json({
      success: true,
      data: {
        id: entry.id,
        label: entry.label,
        format: entry.format,
        records: entry.records,
        insightsCount: entry.insights_count,
        createdAt: entry.created_at,
        result: entry.result_json ? JSON.parse(entry.result_json) : null,
      },
    });
  } catch (error) {
    logger.error("Erro no GET /history/:id:", error);
    res.status(500).json({ success: false, error: "Erro ao buscar análise" });
  }
});

/**
 * DELETE /history/:id
 * Remove um item do histórico.
 * Se autenticado, verifica que o item pertence ao usuário.
 */
router.delete("/history/:id", optionalAuth, (req: Request, res: Response): void => {
  try {
    // Se autenticado, verificar ownership
    if (req.user) {
      const entry = getHistoryById(req.params.id as string);
      if (!entry) {
        res.status(404).json({ success: false, error: "Análise não encontrada" });
        return;
      }
      if (entry.user_id && entry.user_id !== req.user.userId) {
        res.status(403).json({ success: false, error: "Sem permissão" });
        return;
      }
    }

    const deleted = deleteHistory(req.params.id as string);

    if (!deleted) {
      res.status(404).json({ success: false, error: "Análise não encontrada" });
      return;
    }

    res.json({ success: true, message: "Análise removida" });
  } catch (error) {
    logger.error("Erro no DELETE /history/:id:", error);
    res.status(500).json({ success: false, error: "Erro ao remover análise" });
  }
});

/**
 * DELETE /history
 * Limpa histórico. Se autenticado, limpa apenas do usuário.
 */
router.delete("/history", optionalAuth, (req: Request, res: Response): void => {
  try {
    const count = req.user
      ? clearUserHistory(req.user.userId)
      : clearHistory();
    res.json({ success: true, message: `${count} análise(s) removida(s)` });
  } catch (error) {
    logger.error("Erro no DELETE /history:", error);
    res.status(500).json({ success: false, error: "Erro ao limpar histórico" });
  }
});

export default router;
