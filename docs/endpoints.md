# Documentação dos Endpoints

## Base URL

```
http://localhost:3000
```

## Autenticação

A API usa JWT Bearer tokens. Endpoints marcados com **Auth: Opcional** funcionam com ou sem token — quando autenticado, o histórico é associado ao usuário. Endpoints com **Auth: Obrigatório** exigem o header `Authorization: Bearer <accessToken>`.

---

## POST /api/auth/register

Cria uma nova conta de usuário.

**Request:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | `string` | Sim | Nome do usuário (min. 2 caracteres) |
| `email` | `string` | Sim | E-mail válido e único |
| `password` | `string` | Sim | Senha (min. 6 caracteres) |

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@email.com",
      "createdAt": "2026-02-11T12:00:00.000Z"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

| Status | Descrição |
|--------|-----------|
| 201 | Conta criada com sucesso |
| 400 | Dados inválidos (Zod) |
| 409 | E-mail já cadastrado |

---

## POST /api/auth/login

Autenticação com e-mail e senha.

**Request:**
```json
{
  "email": "joao@email.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "João Silva", "email": "joao@email.com", "createdAt": "..." },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

| Status | Descrição |
|--------|-----------|
| 200 | Login bem-sucedido |
| 401 | Credenciais inválidas |

---

## POST /api/auth/refresh

Renova o access token usando o refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

| Status | Descrição |
|--------|-----------|
| 200 | Tokens renovados |
| 401 | Refresh token inválido ou expirado |

---

## GET /api/auth/me

Retorna o perfil do usuário autenticado. **Auth: Obrigatório.**

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com",
    "createdAt": "2026-02-11T12:00:00.000Z"
  }
}
```

| Status | Descrição |
|--------|-----------|
| 200 | Perfil retornado |
| 401 | Não autenticado / token inválido |

---

## GET /api/health

Retorna informações gerais sobre a API.

**Response:**
```json
{
  "name": "Gerador de Relatórios Automáticos",
  "version": "1.0.0",
  "description": "API para geração automática de relatórios com IA",
  "endpoints": {
    "analyze": "POST /api/analyze",
    "report": "POST /api/report",
    "health": "GET /api/health"
  }
}
```

---

## GET /api/health

Health check do serviço.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-09T12:00:00.000Z",
  "version": "1.0.0"
}
```

---

## POST /api/analyze

Recebe dados brutos e retorna uma análise completa com insights gerados por IA. **Auth: Opcional** (quando autenticado, salva no histórico do usuário).

### Request

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <accessToken>   (opcional)
```

