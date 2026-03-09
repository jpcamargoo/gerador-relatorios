# Gerador de Relatórios Automáticos (IA + Automação)

Serviço modular que transforma dados brutos (JSON, CSV, texto) em relatórios profissionais com análise estruturada, insights de IA e exportação para PDF — com autenticação JWT, histórico persistente em SQLite e frontend premium.

## Funcionalidades

**Backend (Express 5 + TypeScript)**
- Upload de dados (drag-and-drop, até 10MB)
- Parsing automático de CSV, JSON e texto
- Análise estatística (numérica e categórica)
- Geração de insights via IA (Google Gemini / gemini-2.0-flash)
- Resumo executivo e recomendações
- Exportação para PDF (PDFKit, A4)
- Progresso em tempo real via SSE
- Autenticação JWT (register, login, refresh token)
- Histórico persistente em SQLite (com LRU cache por SHA-256)
- Histórico por usuário (quando autenticado)
- API documentada com Swagger (com endpoints auth)
- Segurança: Helmet + rate limiting (15 anon / 60 auth req/min) + bcrypt
- Logging estruturado (Winston)
- 90 testes automatizados (parsers, pipeline, db, auth)

**Frontend (Next.js 16 + Tailwind CSS 4)**
- Interface premium com tema dark/light
- Página de login/registro com toggle
- Menu de usuário no header (avatar com iniciais)
- Drag-and-drop para upload de arquivos
- Barra de progresso em tempo real (SSE)
- Gráficos interativos (recharts: barras, pizza, radar)
- Exportação de dados (JSON, CSV, Markdown)
- Histórico de análises (servidor, filtrado por usuário)
- Dados de exemplo para teste rápido
- Notificações toast (Sonner)
- Error boundaries (error.tsx, global-error.tsx, not-found.tsx)
- Atalho: Ctrl+Enter para analisar
- Acessibilidade (ARIA roles, labels, keyboard nav)
- Responsivo para mobile

## Arquitetura

```
┌──────────────────┐    proxy /api/*    ┌──────────────────┐
│   Next.js :3001   │ ────────────────► │  Express :3000    │
│   (Frontend)      │                   │  (API Backend)    │
│                   │                   │                   │
│  - React 19       │                   │  - Pipelines      │
│  - Tailwind CSS 4 │                   │  - IA (Gemini)    │
│  - recharts       │                   │  - PDFKit         │
│  - AuthContext    │                   │  - JWT + bcrypt   │
│  - Sonner         │                   │  - SQLite (WAL)   │
└──────────────────┘                   │  - Swagger        │
                                       └──────────────────┘
```

## Setup

### Pré-requisitos

