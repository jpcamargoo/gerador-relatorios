import { analyzeData } from "../pipelines/analyzeData";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  ❌ FALHOU: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✅ ${message}`);
  }
}

function describe(name: string, fn: () => Promise<void> | void): void {
  console.log(`\n📦 ${name}`);
  const result = fn();
  if (result instanceof Promise) result.catch(console.error);
}

// ─── Testes do Pipeline  ────────────────────────────────────────────

describe("analyzeData — CSV", async () => {
  const input = {
    format: "csv" as const,
    content: `produto,vendas,regiao,satisfacao
Notebook,150,Sul,4.5
Smartphone,320,Sudeste,4.2
Tablet,85,Norte,3.8
Monitor,200,Sudeste,4.7
Teclado,95,Sul,4.0`,
    options: { language: "pt" as const, includeRecommendations: true, includeExecutiveSummary: true },
  };

  const { parsed, analysis } = await analyzeData(input);

  assert(parsed.totalRecords === 5, "Deve ter 5 registros");
  assert(parsed.headers.length === 4, "Deve ter 4 colunas");

  assert(analysis.summary.totalRecords === 5, "Summary deve ter 5 registros");
  assert(analysis.summary.columns === 4, "Summary deve ter 4 colunas");

  // Estatísticas numéricas
  assert("vendas" in analysis.statistics.numeric, "'vendas' deve ter estatísticas numéricas");
  assert(analysis.statistics.numeric["vendas"].min === 85, "Min vendas = 85");
  assert(analysis.statistics.numeric["vendas"].max === 320, "Max vendas = 320");

  assert("satisfacao" in analysis.statistics.numeric, "'satisfacao' deve ter estatísticas numéricas");

  // Estatísticas categóricas
  assert("regiao" in analysis.statistics.categorical, "'regiao' deve ter estatísticas categóricas");
  assert(analysis.statistics.categorical["regiao"].uniqueValues === 3, "Deve ter 3 regiões únicas");

  // Categorias
  assert(analysis.categories.includes("regiao"), "'regiao' deve estar nas categorias");
});

describe("analyzeData — JSON", async () => {
  const input = {
    format: "json" as const,
    content: JSON.stringify([
      { nome: "Alice", score: 95 },
      { nome: "Bob", score: 82 },
      { nome: "Carol", score: 91 },
    ]),
    options: { language: "pt" as const, includeRecommendations: true, includeExecutiveSummary: true },
  };

  const { analysis } = await analyzeData(input);

  assert(analysis.summary.totalRecords === 3, "Deve ter 3 registros");
  assert("score" in analysis.statistics.numeric, "'score' deve ser numérico");
  assert(analysis.statistics.numeric["score"].mean === 89.33333333333333, "Média de score correta");
});

describe("analyzeData — nulls", async () => {
  const input = {
    format: "csv" as const,
    content: `nome,valor
A,10
B,
C,30
D,`,
    options: { language: "pt" as const, includeRecommendations: true, includeExecutiveSummary: true },
  };

  const { analysis } = await analyzeData(input);

  assert(analysis.summary.nullCounts["valor"] === 2, "Deve detectar 2 nulos em 'valor'");
});

console.log("\n─── Testes concluídos ───\n");
