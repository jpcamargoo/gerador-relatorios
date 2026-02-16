import { ReportResult, PDFReport } from "../types";
import { pdfService } from "../services/pdfService";

/**
 * Pipeline de construção do PDF.
 * Recebe o resultado do relatório e gera o documento PDF final.
 */
export async function buildPDF(
  report: ReportResult,
  options: { title: string; author: string }
): Promise<PDFReport> {
  const pdf = await pdfService.generate({
    title: options.title,
    author: options.author,
    generatedAt: new Date(),
    analysis: report.analysis,
    insights: report.insights,
    executiveSummary: report.executiveSummary,
    recommendations: report.recommendations,
  });

  return pdf;
}
