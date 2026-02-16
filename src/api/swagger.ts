export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Gerador de Relatórios Automáticos",
    description:
      "API para transformar dados brutos (JSON, CSV, texto) em relatórios completos com análise, insights via IA e exportação para PDF.",
    version: "1.0.0",
    license: { name: "MIT" },
  },
  servers: [{ url: "http://localhost:3000", description: "Desenvolvimento" }],
  tags: [
    { name: "Autenticação", description: "Registro, login e gerenciamento de tokens JWT" },
    { name: "Análise", description: "Endpoints de análise de dados" },
    { name: "Relatório", description: "Geração de relatórios PDF" },
    { name: "Upload", description: "Upload de arquivos para análise" },
    { name: "Histórico", description: "Histórico de análises (SQLite)" },
    { name: "Sistema", description: "Health check e informações" },
  ],
  paths: {
    "/api/auth/register": {
      post: {
        tags: ["Autenticação"],
        summary: "Registrar novo usuário",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" },
              example: { name: "João Silva", email: "joao@email.com", password: "123456" },
            },
          },
        },
        responses: {
          "201": { description: "Usuário criado com tokens", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "400": { description: "Dados inválidos" },
          "409": { description: "E-mail já cadastrado" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Autenticação"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
              example: { email: "joao@email.com", password: "123456" },
            },
          },
        },
        responses: {
          "200": { description: "Login bem-sucedido", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "401": { description: "Credenciais inválidas" },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Autenticação"],
        summary: "Renovar access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["refreshToken"], properties: { refreshToken: { type: "string" } } },
            },
          },
        },
        responses: {
          "200": { description: "Novo par de tokens", content: { "application/json": { schema: { $ref: "#/components/schemas/TokenResponse" } } } },
          "401": { description: "Refresh token inválido ou expirado" },
        },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Autenticação"],
        summary: "Perfil do usuário autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Dados do usuário", content: { "application/json": { schema: { $ref: "#/components/schemas/UserProfile" } } } },
          "401": { description: "Não autenticado" },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["Sistema"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Serviço operacional",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    timestamp: { type: "string", format: "date-time" },
                    version: { type: "string", example: "1.0.0" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/analyze": {
      post: {
        tags: ["Análise"],
        summary: "Analisar dados e gerar insights via IA",
        description: "Recebe dados brutos e retorna análise estatística, insights, resumo executivo e recomendações.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AnalyzeRequest" },
              examples: {
                csv: {
                  summary: "Dados CSV",
                  value: {
                    format: "csv",
                    content: "produto,vendas,regiao\nNotebook,150,Sul\nSmartphone,320,Sudeste",
                    options: { language: "pt", includeRecommendations: true, includeExecutiveSummary: true },
                  },
                },
                json: {
                  summary: "Dados JSON",
                  value: {
                    format: "json",
                    content: '[{"produto":"A","vendas":100},{"produto":"B","vendas":250}]',
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Análise concluída",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AnalyzeResponse" } } },
          },
          "400": { description: "Dados inválidos" },
          "500": { description: "Erro interno" },
        },
      },
    },
    "/api/report": {
      post: {
        tags: ["Relatório"],
        summary: "Gerar relatório PDF completo",
        description: "Recebe dados e retorna um PDF com análise, insights, resumo e recomendações.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ReportRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "PDF gerado",
            content: { "application/pdf": { schema: { type: "string", format: "binary" } } },
            headers: {
              "X-Report-Pages": { schema: { type: "integer" }, description: "Número de páginas" },
              "X-Report-Generated-At": { schema: { type: "string", format: "date-time" } },
            },
          },
          "400": { description: "Dados inválidos" },
          "500": { description: "Erro interno" },
        },
      },
    },
    "/api/upload/analyze": {
      post: {
        tags: ["Upload"],
        summary: "Upload de arquivo para análise",
        description: "Faz upload de um arquivo CSV, JSON ou TXT e retorna análise com insights.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary", description: "Arquivo CSV, JSON ou TXT" },
                  language: { type: "string", enum: ["pt", "en"], default: "pt" },
                  includeRecommendations: { type: "string", enum: ["true", "false"], default: "true" },
                  includeExecutiveSummary: { type: "string", enum: ["true", "false"], default: "true" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Análise concluída" },
          "400": { description: "Arquivo inválido ou ausente" },
          "500": { description: "Erro interno" },
        },
      },
    },
    "/api/upload/report": {
      post: {
        tags: ["Upload"],
        summary: "Upload de arquivo para gerar PDF",
        description: "Faz upload de um arquivo e retorna o relatório PDF.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["file"],
                properties: {
                  file: { type: "string", format: "binary" },
                  title: { type: "string", default: "Relatório Automático" },
                  author: { type: "string", default: "Sistema de Relatórios IA" },
                  language: { type: "string", enum: ["pt", "en"], default: "pt" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "PDF gerado",
            content: { "application/pdf": { schema: { type: "string", format: "binary" } } },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Token JWT obtido via /auth/login ou /auth/register",
      },
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", minLength: 2, example: "João Silva" },
          email: { type: "string", format: "email", example: "joao@email.com" },
          password: { type: "string", minLength: 6, example: "123456" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/UserProfile" },
              accessToken: { type: "string" },
              refreshToken: { type: "string" },
            },
          },
        },
      },
      TokenResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              accessToken: { type: "string" },
              refreshToken: { type: "string" },
            },
          },
        },
      },
      UserProfile: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AnalyzeRequest: {
        type: "object",
        required: ["format", "content"],
        properties: {
          format: { type: "string", enum: ["csv", "json", "text"] },
          content: { type: "string", minLength: 1 },
          options: {
            type: "object",
            properties: {
              language: { type: "string", enum: ["pt", "en"], default: "pt" },
              includeRecommendations: { type: "boolean", default: true },
              includeExecutiveSummary: { type: "boolean", default: true },
            },
          },
        },
      },
      ReportRequest: {
        allOf: [
          { $ref: "#/components/schemas/AnalyzeRequest" },
          {
            type: "object",
            properties: {
              title: { type: "string", default: "Relatório Automático" },
              author: { type: "string", default: "Sistema de Relatórios IA" },
            },
          },
        ],
      },
      AnalyzeResponse: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: {
            type: "object",
            properties: {
              analysis: { type: "object" },
              insights: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    importance: { type: "string", enum: ["high", "medium", "low"] },
                    category: { type: "string" },
                  },
                },
              },
              executiveSummary: { type: "string" },
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                    actionItems: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

// ─── History paths (merged into main document) ──────────────────────

Object.assign(swaggerDocument.paths, {
  "/api/history": {
      get: {
        tags: ["Histórico"],
        summary: "Listar histórico de análises",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 20 }, description: "Máximo de itens (max 100)" },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 }, description: "Offset para paginação" },
        ],
        responses: {
          "200": {
            description: "Lista de análises",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          label: { type: "string" },
                          format: { type: "string" },
                          records: { type: "integer" },
                          insightsCount: { type: "integer" },
                          createdAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        total: { type: "integer" },
                        limit: { type: "integer" },
                        offset: { type: "integer" },
                        hasMore: { type: "boolean" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ["Histórico"],
        summary: "Limpar todo o histórico",
        responses: {
          "200": { description: "Histórico limpo" },
        },
      },
    },
    "/api/history/{id}": {
      get: {
        tags: ["Histórico"],
        summary: "Obter análise completa do histórico",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Análise com resultado completo" },
          "404": { description: "Análise não encontrada" },
        },
      },
      delete: {
        tags: ["Histórico"],
        summary: "Remover item do histórico",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Análise removida" },
          "404": { description: "Análise não encontrada" },
        },
      },
    },
});
