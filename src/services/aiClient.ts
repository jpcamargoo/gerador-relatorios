import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config/env";

/**
 * Cliente de IA abstrato que suporta OpenAI, Anthropic, Azure OpenAI e GitHub Models.
 */
class AIClient {
  private provider: string;
  private openai?: OpenAI;
  private anthropic?: Anthropic;

  constructor() {
    this.provider = config.AI_PROVIDER;
    this.initClient();
  }

  private initClient(): void {
    switch (this.provider) {
      case "github":
        if (!config.GITHUB_TOKEN) {
          console.warn("⚠️  GITHUB_TOKEN não configurado. IA desativada.");
          return;
        }
        this.openai = new OpenAI({
          apiKey: config.GITHUB_TOKEN,
          baseURL: "https://models.inference.ai.azure.com",
        });
        console.log(`✅ GitHub Models configurado (modelo: ${config.GITHUB_MODEL})`);
        break;

      case "openai":
        if (!config.OPENAI_API_KEY) {
          console.warn("⚠️  OPENAI_API_KEY não configurada. IA desativada.");
          return;
        }
        this.openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
        break;

      case "anthropic":
        if (!config.ANTHROPIC_API_KEY) {
          console.warn("⚠️  ANTHROPIC_API_KEY não configurada. IA desativada.");
          return;
        }
        this.anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });
        break;

      case "azure":
        if (!config.AZURE_OPENAI_API_KEY || !config.AZURE_OPENAI_ENDPOINT) {
          console.warn("⚠️  Azure OpenAI não configurado. IA desativada.");
          return;
        }
        this.openai = new OpenAI({
          apiKey: config.AZURE_OPENAI_API_KEY,
          baseURL: `${config.AZURE_OPENAI_ENDPOINT}/openai/deployments/${config.AZURE_OPENAI_DEPLOYMENT}`,
          defaultQuery: { "api-version": "2024-02-15-preview" },
          defaultHeaders: { "api-key": config.AZURE_OPENAI_API_KEY },
        });
        break;
    }
  }

  /**
   * Envia uma mensagem para a IA e retorna a resposta.
   */
  async chat(prompt: string): Promise<string> {
    try {
      switch (this.provider) {
        case "github":
        case "openai":
        case "azure":
          return await this.chatOpenAI(prompt);
        case "anthropic":
          return await this.chatAnthropic(prompt);
        default:
          return this.fallbackResponse(prompt);
      }
    } catch (error) {
      console.error("Erro na chamada de IA:", error);
      return this.fallbackResponse(prompt);
    }
  }

  private async chatOpenAI(prompt: string): Promise<string> {
    if (!this.openai) return this.fallbackResponse(prompt);

    const model = this.provider === "github"
      ? config.GITHUB_MODEL
      : this.provider === "azure"
        ? (config.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4")
        : "gpt-4";

    const response = await this.openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "Você é um analista de dados especializado em gerar insights e recomendações. Responda sempre de forma estruturada e profissional.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content ?? "";
  }

  private async chatAnthropic(prompt: string): Promise<string> {
    if (!this.anthropic) return this.fallbackResponse(prompt);

    const response = await this.anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
      system:
        "Você é um analista de dados especializado em gerar insights e recomendações. Responda sempre de forma estruturada e profissional.",
    });

    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  }

  private fallbackResponse(_prompt: string): string {
    return JSON.stringify([
      {
        title: "Análise automática (sem IA)",
        description:
          "A IA não está configurada. Configure OPENAI_API_KEY, ANTHROPIC_API_KEY ou Azure OpenAI para obter insights inteligentes.",
        importance: "medium",
        category: "configuração",
      },
    ]);
  }
}

export const aiClient = new AIClient();
