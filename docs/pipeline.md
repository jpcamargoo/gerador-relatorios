# Pipeline de Dados

## Visão Geral

O sistema utiliza três pipelines sequenciais para transformar dados brutos em relatórios PDF completos.

## 1. analyzeData — Análise Estrutural

**Entrada:** Dados brutos (JSON, CSV ou texto)
**Saída:** `ParsedData` + `DataAnalysis`

### Etapas:
1. **Parsing** — converte o formato de entrada em estrutura tabular unificada (`ParsedData`)
2. **Detecção de tipos** — classifica cada coluna como `number`, `string`, `boolean` ou `date`
3. **Estatísticas numéricas** — calcula min, max, média e mediana para colunas numéricas
4. **Estatísticas categóricas** — conta valores únicos e identifica os mais frequentes
5. **Contagem de nulos** — identifica campos vazios ou ausentes

### Formatos suportados:
| Formato | Parser | Detalhes |
|---------|--------|----------|
| CSV     | `parseCSV()` | Suporta campos com aspas e vírgulas internas |
| JSON    | `parseJSON()` | Array de objetos ou objeto único |
| Texto   | `parseText()` | Detecta separadores (tab, `;`, `\|`) ou trata como texto livre |

---

## 2. generateInsights — Geração de Insights via IA

**Entrada:** `DataAnalysis` + opções
**Saída:** `Insight[]` + `executiveSummary` + `Recommendation[]`

### Etapas:
1. **Prompt de insights** — envia estatísticas para a IA e solicita insights estruturados
2. **Resumo executivo** — gera texto corrido profissional (3-5 parágrafos)
3. **Recomendações** — sugere ações com prioridade e tarefas específicas

### Providers suportados:
- GitHub Models (gpt-4o-mini) — **padrão, gratuito**
- OpenAI (GPT-4)
- Anthropic (Claude)
- Azure OpenAI

### Fallback:
Se nenhuma API de IA estiver configurada, o sistema retorna uma mensagem padrão orientando a configuração.

---

## 3. buildPDF — Construção do Relatório PDF

**Entrada:** `ReportResult` + metadados
**Saída:** `PDFReport` (buffer + metadados)

### Seções do PDF:
1. **Capa** — título, autor, data, quantidade de registros
2. **Resumo Executivo** — texto gerado pela IA
3. **Análise dos Dados** — estatísticas numéricas e categóricas
4. **Insights** — lista com cores por importância (alta/média/baixa)
5. **Recomendações** — lista com prioridade e itens de ação

### Configurações:
- Formato A4
- Margens: 60px top/bottom, 50px left/right
- Fontes: Helvetica / Helvetica-Bold
- Cores temáticas por prioridade/importância
