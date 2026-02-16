import {
  registerUser,
  loginUser,
  refreshAccessToken,
  verifyAccessToken,
  getUserProfile,
} from "../services/authService";
import { findUserByEmail, clearHistory } from "../services/dbService";

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

async function describe(name: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n📦 ${name}`);
  await fn();
}

// ─── Helpers ────────────────────────────────────────────────────────

function cleanUp() {
  // Limpar users diretamente via db
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getDb } = require("../services/dbService");
    if (typeof getDb === "function") getDb().exec("DELETE FROM users");
  } catch {
    // getDb não é exportado, vamos ignorar — testes criarão emails únicos
  }
  clearHistory();
}

const unique = () => `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ─── Testes ─────────────────────────────────────────────────────────

(async () => {
  await describe("registerUser", async () => {
    const email = `${unique()}@test.com`;
    const result = await registerUser("Test User", email, "senha123");

    assert(typeof result.user.id === "string", "Deve retornar user.id string");
    assert(result.user.name === "Test User", "Nome correto");
    assert(result.user.email === email, "Email correto");
    assert(typeof result.tokens.accessToken === "string", "Deve retornar accessToken");
    assert(typeof result.tokens.refreshToken === "string", "Deve retornar refreshToken");
    assert(result.tokens.accessToken.length > 0, "accessToken não vazio");
    assert(result.tokens.refreshToken.length > 0, "refreshToken não vazio");
  });

  await describe("registerUser — email duplicado", async () => {
    const email = `${unique()}@test.com`;
    await registerUser("User A", email, "senha123");

    let error = "";
    try {
      await registerUser("User B", email, "outra123");
    } catch (e) {
      error = (e as Error).message;
    }
    assert(error.includes("já cadastrado"), "Deve rejeitar email duplicado");
  });

  await describe("registerUser — senha curta", async () => {
    const email = `${unique()}@test.com`;
    let error = "";
    try {
      await registerUser("Short", email, "123");
    } catch (e) {
      error = (e as Error).message;
    }
    assert(error.includes("6 caracteres"), "Deve exigir mínimo de 6 caracteres");
  });

  await describe("loginUser", async () => {
    const email = `${unique()}@test.com`;
    await registerUser("Login User", email, "senha123");

    const result = await loginUser(email, "senha123");
    assert(result.user.email === email, "Email correto no login");
    assert(typeof result.tokens.accessToken === "string", "Deve retornar accessToken no login");
  });

  await describe("loginUser — credenciais inválidas", async () => {
    const email = `${unique()}@test.com`;
    await registerUser("Bad Pass", email, "senha123");

    let error = "";
    try {
      await loginUser(email, "errada");
    } catch (e) {
      error = (e as Error).message;
    }
    assert(error.includes("inválidas"), "Deve rejeitar senha errada");

    error = "";
    try {
      await loginUser("inexistente@test.com", "abc123");
    } catch (e) {
      error = (e as Error).message;
    }
    assert(error.includes("inválidas"), "Deve rejeitar email inexistente");
  });

  await describe("verifyAccessToken", async () => {
    const email = `${unique()}@test.com`;
    const { tokens } = await registerUser("Verify User", email, "senha123");

    const payload = verifyAccessToken(tokens.accessToken);
    assert(typeof payload.userId === "string", "Payload deve ter userId");
    assert(payload.email === email, "Payload deve ter email correto");
  });

  await describe("verifyAccessToken — token inválido", async () => {
    let error = "";
    try {
      verifyAccessToken("token-invalido");
    } catch (e) {
      error = (e as Error).message;
    }
    assert(error.includes("inválido"), "Deve rejeitar token inválido");
  });

  await describe("refreshAccessToken", async () => {
    const email = `${unique()}@test.com`;
    const { tokens } = await registerUser("Refresh User", email, "senha123");

    const newTokens = refreshAccessToken(tokens.refreshToken);
    assert(typeof newTokens.accessToken === "string", "Novo accessToken");
    assert(typeof newTokens.refreshToken === "string", "Novo refreshToken");

    // Verificar que novo access é válido
    const payload = verifyAccessToken(newTokens.accessToken);
    assert(payload.email === email, "Novo token deve ter email correto");
  });

  await describe("refreshAccessToken — token inválido", async () => {
    let error = "";
    try {
      refreshAccessToken("token-lixo");
    } catch (e) {
      error = (e as Error).message;
    }
    assert(error.includes("inválido"), "Deve rejeitar refresh inválido");
  });

  await describe("getUserProfile", async () => {
    const email = `${unique()}@test.com`;
    const { user } = await registerUser("Profile User", email, "senha123");

    const profile = getUserProfile(user.id);
    assert(profile !== null, "Deve encontrar o perfil");
    assert(profile!.name === "Profile User", "Nome correto no perfil");
    assert(profile!.email === email, "Email correto no perfil");

    const missing = getUserProfile("id-inexistente");
    assert(missing === null, "Perfil inexistente deve retornar null");
  });

  await describe("findUserByEmail (dbService)", async () => {
    const email = `${unique()}@test.com`;
    await registerUser("DB User", email, "senha123");

    const row = findUserByEmail(email);
    assert(row !== undefined, "Deve encontrar usuário por email");
    assert(row!.email === email, "Email correto");
    assert(typeof row!.password_hash === "string", "Deve ter password_hash");
    assert(row!.password_hash.startsWith("$2"), "Hash deve ser bcrypt ($2)");
  });

  // ─── Resumo ─────────────────────────────────────────────────────

  console.log(`\n${"═".repeat(50)}`);
  console.log(`📊 Resultado: ${passed} passaram, ${failed} falharam (${passed + failed} total)`);
  console.log(`${"═".repeat(50)}\n`);
})();
