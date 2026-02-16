import fs from "fs/promises";
import path from "path";
import { config } from "../config/env";

/**
 * Serviço de armazenamento para salvar relatórios e arquivos gerados.
 */
class StorageService {
  private storageDir: string;
  private outputDir: string;

  constructor() {
    this.storageDir = path.resolve(config.STORAGE_DIR);
    this.outputDir = path.resolve(config.PDF_OUTPUT_DIR);
  }

  async init(): Promise<void> {
    await fs.mkdir(this.storageDir, { recursive: true });
    await fs.mkdir(this.outputDir, { recursive: true });
  }

  /**
   * Salva um buffer de PDF no diretório de saída.
   */
  async savePDF(filename: string, buffer: Buffer): Promise<string> {
    const filePath = path.join(this.outputDir, filename);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  /**
   * Salva dados JSON no storage.
   */
  async saveJSON(filename: string, data: unknown): Promise<string> {
    const filePath = path.join(this.storageDir, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    return filePath;
  }

  /**
   * Lê um arquivo do storage.
   */
  async readFile(filename: string): Promise<Buffer> {
    const filePath = path.join(this.storageDir, filename);
    return fs.readFile(filePath);
  }

  /**
   * Lista arquivos no diretório de saída.
   */
  async listOutputFiles(): Promise<string[]> {
    const files = await fs.readdir(this.outputDir);
    return files.filter((f) => f.endsWith(".pdf"));
  }

  /**
   * Remove um arquivo do diretório de saída.
   */
  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.outputDir, filename);
    await fs.unlink(filePath);
  }
}

export const storageService = new StorageService();
