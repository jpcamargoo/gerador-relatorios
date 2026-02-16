import { ParsedData, DataAnalysis, DataInput } from "../types";
import { parseCSV, parseJSON, parseText } from "../utils/parsers";

/**
 * Pipeline de análise de dados.
 * Recebe dados brutos, faz parsing e retorna análise estruturada.
 */
export async function analyzeData(input: DataInput): Promise<{ parsed: ParsedData; analysis: DataAnalysis }> {
  // 1. Parse dos dados conforme formato
  const parsed = parseInput(input);

  // 2. Análise estatística
  const analysis = buildAnalysis(parsed);

  return { parsed, analysis };
}

function parseInput(input: DataInput): ParsedData {
  switch (input.format) {
    case "csv":
      return parseCSV(input.content);
    case "json":
      return parseJSON(input.content);
    case "text":
      return parseText(input.content);
    default:
      throw new Error(`Formato não suportado: ${input.format}`);
  }
}

function buildAnalysis(parsed: ParsedData): DataAnalysis {
  const { headers, rows } = parsed;

  // Contagem de nulos
  const nullCounts: Record<string, number> = {};
  headers.forEach((h) => {
    nullCounts[h] = rows.filter((r) => r[h] === null || r[h] === undefined || r[h] === "").length;
  });

  // Classificar colunas numéricas e categóricas
  const numericStats: DataAnalysis["statistics"]["numeric"] = {};
  const categoricalStats: DataAnalysis["statistics"]["categorical"] = {};
  const categories: string[] = [];

  headers.forEach((header) => {
    const values = rows.map((r) => r[header]).filter((v) => v !== null && v !== undefined && v !== "");
    const numericValues = values.map(Number).filter((v) => !isNaN(v));

    if (numericValues.length > values.length * 0.5 && numericValues.length > 0) {
      // Coluna numérica
      const sorted = [...numericValues].sort((a, b) => a - b);
      numericStats[header] = {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
        median: sorted[Math.floor(sorted.length / 2)],
      };
    } else {
      // Coluna categórica
      const freq: Record<string, number> = {};
      values.forEach((v) => {
        const key = String(v);
        freq[key] = (freq[key] || 0) + 1;
      });

      const topValues = Object.entries(freq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }));

      categoricalStats[header] = {
        uniqueValues: Object.keys(freq).length,
        topValues,
      };

      categories.push(header);
    }
  });

  return {
    summary: {
      totalRecords: parsed.totalRecords,
      columns: headers.length,
      dataTypes: parsed.dataTypes,
      nullCounts,
    },
    statistics: {
      numeric: numericStats,
      categorical: categoricalStats,
    },
    categories,
  };
}
