import { Router, Request, Response } from "express";
import { AnalyzeRequestSchema } from "../types";
import { analyzeData, generateInsights } from "../pipelines";
import { logger } from "../utils/logger";
import { saveHistory, findByHash, hashInput } from "../services/dbService";
import { optionalAuth } from "./authMiddleware";

const router = Router();

/**
 * POST /analyze/stream
 * Análise com progresso em tempo real via Server-Sent Events.
 * Emite eventos de progresso conforme cada etapa do pipeline é executada.
 */
router.post("/analyze/stream", optionalAuth, async (req: Request, res: Response): Promise<void> => {
  // Configurar SSE
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const input = AnalyzeRequestSchema.parse(req.body);
    const options = input.options ?? {
      language: "pt",
      includeRecommendations: true,
      includeExecutiveSummary: true,
    };

    // Cache check
    const inputHash = hashInput(input.content);
    const cached = findByHash(inputHash);
    if (cached?.result_json) {
      logger.info(`SSE cache hit para hash ${inputHash.slice(0, 12)}...`);
      send("progress", { step: 5, total: 5, label: "Resultado em cache!", percent: 100 });
      send("result", JSON.parse(cached.result_json));
      res.end();
      return;
    }

    // Etapa 1: Parsing dos dados
    send("progress", { step: 1, total: 5, label: "Processando dados brutos...", percent: 10 });

    const { analysis } = await analyzeData(input);

    send("progress", { step: 2, total: 5, label: "Dados analisados com sucesso", percent: 25 });

    // Etapa 2: Gerando insights com IA
    send("progress", { step: 3, total: 5, label: "Gerando insights com IA...", percent: 40 });

    // Insights
    const { insights, executiveSummary, recommendations } = await generateInsights(analysis, options);

    send("progress", { step: 4, total: 5, label: "Insights e recomendações gerados", percent: 80 });

    // Etapa final: montagem do resultado
    send("progress", { step: 5, total: 5, label: "Finalizando análise...", percent: 95 });

    const result = {
      analysis,
      insights,
      executiveSummary,
      recommendations,
    };

    // Salvar no histórico
    try {
      saveHistory({
        label: `Análise ${new Date().toLocaleDateString("pt-BR")} — ${analysis.summary.totalRecords} registros`,
        format: input.format,
        records: analysis.summary.totalRecords,
        insightsCount: insights.length,
        inputContent: input.content,
        resultJson: JSON.stringify(result),
        userId: req.user?.userId,
      });
    } catch (e) {
      logger.warn("Falha ao salvar histórico (SSE):", e);
    }

    send("result", result);
    send("progress", { step: 5, total: 5, label: "Concluído!", percent: 100 });

    logger.info("Análise via SSE concluída com sucesso");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    send("error", { message });
    logger.error("Erro na análise SSE:", error);
  } finally {
    res.end();
  }
});

export default router;
