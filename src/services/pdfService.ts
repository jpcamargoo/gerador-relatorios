import PDFDocument from "pdfkit";
import { DataAnalysis, Insight, Recommendation, PDFReport } from "../types";

interface PDFInput {
  title: string;
  author: string;
  generatedAt: Date;
  analysis: DataAnalysis;
  insights: Insight[];
  executiveSummary: string;
  recommendations: Recommendation[];
}

class PDFService {
  /**
   * Gera um relatório PDF completo a partir dos dados analisados.
   */
  async generate(input: PDFInput): Promise<PDFReport> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: { top: 60, bottom: 60, left: 50, right: 50 },
          info: {
            Title: input.title,
            Author: input.author,
            CreationDate: input.generatedAt,
          },
        });

        const chunks: Buffer[] = [];
        doc.on("data", (chunk: Buffer) => chunks.push(chunk));
        doc.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            filename: `relatorio_${Date.now()}.pdf`,
            generatedAt: input.generatedAt,
            pages: doc.bufferedPageRange().count,
          });
        });
        doc.on("error", reject);

        // ─── Capa ─────────────────────────────────────────────
        this.renderCover(doc, input);

        // ─── Resumo Executivo ────────────────────────────────
        if (input.executiveSummary) {
          doc.addPage();
          this.renderSection(doc, "Resumo Executivo", input.executiveSummary);
        }

        // ─── Dados Analisados ────────────────────────────────
        doc.addPage();
        this.renderAnalysis(doc, input.analysis);

        // ─── Insights ────────────────────────────────────────
        doc.addPage();
        this.renderInsights(doc, input.insights);

        // ─── Recomendações ───────────────────────────────────
        if (input.recommendations.length > 0) {
          doc.addPage();
          this.renderRecommendations(doc, input.recommendations);
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private renderCover(doc: PDFKit.PDFDocument, input: PDFInput): void {
    doc.moveDown(8);

    doc.fontSize(28).font("Helvetica-Bold").text(input.title, { align: "center" });
    doc.moveDown(2);

    doc.fontSize(14).font("Helvetica").fillColor("#666666").text("Relatório gerado automaticamente", { align: "center" });
    doc.moveDown(1);

    doc
      .fontSize(12)
      .text(`Autor: ${input.author}`, { align: "center" })
      .text(`Data: ${input.generatedAt.toLocaleDateString("pt-BR")}`, { align: "center" })
      .text(`Registros analisados: ${input.analysis.summary.totalRecords}`, { align: "center" });

    doc.fillColor("#000000");
  }

  private renderSection(doc: PDFKit.PDFDocument, title: string, content: string): void {
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#1a1a1a").text(title);
    doc.moveDown(0.5);
    doc
      .strokeColor("#3498db")
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(1);

    doc.fontSize(11).font("Helvetica").fillColor("#333333").text(content, {
      align: "justify",
      lineGap: 4,
    });
  }

  private renderAnalysis(doc: PDFKit.PDFDocument, analysis: DataAnalysis): void {
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#1a1a1a").text("Análise dos Dados");
    doc.moveDown(0.5);
    doc.strokeColor("#3498db").lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    // Resumo
    doc.fontSize(14).font("Helvetica-Bold").text("Visão Geral");
    doc.moveDown(0.5);
    doc.fontSize(11).font("Helvetica").fillColor("#333333");
    doc.text(`• Total de registros: ${analysis.summary.totalRecords}`);
    doc.text(`• Colunas: ${analysis.summary.columns}`);
    doc.text(`• Tipos de dados: ${Object.entries(analysis.summary.dataTypes).map(([k, v]) => `${k} (${v})`).join(", ")}`);
    doc.moveDown(1);

    // Estatísticas numéricas
    const numericKeys = Object.keys(analysis.statistics.numeric);
    if (numericKeys.length > 0) {
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#1a1a1a").text("Estatísticas Numéricas");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").fillColor("#333333");

      numericKeys.forEach((key) => {
        const stats = analysis.statistics.numeric[key];
        doc.text(`${key}: min=${stats.min}, max=${stats.max}, média=${stats.mean.toFixed(2)}, mediana=${stats.median}`);
      });
      doc.moveDown(1);
    }

    // Estatísticas categóricas
    const catKeys = Object.keys(analysis.statistics.categorical);
    if (catKeys.length > 0) {
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#1a1a1a").text("Estatísticas Categóricas");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica").fillColor("#333333");

      catKeys.forEach((key) => {
        const stats = analysis.statistics.categorical[key];
        doc.text(`${key}: ${stats.uniqueValues} valores únicos — Top: ${stats.topValues.map((t) => `${t.value} (${t.count})`).join(", ")}`);
      });
    }
  }

  private renderInsights(doc: PDFKit.PDFDocument, insights: Insight[]): void {
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#1a1a1a").text("Insights");
    doc.moveDown(0.5);
    doc.strokeColor("#3498db").lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    const colorMap = { high: "#e74c3c", medium: "#f39c12", low: "#27ae60" };

    insights.forEach((insight, idx) => {
      const color = colorMap[insight.importance] || "#333333";

      doc.fontSize(13).font("Helvetica-Bold").fillColor(color).text(`${idx + 1}. ${insight.title}`);
      doc.fontSize(10).font("Helvetica").fillColor("#555555").text(`[${insight.importance.toUpperCase()}] ${insight.category}`);
      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica").fillColor("#333333").text(insight.description, { lineGap: 3 });
      doc.moveDown(0.8);
    });
  }

  private renderRecommendations(doc: PDFKit.PDFDocument, recommendations: Recommendation[]): void {
    doc.fontSize(20).font("Helvetica-Bold").fillColor("#1a1a1a").text("Recomendações");
    doc.moveDown(0.5);
    doc.strokeColor("#3498db").lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(1);

    const priorityLabel = { high: "🔴 Alta", medium: "🟡 Média", low: "🟢 Baixa" };

    recommendations.forEach((rec, idx) => {
      doc.fontSize(13).font("Helvetica-Bold").fillColor("#1a1a1a").text(`${idx + 1}. ${rec.title}`);
      doc.fontSize(10).font("Helvetica").fillColor("#666666").text(`Prioridade: ${priorityLabel[rec.priority] || rec.priority}`);
      doc.moveDown(0.3);
      doc.fontSize(11).font("Helvetica").fillColor("#333333").text(rec.description, { lineGap: 3 });
      doc.moveDown(0.3);

      if (rec.actionItems.length > 0) {
        doc.fontSize(10).font("Helvetica-Bold").text("Ações:");
        rec.actionItems.forEach((item) => {
          doc.fontSize(10).font("Helvetica").text(`  → ${item}`);
        });
      }
      doc.moveDown(0.8);
    });
  }
}

export const pdfService = new PDFService();
