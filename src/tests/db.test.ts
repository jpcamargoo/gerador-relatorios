import {
  saveHistory,
  listHistory,
  getHistoryById,
  findByHash,
  deleteHistory,
  clearHistory,
  hashInput,
} from "../services/dbService";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  ❌ FALHOU: ${message}`);
    failed++;
    process.exitCode = 1;
  } else {
    console.log(`  ✅ ${message}`);
    passed++;
  }
}

function describe(name: string, fn: () => Promise<void> | void): void {
  console.log(`\n📦 ${name}`);
  const result = fn();
  if (result instanceof Promise) result.catch(console.error);
}

const SAMPLE_RESULT = JSON.stringify({
  analysis: { summary: { totalRecords: 5, columns: 3 } },
  insights: [{ title: "Test", description: "Test", importance: "high", category: "geral" }],
  executiveSummary: "Resumo",
  recommendations: [],
});

// ─── Testes do DB Service ───────────────────────────────────────────

describe("hashInput", () => {
  const hash1 = hashInput("dados de teste");
  const hash2 = hashInput("dados de teste");
  const hash3 = hashInput("outros dados");

  assert(hash1 === hash2, "Mesmo input deve gerar mesmo hash");
  assert(hash1 !== hash3, "Inputs diferentes devem gerar hashes diferentes");
  assert(hash1.length === 64, "Hash SHA-256 deve ter 64 caracteres");
});

describe("saveHistory + listHistory", () => {
  // Limpar antes
  clearHistory();

  const id = saveHistory({
    label: "Teste 1",
    format: "csv",
    records: 10,
    insightsCount: 3,
    inputContent: "produto,vendas\nA,100\nB,200",
    resultJson: SAMPLE_RESULT,
  });

  assert(typeof id === "string", "save deve retornar um ID string");
  assert(id.length > 0, "ID não pode ser vazio");

  const { items, total } = listHistory();
  assert(total >= 1, "Deve ter pelo menos 1 registro");
  assert(items.some((i) => i.id === id), "Lista deve conter o item salvo");
  assert(items[0].label === "Teste 1", "Label correto");
  assert(items[0].records === 10, "Records correto");
  assert(items[0].insightsCount === 3, "InsightsCount correto");
});

describe("getHistoryById", () => {
  clearHistory();

  const id = saveHistory({
    label: "Detail Test",
    format: "json",
    records: 5,
    insightsCount: 2,
    inputContent: '{"data": "test"}',
    resultJson: SAMPLE_RESULT,
  });

  const entry = getHistoryById(id);
  assert(entry !== undefined, "Deve encontrar o item");
  assert(entry!.label === "Detail Test", "Label correto no detalhe");
  assert(entry!.format === "json", "Format correto");
  assert(entry!.result_json === SAMPLE_RESULT, "Resultado JSON armazenado");

  const missing = getHistoryById("nao-existe");
  assert(missing === undefined, "ID inexistente deve retornar undefined");
});

describe("findByHash (cache)", () => {
  clearHistory();

  const content = "dados,coluna\n1,2\n3,4";
  const id = saveHistory({
    label: "Cache Test",
    format: "csv",
    records: 2,
    insightsCount: 1,
    inputContent: content,
    resultJson: SAMPLE_RESULT,
  });

  const hash = hashInput(content);
  const cached = findByHash(hash);
  assert(cached !== undefined, "Deve encontrar pelo hash");
  assert(cached!.id === id, "Deve ser o mesmo item");
  assert(cached!.result_json === SAMPLE_RESULT, "Resultado em cache correto");

  const notFound = findByHash(hashInput("outro conteúdo"));
  assert(notFound === undefined, "Hash diferente não deve retornar resultado");
});

describe("deleteHistory", () => {
  clearHistory();

  const id = saveHistory({
    label: "Delete Test",
    format: "csv",
    records: 1,
    insightsCount: 0,
    inputContent: "x",
    resultJson: "{}",
  });

  const deleted = deleteHistory(id);
  assert(deleted === true, "Deve retornar true ao deletar existente");

  const entry = getHistoryById(id);
  assert(entry === undefined, "Item deletado não deve existir");

  const deletedAgain = deleteHistory(id);
  assert(deletedAgain === false, "Deletar inexistente deve retornar false");
});

describe("clearHistory", () => {
  saveHistory({ label: "A", format: "csv", records: 1, insightsCount: 0, inputContent: "a", resultJson: "{}" });
  saveHistory({ label: "B", format: "csv", records: 2, insightsCount: 0, inputContent: "b", resultJson: "{}" });

  const count = clearHistory();
  assert(count >= 2, "Deve deletar pelo menos 2 itens");

  const { total } = listHistory();
  assert(total === 0, "Tabela deve estar vazia após clear");
});

describe("listHistory — paginação", () => {
  clearHistory();

  for (let i = 0; i < 5; i++) {
    saveHistory({
      label: `Item ${i + 1}`,
      format: "csv",
      records: i,
      insightsCount: 0,
      inputContent: `content-${i}`,
      resultJson: "{}",
    });
  }

  const page1 = listHistory(2, 0);
  assert(page1.items.length === 2, "Primeira página deve ter 2 itens");
  assert(page1.total === 5, "Total deve ser 5");

  const page2 = listHistory(2, 2);
  assert(page2.items.length === 2, "Segunda página deve ter 2 itens");

  const page3 = listHistory(2, 4);
  assert(page3.items.length === 1, "Última página deve ter 1 item");

  clearHistory();
});

// ─── Resultado ──────────────────────────────────────────────────────

setTimeout(() => {
  console.log(`\n${"═".repeat(50)}`);
  console.log(`📊 Resultado: ${passed} passaram, ${failed} falharam (${passed + failed} total)`);
  console.log(`${"═".repeat(50)}\n`);
}, 100);
