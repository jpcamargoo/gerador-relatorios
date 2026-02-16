import multer from "multer";
import path from "path";
import { Router, Request, Response } from "express";
import { AnalyzeRequestSchema, ReportRequestSchema } from "../types";
import { analyzeData, generateInsights, buildPDF } from "../pipelines";
import { storageService } from "../services/storageService";
import { logger } from "../utils/logger";
import { saveHistory, findByHash, hashInput } from "../services/dbService";
import { optionalAuth } from "./authMiddleware";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedExts = [".csv", ".json", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Formato não suportado: ${ext}. Use: ${allowedExts.join(", ")}`));
    }
  },
});

const router = Router();

/**
 * Detecta o formato do arquivo pelo MIME type ou extensão.
 */
function detectFormat(file: Express.Multer.File): "csv" | "json" | "text" {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".csv") return "csv";
  if (ext === ".json") return "json";
  return "text";
}

/**
 * POST /upload/analyze
 * Upload de arquivo + análise com IA.
 */
router.post("/upload/analyze", optionalAuth, upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "Nenhum arquivo enviado. Use o campo 'file'." });
      return;
    }

    const format = detectFormat(req.file);
    const content = req.file.buffer.toString("utf-8");

    logger.info(`Upload recebido: ${req.file.originalname} (${format}, ${req.file.size} bytes)`);

    const input = AnalyzeRequestSchema.parse({
      format,
      content,
      options: {
        language: req.body.language || "pt",
        includeRecommendations: req.body.includeRecommendations !== "false",
        includeExecutiveSummary: req.body.includeExecutiveSummary !== "false",
      },
    });

    const options = input.options;

    // Cache check
    const inputHash = hashInput(content);
    const cached = findByHash(inputHash);
    if (cached?.result_json) {
      logger.info(`Upload cache hit para ${req.file.originalname}`);
      res.json({
        success: true,
        file: { name: req.file.originalname, size: req.file.size, format },
        data: JSON.parse(cached.result_json),
        cached: true,
      });
      return;
    }

    const { analysis } = await analyzeData(input);
    const { insights, executiveSummary, recommendations } = await generateInsights(analysis, options);

    const resultData = { analysis, insights, executiveSummary, recommendations };

    // Salvar no histórico
    try {
      saveHistory({
        label: `${req.file.originalname} — ${analysis.summary.totalRecords} registros`,
        format,
        records: analysis.summary.totalRecords,
        insightsCount: insights.length,
        inputContent: content,
        resultJson: JSON.stringify(resultData),
        userId: req.user?.userId,
      });
    } catch (e) {
      logger.warn("Falha ao salvar histórico (upload):", e);
    }

    logger.info(`Análise concluída: ${insights.length} insights gerados`);

    res.json({
      success: true,
      file: { name: req.file.originalname, size: req.file.size, format },
      data: resultData,
    });
  } catch (error) {
    logger.error("Erro no upload/analyze:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Erro ao processar o arquivo",
    });
  }
});

/**
 * POST /upload/report
 * Upload de arquivo + geração direta do PDF.
 */
router.post("/upload/report", upload.single("file"), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: "Nenhum arquivo enviado. Use o campo 'file'." });
      return;
    }

    const format = detectFormat(req.file);
    const content = req.file.buffer.toString("utf-8");

    logger.info(`Upload para relatório: ${req.file.originalname} (${format})`);

    const input = ReportRequestSchema.parse({
      format,
      content,
      title: req.body.title || "Relatório Automático",
      author: req.body.author || "Sistema de Relatórios IA",
      options: {
        language: req.body.language || "pt",
        includeRecommendations: req.body.includeRecommendations !== "false",
        includeExecutiveSummary: req.body.includeExecutiveSummary !== "false",
      },
    });

    const options = input.options;
    const { analysis } = await analyzeData(input);
    const { insights, executiveSummary, recommendations } = await generateInsights(analysis, options);
    const pdf = await buildPDF(
      { analysis, insights, executiveSummary, recommendations },
      { title: input.title, author: input.author }
    );

    await storageService.savePDF(pdf.filename, pdf.buffer);
    logger.info(`PDF gerado: ${pdf.filename} (${pdf.pages} páginas)`);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${pdf.filename}"`);
    res.setHeader("X-Report-Pages", String(pdf.pages));
    res.send(pdf.buffer);
  } catch (error) {
    logger.error("Erro no upload/report:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Erro ao gerar relatório",
    });
  }
});

export default router;