- Node.js 20+
- API Key do Google Gemini (gratuita) — [gerar aqui](https://aistudio.google.com/apikey)

### Instalação

```bash
git clone <repo-url>
cd report-automation

# Backend
npm install

# Frontend
cd web && npm install && cd ..

# Configurar ambiente
cp .env.example .env
# Editar .env com sua GEMINI_API_KEY
```

### Desenvolvimento

```bash
# Ambos servidores (recomendado)
npm run dev

# Ou separados
npm run dev:api   # Backend :3000
npm run dev:web   # Frontend :3001
```

### Docker

```bash
docker compose up --build
# API: http://localhost:3000
# Web: http://localhost:3001
```

### Testes

```bash
npm test              # 90 testes (parsers + pipeline + db + auth)
npm run test:parsers  # 19 testes de parsing
npm run test:pipeline # 15 testes de pipeline
npm run test:db       # 28 testes de banco
npm run test:auth     # 28 testes de autenticação
```

## Endpoints

### Dados & Relatórios

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/health` | — | Health check |
| `POST` | `/api/analyze` | Opcional | Análise de dados (JSON body) |
| `POST` | `/api/analyze/stream` | Opcional | Análise com progresso SSE |
| `POST` | `/api/report` | Opcional | Gerar PDF (JSON body) |
| `POST` | `/api/upload/analyze` | Opcional | Análise via upload de arquivo |
| `POST` | `/api/upload/report` | Opcional | PDF via upload de arquivo |

### Histórico

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `GET` | `/api/history` | Opcional | Listar histórico (paginado, filtrado por user) |
| `GET` | `/api/history/:id` | Opcional | Detalhes de uma análise (ownership check) |
| `DELETE` | `/api/history/:id` | Opcional | Remover análise (ownership check) |
| `DELETE` | `/api/history` | Opcional | Limpar histórico (por user se autenticado) |

### Autenticação

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| `POST` | `/api/auth/register` | — | Criar conta (name, email, password) |
| `POST` | `/api/auth/login` | — | Login (email, password) → tokens |
| `POST` | `/api/auth/refresh` | — | Renovar access token |
| `GET` | `/api/auth/me` | Bearer | Perfil do usuário autenticado |

**Swagger UI:** http://localhost:3000/api-docs

### Exemplo — Análise

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "content": "produto,vendas,regiao\nNotebook,150,Sul\nSmartphone,320,Sudeste",
    "options": { "language": "pt" }
  }'
```

### Exemplo — Registro + Análise autenticada

```bash
# Registrar
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@email.com","password":"senha123"}'

# Usar o accessToken retornado
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"format":"csv","content":"a,b\n1,2"}'
```

## Estrutura do Projeto

```
├── src/                        # Backend Express
│   ├── api/
│   │   ├── authMiddleware.ts   # JWT requireAuth + optionalAuth
│   │   ├── authRoutes.ts       # Register, login, refresh, me
│   │   ├── historyRoutes.ts    # CRUD histórico (filtrado por user)
│   │   ├── routes.ts           # POST /analyze, /report
│   │   ├── uploadRoutes.ts     # Upload com multer
│   │   ├── sseRoutes.ts        # SSE streaming
│   │   ├── swagger.ts          # OpenAPI 3.0 spec
│   │   └── middleware.ts       # Logger + error handler
│   ├── pipelines/
│   │   ├── analyzeData.ts      # Parse + estatísticas
│   │   ├── generateInsights.ts # 3 prompts de IA
│   │   └── buildPDF.ts         # Montagem do PDF
│   ├── services/
│   │   ├── aiClient.ts         # Multi-provider (Gemini/GitHub/OpenAI/Anthropic/Azure)
│   │   ├── authService.ts      # Register, login, refresh, verify (bcrypt + JWT)
│   │   ├── dbService.ts        # SQLite CRUD (users + history + cache)
│   │   ├── pdfService.ts       # PDFKit A4
│   │   └── storageService.ts
│   ├── config/env.ts           # Zod env validation (+ JWT config)
│   ├── types/index.ts          # Schemas + tipos
│   ├── utils/                  # Parsers, logger
│   └── tests/                  # 90 testes (parsers, pipeline, db, auth)
├── web/                        # Frontend Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Página principal
│   │   │   ├── login/page.tsx  # Login / Registro
│   │   │   ├── layout.tsx      # Layout + AuthProvider + Toaster
│   │   │   ├── error.tsx       # Error boundary
│   │   │   ├── global-error.tsx
│   │   │   ├── not-found.tsx
│   │   │   └── globals.css     # Design system premium
│   │   ├── components/         # 12 componentes React
│   │   ├── contexts/
│   │   │   └── auth-context.tsx # AuthProvider + useAuth
│   │   ├── hooks/
│   │   │   └── use-history.ts  # Hook de histórico server-side
│   │   └── lib/api.ts          # Client API tipado + SSE + auth headers
│   ├── next.config.ts          # Proxy + standalone
│   └── Dockerfile
├── docs/
│   ├── endpoints.md            # Documentação detalhada da API
│   └── pipeline.md             # Documentação dos pipelines
├── docker-compose.yml          # API + Web
├── Dockerfile                  # Backend
└── .env                        # Variáveis (gitignored)
```

## Variáveis de Ambiente

```dotenv
PORT=3000
NODE_ENV=development

# IA
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-2.0-flash

# JWT
JWT_SECRET=troque-em-producao
JWT_REFRESH_SECRET=troque-em-producao
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=*  # Em produção: https://meusite.com
```

Providers de IA suportados: `gemini` (grátis, padrão), `github`, `openai`, `anthropic`, `azure`.

## Tecnologias

| Camada | Stack |
|--------|-------|
| Backend | Node.js, TypeScript, Express 5, Zod |
| IA | Google Gemini (gemini-2.0-flash), OpenAI SDK, Anthropic SDK |
| Banco | SQLite (better-sqlite3, WAL mode) |
| Auth | JWT (jsonwebtoken) + bcrypt (bcryptjs) |
| PDF | PDFKit |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Gráficos | recharts |
| Notificações | Sonner |
| Segurança | Helmet, express-rate-limit, CORS, bcrypt |
| Logging | Winston |
| Upload | Multer |
| Docs | Swagger UI (OpenAPI 3.0) |
| Container | Docker, Docker Compose |
| Testes | Custom runner + tsx (90 testes) |
| CI/CD | GitHub Actions |

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | API + Web juntos (concurrently) |
| `npm run dev:api` | Apenas backend (:3000) |
| `npm run dev:web` | Apenas frontend (:3001) |
| `npm run build` | Build backend (tsc) |
| `npm run build:web` | Build frontend (next build) |
| `npm run build:all` | Build completo |
| `npm test` | Rodar 90 testes |
| `npm run test:auth` | 28 testes de autenticação |

## Deploy

### Vercel + Railway (recomendado)

Arquitetura de produção: **Frontend na Vercel** + **Backend no Railway**.

#### 1. Backend — Railway

1. Acesse [railway.app](https://railway.app) e conecte seu GitHub
2. **New Project → Deploy from GitHub Repo** → selecione o repositório
3. Railway detecta o `Dockerfile` automaticamente
4. Configure as **variáveis de ambiente**:

   | Variável | Valor |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | Secret forte (mín. 32 chars) |
   | `JWT_REFRESH_SECRET` | Outro secret forte |
   | `AI_PROVIDER` | `gemini` |
   | `GEMINI_API_KEY` | Sua chave da API Gemini |
   | `CORS_ORIGIN` | `https://seu-app.vercel.app` |

5. **Add Volume** → mount path: `/app/storage` (persiste o SQLite)
6. Anote a URL pública gerada (ex: `https://report-api-production.up.railway.app`)

#### 2. Frontend — Vercel

1. Acesse [vercel.com](https://vercel.com) e conecte seu GitHub
2. **New Project** → selecione o repositório
3. Em **Root Directory** defina: `web`
4. Framework Preset: **Next.js** (detectado automaticamente)
5. Configure as **variáveis de ambiente**:

   | Variável | Valor |
   |----------|-------|
   | `API_URL` | URL do Railway (ex: `https://report-api-production.up.railway.app`) |

6. Deploy! O Next.js faz proxy automático de `/api/*` para o Railway

#### 3. Atualizar CORS no Railway

Após o deploy na Vercel, copie a URL gerada (ex: `https://meu-app.vercel.app`) e atualize `CORS_ORIGIN` no Railway com essa URL.

---

### Docker Compose (self-hosted)

```bash
# 1. Configurar variáveis de produção
cp .env.example .env
# Editar .env:
#   NODE_ENV=production
#   JWT_SECRET=<secret-forte-32-chars>
#   JWT_REFRESH_SECRET=<outro-secret-forte>
#   AI_PROVIDER=gemini
#   GEMINI_API_KEY=your-gemini-api-key
#   CORS_ORIGIN=https://meusite.com

# 2. Build e start
docker compose up -d --build

# 3. Verificar saúde
curl http://localhost:3000/api/health

# 4. Logs
docker compose logs -f
```

### Deploy em VPS (Ubuntu)

```bash
# 1. Instalar dependências
sudo apt update && sudo apt install -y docker.io docker-compose-plugin

# 2. Clonar e configurar
git clone <repo-url> && cd report-automation
cp .env.example .env && nano .env

# 3. Iniciar
docker compose up -d --build

# 4. (Opcional) Nginx como reverse proxy
# server {
#     server_name meusite.com;
#     location / { proxy_pass http://localhost:3001; }
#     location /api { proxy_pass http://localhost:3000; }
# }
```

### Variáveis de Produção Obrigatórias

| Variável | Descrição |
|----------|-----------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Secret forte (mín. 32 chars) — app **não inicia** com default |
| `JWT_REFRESH_SECRET` | Secret forte diferente do JWT_SECRET |
| `GEMINI_API_KEY` | Chave da API do Google Gemini |
| `CORS_ORIGIN` | URL do frontend (ex: `https://meusite.com`) |

### Checklist de Produção

- [ ] `NODE_ENV=production` no Railway
- [ ] JWT secrets fortes e únicos
- [ ] `CORS_ORIGIN` no Railway apontando para a URL da Vercel
- [ ] `API_URL` na Vercel apontando para a URL do Railway
- [ ] Volume persistente no Railway para `/app/storage`
- [ ] Backup periódico do SQLite (`storage/reports.db`)
- [ ] Monitoramento do health check (`/api/health`)

## Licença

MIT
