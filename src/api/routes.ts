import { Router, Request, Response } from "express";
import { AnalyzeRequestSchema, ReportRequestSchema } from "../types";
import { analyzeData, generateInsights, buildPDF } from "../pipelines";
import { storageService } from "../services/storageService";
import { saveHistory, findByHash, hashInput } from "../services/dbService";
import { optionalAuth } from "./authMiddleware";
import { logger } from "../utils/logger";

const router = Router();

/**
 * POST /analyze
 * Recebe dados e retorna análise + insights + resumo + recomendações.
 */
router.post("/analyze", optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const input = AnalyzeRequestSchema.parse(req.body);
    const options = input.options ?? { language: "pt", includeRecommendations: true, includeExecutiveSummary: true };

    // 0. Verificar cache (mesma entrada = mesmo resultado)
    const inputHash = hashInput(input.content);
    const cached = findByHash(inputHash);
    if (cached?.result_json) {
      logger.info(`Cache hit para hash ${inputHash.slice(0, 12)}...`);
      res.json({ success: true, data: JSON.parse(cached.result_json), cached: true });
      return;
    }

    // 1. Análise dos dados
    const { analysis } = await analyzeData(input);

    // 2. Geração de insights via IA
    const { insights, executiveSummary, recommendations } = await generateInsights(analysis, options);

    const resultData = { analysis, insights, executiveSummary, recommendations };

    // 3. Salvar no histórico
    try {
      saveHistory({
        label: `Análise ${new Date().toLocaleDateString("pt-BR")} — ${analysis.summary.totalRecords} registros`,
        format: input.format,
        records: analysis.summary.totalRecords,
        insightsCount: insights.length,
        inputContent: input.content,
        resultJson: JSON.stringify(resultData),
        userId: req.user?.userId,
      });
    } catch (e) {
      logger.warn("Falha ao salvar histórico:", e);
    }

    res.json({
      success: true,
      data: resultData,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error,
      });
      return;
    }

    logger.error("Erro no /analyze:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno ao processar a análise",
    });
  }
});

/**
 * POST /report
 * Recebe dados e retorna o PDF do relatório gerado.
 */
router.post("/report", async (req: Request, res: Response): Promise<void> => {
  try {
    const input = ReportRequestSchema.parse(req.body);
    const options = input.options ?? { language: "pt", includeRecommendations: true, includeExecutiveSummary: true };

    // 1. Análise dos dados
    const { analysis } = await analyzeData(input);

    // 2. Geração de insights
    const { insights, executiveSummary, recommendations } = await generateInsights(analysis, options);

    // 3. Build do PDF
    const pdf = await buildPDF(
      { analysis, insights, executiveSummary, recommendations },
      { title: input.title, author: input.author }
    );

    // 4. Salvar PDF
    await storageService.savePDF(pdf.filename, pdf.buffer);

    // 5. Enviar PDF como resposta
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdf.filename}"`);
    res.setHeader("X-Report-Pages", String(pdf.pages));
    res.setHeader("X-Report-Generated-At", pdf.generatedAt.toISOString());
    res.send(pdf.buffer);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      res.status(400).json({
        success: false,
        error: "Dados inválidos",
        details: error,
      });
      return;
    }

    logger.error("Erro no /report:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno ao gerar o relatório",
    });
  }
});

/**
 * GET /health
 * Health check da API.
 */
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

export default router;