**Body:**
```json
{
  "format": "csv | json | text",
  "content": "dados brutos como string",
  "options": {
    "language": "pt | en",
    "includeRecommendations": true,
    "includeExecutiveSummary": true
  }
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `format` | `"csv" \| "json" \| "text"` | Sim | Formato dos dados de entrada |
| `content` | `string` | Sim | Conteúdo dos dados (não pode ser vazio) |
| `options.language` | `"pt" \| "en"` | Não | Idioma dos insights (padrão: `"pt"`) |
| `options.includeRecommendations` | `boolean` | Não | Incluir recomendações (padrão: `true`) |
| `options.includeExecutiveSummary` | `boolean` | Não | Incluir resumo executivo (padrão: `true`) |

### Response (200)

```json
{
  "success": true,
  "data": {
    "analysis": {
      "summary": {
        "totalRecords": 100,
        "columns": 5,
        "dataTypes": { "nome": "string", "idade": "number" },
        "nullCounts": { "nome": 0, "idade": 2 }
      },
      "statistics": {
        "numeric": {
          "idade": { "min": 18, "max": 65, "mean": 32.5, "median": 30 }
        },
        "categorical": {
          "cidade": {
            "uniqueValues": 10,
            "topValues": [{ "value": "SP", "count": 30 }]
          }
        }
      },
      "categories": ["cidade", "estado"]
    },
    "insights": [
      {
        "title": "Concentração geográfica",
        "description": "30% dos registros estão em SP",
        "importance": "high",
        "category": "distribuição"
      }
    ],
    "executiveSummary": "O dataset analisado contém...",
    "recommendations": [
      {
        "title": "Diversificar base",
        "description": "Expandir cobertura para outras regiões",
        "priority": "high",
        "actionItems": ["Mapear regiões com baixa representatividade"]
      }
    ]
  }
}
```

### Erros

| Status | Descrição |
|--------|-----------|
| 400 | Dados inválidos (schema Zod) |
| 500 | Erro interno |

---

## POST /api/report

Recebe dados brutos e retorna um PDF com o relatório completo.

### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "format": "csv",
  "content": "nome,vendas\nProduto A,150\nProduto B,230",
  "title": "Relatório de Vendas Q1",
  "author": "Equipe Comercial",
  "options": {
    "language": "pt",
    "includeRecommendations": true,
    "includeExecutiveSummary": true
  }
}
```

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `format` | `string` | Sim | Formato dos dados |
| `content` | `string` | Sim | Dados brutos |
| `title` | `string` | Não | Título do relatório (padrão: `"Relatório Automático"`) |
| `author` | `string` | Não | Autor (padrão: `"Sistema de Relatórios IA"`) |
| `options` | `object` | Não | Mesmas opções do `/analyze` |

### Response (200)

**Content-Type:** `application/pdf`

Headers adicionais:
```
X-Report-Pages: 5
X-Report-Generated-At: 2026-02-09T12:00:00.000Z
```

O corpo da resposta é o binário do PDF.

### Erros

| Status | Descrição |
|--------|-----------|
| 400 | Dados inválidos |
| 500 | Erro interno |

---

## Exemplos com cURL

### Análise de CSV
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "content": "nome,idade,cidade\nJoão,30,SP\nMaria,25,RJ\nPedro,35,BH"
  }'
```

### Gerar PDF de JSON
```bash
curl -X POST http://localhost:3000/api/report \
  -H "Content-Type: application/json" \
  -d '{
    "format": "json",
    "content": "[{\"produto\":\"A\",\"vendas\":100},{\"produto\":\"B\",\"vendas\":250}]",
    "title": "Relatório de Vendas"
  }' \
  --output relatorio.pdf
```

### Registro + análise autenticada
```bash
# 1. Registrar
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João","email":"joao@email.com","password":"senha123"}' \
  | jq -r '.data.accessToken')

# 2. Analisar com token
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"format":"csv","content":"a,b\n1,2\n3,4"}'

# 3. Buscar histórico do usuário
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/history
```

---

## Endpoints de Histórico

### GET /api/history

Lista o histórico de análises com paginação. **Auth: Opcional** (quando autenticado, filtra por usuário).

**Query params:**

| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `limit` | `number` | 20 | Itens por página |
| `offset` | `number` | 0 | Offset para paginação |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "label": "Análise CSV (10 registros)",
      "format": "csv",
      "records": 10,
      "insightsCount": 5,
      "createdAt": "2026-02-11T12:00:00.000Z"
    }
  ],
  "pagination": { "limit": 20, "offset": 0, "total": 1 }
}
```

### GET /api/history/:id

**Auth:** Opcional

Retorna os detalhes completos de uma análise (incluindo resultado JSON). Se autenticado, verifica ownership — retorna `403` se a análise pertence a outro usuário.

### DELETE /api/history/:id

**Auth:** Opcional

Remove uma análise do histórico. Se autenticado, verifica ownership — retorna `403` se a análise pertence a outro usuário. Retorna `{ success: true }`.

### DELETE /api/history

**Auth:** Opcional

Limpa o histórico. Se autenticado, limpa apenas as análises do usuário. Retorna `{ success: true, message: "N análise(s) removida(s)" }`.
