import { DataAnalysis, Insight, Recommendation } from "../types";
import { aiClient } from "../services/aiClient";

/**
 * Pipeline de geração de insights via IA.
 * Recebe a análise dos dados e retorna insights, resumo e recomendações.
 */
export async function generateInsights(
  analysis: DataAnalysis,
  options: { language: string; includeRecommendations: boolean; includeExecutiveSummary: boolean }
): Promise<{
  insights: Insight[];
  executiveSummary: string;
  recommendations: Recommendation[];
}> {
  const lang = options.language === "pt" ? "português brasileiro" : "English";

  // 1. Gerar insights
  const insightsPrompt = buildInsightsPrompt(analysis, lang);
  const insightsRaw = await aiClient.chat(insightsPrompt);
  const insights = parseInsights(insightsRaw);

  // 2. Resumo executivo
  let executiveSummary = "";
  if (options.includeExecutiveSummary) {
    const summaryPrompt = buildSummaryPrompt(analysis, insights, lang);
    executiveSummary = await aiClient.chat(summaryPrompt);
  }

  // 3. Recomendações
  let recommendations: Recommendation[] = [];
  if (options.includeRecommendations) {
    const recsPrompt = buildRecommendationsPrompt(analysis, insights, lang);
    const recsRaw = await aiClient.chat(recsPrompt);
    recommendations = parseRecommendations(recsRaw);
  }

  return { insights, executiveSummary, recommendations };
}

// ─── Prompts ────────────────────────────────────────────────────────

function buildInsightsPrompt(analysis: DataAnalysis, lang: string): string {
  return `Você é um analista de dados experiente. Analise os dados a seguir e gere insights relevantes.
Responda em ${lang}.

Dados analisados:
- Total de registros: ${analysis.summary.totalRecords}
- Colunas: ${analysis.summary.columns}
- Tipos de dados: ${JSON.stringify(analysis.summary.dataTypes)}
- Estatísticas numéricas: ${JSON.stringify(analysis.statistics.numeric)}
- Estatísticas categóricas: ${JSON.stringify(analysis.statistics.categorical)}
- Categorias encontradas: ${analysis.categories.join(", ")}
- Valores nulos: ${JSON.stringify(analysis.summary.nullCounts)}

Retorne um JSON array com objetos no formato:
[{"title": "...", "description": "...", "importance": "high|medium|low", "category": "..."}]

Retorne APENAS o JSON, sem texto adicional.`;
}

function buildSummaryPrompt(analysis: DataAnalysis, insights: Insight[], lang: string): string {
  return `Você é um consultor executivo. Com base nos dados e insights abaixo, escreva um resumo executivo conciso (3-5 parágrafos).
Responda em ${lang}.

Dados:
- ${analysis.summary.totalRecords} registros analisados
- ${analysis.summary.columns} colunas
- Categorias: ${analysis.categories.join(", ")}

Insights principais:
${insights.map((i) => `- [${i.importance}] ${i.title}: ${i.description}`).join("\n")}

Escreva o resumo executivo em texto corrido, profissional e objetivo.`;
}

function buildRecommendationsPrompt(analysis: DataAnalysis, insights: Insight[], lang: string): string {
  return `Você é um consultor estratégico. Com base nos dados e insights, gere recomendações acionáveis.
Responda em ${lang}.

Análise resumida:
- ${analysis.summary.totalRecords} registros, ${analysis.summary.columns} colunas
- Insights: ${insights.map((i) => i.title).join("; ")}

Retorne um JSON array com objetos no formato:
[{"title": "...", "description": "...", "priority": "high|medium|low", "actionItems": ["...", "..."]}]

Retorne APENAS o JSON, sem texto adicional.`;
}

// ─── Parsers de resposta da IA ──────────────────────────────────────

function parseInsights(raw: string): Insight[] {
  try {
    const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [
      {
        title: "Análise geral",
        description: raw.trim(),
        importance: "medium",
        category: "geral",
      },
    ];
  }
}

function parseRecommendations(raw: string): Recommendation[] {
  try {
    const cleaned = raw.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [
      {
        title: "Recomendação geral",
        description: raw.trim(),
        priority: "medium",
        actionItems: ["Revisar os dados manualmente"],
      },
    ];
  }
}
