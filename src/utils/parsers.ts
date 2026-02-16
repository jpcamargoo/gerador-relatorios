import { ParsedData } from "../types";

/**
 * Parser de CSV para ParsedData.
 */
export function parseCSV(content: string): ParsedData {
  const lines = content.trim().split("\n");
  if (lines.length < 2) {
    throw new Error("CSV deve conter pelo menos um cabeçalho e uma linha de dados");
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    const row: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim().replace(/^"|"$/g, "") ?? null;
    });
    rows.push(row);
  }

  const dataTypes = detectDataTypes(headers, rows);

  return { headers, rows, totalRecords: rows.length, dataTypes };
}

/**
 * Parser de JSON para ParsedData.
 */
export function parseJSON(content: string): ParsedData {
  const data = JSON.parse(content);
  const items: Record<string, unknown>[] = Array.isArray(data) ? data : [data];

  if (items.length === 0) {
    throw new Error("JSON não contém dados");
  }

  const headers = [...new Set(items.flatMap((item) => Object.keys(item)))];
  const dataTypes = detectDataTypes(headers, items);

  return { headers, rows: items, totalRecords: items.length, dataTypes };
}

/**
 * Parser de texto livre para ParsedData.
 * Tenta extrair dados estruturados de texto.
 */
export function parseText(content: string): ParsedData {
  const lines = content
    .trim()
    .split("\n")
    .filter((l) => l.trim());

  // Tentar detectar separadores comuns
  const separators = ["\t", ";", "|"];
  let bestSeparator = "";
  let maxCols = 0;

  for (const sep of separators) {
    const cols = lines[0].split(sep).length;
    if (cols > maxCols) {
      maxCols = cols;
      bestSeparator = sep;
    }
  }

  if (maxCols > 1 && bestSeparator) {
    // Dados tabulares detectados
    const headers = lines[0].split(bestSeparator).map((h) => h.trim());
    const rows: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(bestSeparator);
      const row: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx]?.trim() ?? null;
      });
      rows.push(row);
    }

    const dataTypes = detectDataTypes(headers, rows);
    return { headers, rows, totalRecords: rows.length, dataTypes };
  }

  // Texto livre — cada linha vira um registro
  const headers = ["linha", "conteudo"];
  const rows = lines.map((line, idx) => ({
    linha: idx + 1,
    conteudo: line.trim(),
  }));

  return {
    headers,
    rows,
    totalRecords: rows.length,
    dataTypes: { linha: "number", conteudo: "string" },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function detectDataTypes(
  headers: string[],
  rows: Record<string, unknown>[]
): Record<string, string> {
  const types: Record<string, string> = {};

  headers.forEach((header) => {
    const sample = rows
      .map((r) => r[header])
      .filter((v) => v !== null && v !== undefined && v !== "")
      .slice(0, 20);

    if (sample.length === 0) {
      types[header] = "unknown";
      return;
    }

    const numericCount = sample.filter((v) => !isNaN(Number(v))).length;
    const boolCount = sample.filter(
      (v) => String(v).toLowerCase() === "true" || String(v).toLowerCase() === "false"
    ).length;
    const dateCount = sample.filter((v) => !isNaN(Date.parse(String(v)))).length;

    if (numericCount > sample.length * 0.8) {
      types[header] = "number";
    } else if (boolCount > sample.length * 0.8) {
      types[header] = "boolean";
    } else if (dateCount > sample.length * 0.8 && numericCount < sample.length * 0.5) {
      types[header] = "date";
    } else {
      types[header] = "string";
    }
  });

  return types;
}
