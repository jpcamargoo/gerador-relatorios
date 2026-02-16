import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";
import { logger } from "../utils/logger";

const DB_PATH = path.resolve(process.cwd(), "storage", "reports.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initTables(db);
    logger.info(`SQLite conectado em ${DB_PATH}`);
  }
  return db;
}

function initTables(d: Database.Database) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      label TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'csv',
      records INTEGER NOT NULL DEFAULT 0,
      insights_count INTEGER NOT NULL DEFAULT 0,
      input_hash TEXT,
      input_content TEXT,
      result_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_history_input_hash ON history(input_hash);
    CREATE INDEX IF NOT EXISTS idx_history_user_id ON history(user_id);
  `);

  // Migração: adicionar user_id se a tabela já existe sem ela
  try {
    d.prepare("SELECT user_id FROM history LIMIT 1").get();
  } catch {
    d.exec("ALTER TABLE history ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE");
    d.exec("CREATE INDEX IF NOT EXISTS idx_history_user_id ON history(user_id)");
    logger.info("Migração: coluna user_id adicionada à tabela history");
  }
}

// ─── Tipos ──────────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface HistoryRow {
  id: string;
  user_id: string | null;
  label: string;
  format: string;
  records: number;
  insights_count: number;
  input_hash: string | null;
  input_content: string | null;
  result_json: string | null;
  created_at: string;
}

export interface HistoryListItem {
  id: string;
  label: string;
  format: string;
  records: number;
  insightsCount: number;
  createdAt: string;
}

// ─── Hash para cache ────────────────────────────────────────────────

export function hashInput(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

// ─── Users CRUD ─────────────────────────────────────────────────────

export function createUser(user: { name: string; email: string; passwordHash: string }): string {
  const d = getDb();
  const id = crypto.randomUUID();
  d.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)").run(
    id,
    user.name,
    user.email,
    user.passwordHash
  );
  logger.info(`Usuário criado: ${id} (${user.email})`);
  return id;
}

export function findUserByEmail(email: string): UserRow | undefined {
  const d = getDb();
  return d.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
}

export function findUserById(id: string): UserRow | undefined {
  const d = getDb();
  return d.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

// ─── CRUD ───────────────────────────────────────────────────────────

export function saveHistory(entry: {
  label: string;
  format: string;
  records: number;
  insightsCount: number;
  inputContent: string;
  resultJson: string;
  userId?: string;
}): string {
  const d = getDb();
  const id = crypto.randomUUID();
  const inputHash = hashInput(entry.inputContent);

  d.prepare(`
    INSERT INTO history (id, user_id, label, format, records, insights_count, input_hash, input_content, result_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    entry.userId ?? null,
    entry.label,
    entry.format,
    entry.records,
    entry.insightsCount,
    inputHash,
    entry.inputContent,
    entry.resultJson
  );

  logger.info(`Histórico salvo: ${id} (${entry.label})`);
  return id;
}

export function listHistory(limit = 20, offset = 0, userId?: string): { items: HistoryListItem[]; total: number } {
  const d = getDb();

  if (userId) {
    const total = (d.prepare("SELECT COUNT(*) as count FROM history WHERE user_id = ?").get(userId) as { count: number }).count;
    const rows = d
      .prepare("SELECT id, label, format, records, insights_count, created_at FROM history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
      .all(userId, limit, offset) as HistoryRow[];
    return {
      items: rows.map((r) => ({ id: r.id, label: r.label, format: r.format, records: r.records, insightsCount: r.insights_count, createdAt: r.created_at })),
      total,
    };
  }

  const total = (d.prepare("SELECT COUNT(*) as count FROM history").get() as { count: number }).count;

  const rows = d
    .prepare("SELECT id, label, format, records, insights_count, created_at FROM history ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as HistoryRow[];

  return {
    items: rows.map((r) => ({
      id: r.id,
      label: r.label,
      format: r.format,
      records: r.records,
      insightsCount: r.insights_count,
      createdAt: r.created_at,
    })),
    total,
  };
}

export function getHistoryById(id: string): HistoryRow | undefined {
  const d = getDb();
  return d.prepare("SELECT * FROM history WHERE id = ?").get(id) as HistoryRow | undefined;
}

export function findByHash(inputHash: string): HistoryRow | undefined {
  const d = getDb();
  return d
    .prepare("SELECT * FROM history WHERE input_hash = ? ORDER BY created_at DESC LIMIT 1")
    .get(inputHash) as HistoryRow | undefined;
}

export function deleteHistory(id: string): boolean {
  const d = getDb();
  const result = d.prepare("DELETE FROM history WHERE id = ?").run(id);
  return result.changes > 0;
}

export function clearHistory(): number {
  const d = getDb();
  const result = d.prepare("DELETE FROM history").run();
  return result.changes;
}

export function clearUserHistory(userId: string): number {
  const d = getDb();
  const result = d.prepare("DELETE FROM history WHERE user_id = ?").run(userId);
  return result.changes;
}

export function closeDb() {
  if (db) {
    db.close();
    logger.info("SQLite desconectado");
  }
}
