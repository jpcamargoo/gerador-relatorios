import { parseCSV, parseJSON, parseText } from "../utils/parsers";

// ─── Testes dos Parsers ─────────────────────────────────────────────

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  ❌ FALHOU: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`  ✅ ${message}`);
  }
}

function describe(name: string, fn: () => void): void {
  console.log(`\n📦 ${name}`);
  fn();
}

// ─── CSV ────────────────────────────────────────────────────────────

describe("parseCSV", () => {
  const csv = `nome,idade,cidade
João,30,São Paulo
Maria,25,Rio de Janeiro
Pedro,35,Belo Horizonte`;

  const result = parseCSV(csv);

  assert(result.totalRecords === 3, "Deve ter 3 registros");
  assert(result.headers.length === 3, "Deve ter 3 colunas");
  assert(result.headers.includes("nome"), "Deve conter coluna 'nome'");
  assert(result.headers.includes("idade"), "Deve conter coluna 'idade'");
  assert(result.rows[0]["nome"] === "João", "Primeiro nome deve ser João");
  assert(result.dataTypes["idade"] === "number", "'idade' deve ser do tipo number");
  assert(result.dataTypes["nome"] === "string", "'nome' deve ser do tipo string");
});

describe("parseCSV — com aspas", () => {
  const csv = `produto,descricao,preco
"Notebook Pro","Notebook com 16GB, SSD",4500
"Mouse","Mouse wireless",89`;

  const result = parseCSV(csv);

  assert(result.totalRecords === 2, "Deve ter 2 registros");
  assert(String(result.rows[0]["descricao"]).includes("SSD"), "Deve lidar com vírgula dentro de aspas");
});

// ─── JSON ───────────────────────────────────────────────────────────

describe("parseJSON — array", () => {
  const json = JSON.stringify([
    { produto: "A", vendas: 100, ativo: true },
    { produto: "B", vendas: 250, ativo: false },
    { produto: "C", vendas: 80, ativo: true },
  ]);

  const result = parseJSON(json);

  assert(result.totalRecords === 3, "Deve ter 3 registros");
  assert(result.headers.includes("produto"), "Deve conter coluna 'produto'");
  assert(result.headers.includes("vendas"), "Deve conter coluna 'vendas'");
  assert(result.dataTypes["vendas"] === "number", "'vendas' deve ser number");
});

describe("parseJSON — objeto único", () => {
  const json = JSON.stringify({ nome: "Teste", valor: 42 });

  const result = parseJSON(json);

  assert(result.totalRecords === 1, "Deve ter 1 registro");
  assert(result.rows[0]["nome"] === "Teste", "Nome deve ser 'Teste'");
});

// ─── Text ───────────────────────────────────────────────────────────

describe("parseText — com separador tab", () => {
  const text = `nome\tidade\tcidade
João\t30\tSP
Maria\t25\tRJ`;

  const result = parseText(text);

  assert(result.totalRecords === 2, "Deve ter 2 registros");
  assert(result.headers.includes("nome"), "Deve detectar cabeçalho 'nome'");
});

describe("parseText — texto livre", () => {
  const text = `Linha um de dados
Linha dois com informações
Terceira linha aqui`;

  const result = parseText(text);

  assert(result.totalRecords === 3, "Deve ter 3 linhas");
  assert(result.headers.includes("conteudo"), "Deve usar 'conteudo' como header");
});

// ─── Fim ────────────────────────────────────────────────────────────
console.log("\n─── Testes concluídos ───\n");
