# Análise do Handoff CRM WhatsApp vs Proposta Synemusic
> Cruzamento, validação, gaps e proposta fundida v2.0
> Data: 2026-07-06

---

## 1. VALIDAÇÃO — O QUE O HANDOFF ACERTOU

| Decisão | Nota | Por quê |
|---------|------|---------|
| Hotmart como gateway único | ✅ | Alinhado com escolha do Guiga, sem gateway próprio até P7 (early stage, foco em produto) |
| Supabase como CRM | ✅ | Mesma stack do NFP, schema único serve dois produtos (Synemusic + Automac), evita retrabalho |
| Função `avancar_estagio` sem regressão | ✅ | Protege contra loop de estágio causado por erro do agente. Decisão de rebaixar é sempre humana |
| Flag `handoff_humano` | ✅ | Clean handoff toggle. Melhor que silenciar ou bloquear — dá visibilidade |
| Prompt externalizado (`prompt_atendimento.md`) | ✅ | Segue mesmo princípio do R3 (prompt mestre): comportamento vive em arquivo, não em nó do N8N |
| Idempotência financeira | ✅ | `transacao_hotmart unique` + `Prefer: ignore-duplicates` — padrão correto para webhooks de pagamento |
| Evolution API para WhatsApp | ✅ | Self-hosted, sem depender de provedor externo (WMeta paga caro, WATI/BSP caro demais para early stage) |
| Separação Bloco 1 (atendimento) e Bloco 3 (financeiro) | ✅ | Mantém o fluxo de caixa isolado do fluxo de conversa — segurança |

---

## 2. GAPS IDENTIFICADOS (com referências externas)

### GAP 1 — Zero persistência de mensagens (P-1)
**Problema**: O workflow do Bloco 1 não grava nem a mensagem do cliente nem a resposta
do agente no banco. Isso significa que:
- Histórico só existe enquanto o N8N mantém execução
- Não dá para treinar o agente com exemplos reais
- Não dá para auditar conversas

**Referência externa**: O padrão **Event Sourcing** (Martin Fowler) aplicado a CRM:
toda interação é um evento imutável. O schema `mensagens` já existe no handoff — só
faltam os inserts.

**[SOLUÇÃO]**: Adicionar nós HTTP `POST /rest/v1/mensagens` em dois pontos:
1. Logo após "Normaliza Mensagem" (grava msg do cliente)
2. Logo após "Parse Decisao" se `resposta != null` (grava resposta do agente)

Corpo padronizado:
```json
{ "conversa_id": "<uuid>", "contato_id": "<uuid>",
  "papel": "cliente | agente",
  "conteudo": "<texto>", "intencao_detectada": "<string|null>" }
```

### GAP 2 — Leitura do prompt via SSH é frágil
**Problema**: `Carrega Prompt` usa SSH para `cat /root/agente/prompt_atendimento.md`.
Isso significa:
- Se a VPS caiu, o agente quebra (sem fallback)
- Se a chave SSH rodar, o workflow falha silenciosamente
- Latência extra (SSH round-trip + leitura de arquivo) por mensagem

**Referência externa**: **12 Factor App** (Config factor): configuração e prompts
devem vir de env vars ou banco, não do filesystem da VPS.

**[SOLUÇÃO]**: Armazenar o prompt em:
1. **Opção A**: Tabela `prompts` no Supabase (mais flexível, permite versionamento)
2. **Opção B**: raw URL no GitHub (mais simples, mas precisa de token público)
3. **Opção C**: Env var no N8N (mais rápido, mas trechos grandes poluem env)

**Recomendação**: Opção A — criar tabela `public.prompts(chave text PK, conteudo text,
versao int, ativo bool)` — carrega via REST, sem SSH, com cache no N8N (nó `if`
com checksum).

### GAP 3 — Sem webhook secret no Evolution API
**Problema**: O webhook `evolution-inbound` não valida origem. Qualquer requisição
POST para a URL pública dispara o workflow.

**Referência externa**: **OWASP API Security Top 10** — API1:2023 (Broken Object
Level Authorization). Webhooks expostos sem validação são vetor de ataque.

**[SOLUÇÃO]**: Evolution API nativamente suporta `apiKey` no header. Configurar
`X-Evolution-API-Key` no webhook global e validar no primeiro nó do workflow.

### GAP 4 — Sem fallback de LLM
**Problema**: Dependência única de Claude Sonnet 4-6. Se a Anthropic estiver fora
(1-2 incidentes/mês em 2026), o atendimento simplesmente para.

**Referência externa**: **Chaos Engineering** (Netflix, Principles of Resilience):
sistemas críticos devem ter fallback. Um nó de IA de atendimento ao cliente é
sistema crítico.

**[SOLUÇÃO]**: Adicionar nó `try/catch` ou `IF` com OpenAI GPT-4o-mini como fallback.
Custo do fallback é ~1/5 do Claude Sonnet. Prompt encurtado para 500 tokens no fallback.

### GAP 5 — Sem gestão de contexto / RAG
**Problema**: O agente só vê as últimas 20 mensagens (raw JSON) + prompt estático.
Não tem acesso a:
- Bíblia Cromus (regras RNFG)
- Catálogo de produtos (preços, links)
- FAQ de dúvidas frequentes
- Histórico de interações anteriores em conversas diferentes

**Referência externa**: **GraphRAG** (Microsoft, 2024): em vez de buscar chunks
soltos em vector store, estrutura o conhecimento em grafo entidades → relações.
Agente navega o grafo para responder com precisão.

**[SOLUÇÃO v1 — imediata, sem vector store]**: Adicionar ao prompt (via `replace`
no workflow) os dados mais consultados dinamicamente:
```
PREÇOS: {carregar da tabela produtos}
PERGUNTAS_FREQUENTES: {últimas 5 perguntas não respondidas com respostas do Guiga}
```

**[SOLUÇÃO v2 — médio prazo]**: Supabase pgvector com embeddings dos chunks da
Bíblia + FAQ. Busca top-3 antes de cada chamada e injeta no contexto.

### GAP 6 — Sem rate limiting anti-spam
**Problema**: Se um contato manda 100 mensagens em 1 minuto, cada uma gera uma
chamada de LLM. Custo explode e o agente fica repetitivo.

**Referência externa**: **Sliding Window Log** (sistema de rate limiting do
Discord/Twitter): N requisições por janela de tempo por contato.

**[SOLUÇÃO]**: Após "Normaliza Mensagem", verificar se contato já recebeu resposta
nos últimos 5 segundos. Se sim, ignora a mensagem (acumula silenciosamente na
próxima rodada).

### GAP 7 — Sem métricas de atendimento
**Problema**: O workflow roda mas não gera métricas:
- Quantas conversas por dia?
- Tempo médio de resposta?
- Intenções mais comuns?
- Taxa de handoff?

**Referência externa**: **SLA Metrics** (Zendesk benchmark): resposta inicial
< 60s; NPS > 70 para chatbot; taxa de handoff ideal < 20%.

**[SOLUÇÃO]**: Nó final que escreve métricas agregadas em `public.metricas_atendimento`
a cada N mensagens (ex: 100). Consulta semanal via relatório Agente Pesquisador.

### GAP 8 — Deploy manual (sem CI/CD)
**Problema**: "Importar `workflow_atendimento.json` e `workflow_hotmart.json`" —
processo manual, sem versionamento, sem rollback.

**Referência externa**: **GitOps + Infrastructure as Code** (Weaveworks, 2017):
todo estado do sistema versionado em git. Mudanças = PR.

**[SOLUÇÃO]**: N8N tem CLI (`n8n export:workflow`) e API de import. Criar script
`deploy_workflows.sh` que:
1. Exporta JSONs do N8N → git
2. Versiona junto com o prompt
3. `deploy.sh` lê do git e importa via API

---

## 3. PROPOSTA FUNDIDA V2.0 — 8 Blocos + 12 Workflows

### Arquitetura revisada

```
                      ┌──────────────────────┐
                      │   EVOLUTION API       │
                      │   (WhatsApp Gateway)  │
                      └────────┬─────────────┘
                               │ messages.upsert
                      ┌────────▼─────────────┐
                      │   N8N — Bloco 1       │
                      │   Atendimento CRM     │
                      │   (Anthropic +        │
                      │    OpenAI fallback)   │
                      └────────┬─────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
   │ Bloco 2      │   │ Bloco 3      │   │ Bloco 4      │
   │ Follow-up    │   │ Hotmart      │   │ Lead Magnet  │
   │ 24h + Nurture│   │ Financeiro   │   │ Onboarding   │
   └──────────────┘   └──────────────┘   └──────────────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               ▼
                      ┌──────────────────────┐
                      │   SUPABASE            │
                      │   CRM + Financeiro    │
                      │   + Mensagens + FAQ   │
                      └──────────────────────┘
```

### Os 8 Blocos (fundindo handoff + minha proposta)

| Bloco | Nome | Workflows | Status |
|-------|------|-----------|--------|
| 1 | Atendimento WhatsApp | `evolution → claude → respond` | Handoff pronto, faltam inserts P-1 |
| 2 | Follow-up + Nutrição | cron follow_up_24h + sequência D+3/D+7 | Só esqueleto (P-4) |
| 3 | Financeiro Hotmart | webhook hotmart → grava → atualiza CRM | Handoff pronto |
| 4 | Captura de Lead | `/api/leads` → email lead magnet → nutrição | Não existe |
| 5 | Onboarding | `auth.users` → boas-vindas → tutorial | Não existe |
| 6 | Churn + Retenção | webhook hotmart cancel → oferta → nps | Não existe |
| 7 | Métricas + Relatórios | cron semanal → funil → mrr → custos | Não existe |
| 8 | Infra + Deploy | backup, health check, deploy workflows | Não existe |

### Bloco 1 — melhorias pós-análise

```
[Evolution Webhook]
    ↓
[Valida API Key]          ← NOVO: segurança
    ↓
[Normaliza Mensagem]
    ↓
[Grava Mensagem Cliente]  ← NOVO: resolve P-1
    ↓
[Rate Limit Check]        ← NOVO: anti-spam
    ↓
[Upsert Contato+CRM]
    ↓
[Checa Handoff]
    ↓
[Bot Ativo?] ──Não──→ [Notifica Guiga]
    │Sim
    ▼
[Busca Histórico]  ────┐
[Carrega Prompt]   ────┤
[Busca FAQ/Preços] ────┤ ← NOVO: contexto enriquecido
                       ▼
[Agente Claude] ──falha──→ [Agente OpenAI fallback] ← NOVO: resiliência
    ↓
[Parse Decisao]
    ↓
[Grava Resposta Agente]  ← NOVO: resolve P-1
    ↓
[Resposta != null?] ──Não──→ [só atualiza CRM] ← NOVO: resolve P-2
    │Sim
    ▼
[Responde Cliente] + [Atualiza CRM]
```

---

## 4. REFERÊNCIAS EXTERNAS INCORPORADAS

| Referência | Origem | Aplicação no Synemusic |
|------------|--------|----------------------|
| Event Sourcing | Martin Fowler, 2005 | Persistir toda mensagem como evento imutável |
| 12 Factor App | Heroku, 2011 | Prompt no banco, não no filesystem |
| GraphRAG | Microsoft, 2024 | Contexto enriquecido do agente via busca estruturada |
| OWASP API Top 10 | OWASP, 2023 | Webhook secret no Evolution API |
| Chaos Engineering | Netflix, 2016 | Fallback de LLM (Anthropic → OpenAI) |
| Sliding Window Log | Discord/Twitter | Rate limit por contato (5s) |
| GitOps | Weaveworks, 2017 | Workflows versionados no git + deploy.sh |
| Cost-per-MRR ratio | Prompt Mestre Synemusic v10.5 | Workflow 7 monitora <8% saudável, >15% alerta |

---

## 5. RECOMENDAÇÃO DE PRIORIDADE

### Ordem de implementação (ponderada por impacto x esforço)

```
Prioridade  │ Bloco │ Esforço │ Impacto
────────────┼───────┼─────────┼───────────
P0 — AGORA  │   1   │  4h     │ 🔴 Crítico
             │       │         │ (atendimento funciona mas
             │       │         │  não grava nada — resolve P1+P2)
             │       │         │
P1 — HOJE   │   3   │  2h     │ 🔴 Crítico
             │       │         │ (sem webhook Hotmart,
             │       │         │  venda não ativa assinatura)
             │       │         │
P2 — SEMANA │   5   │  3h     │ 🟠 Alto
             │       │         │ (onboarding reduz churn de
             │       │         │  novos cadastros)
             │       │         │
P3 — SEMANA │   2   │  2h     │ 🟠 Alto
             │       │         │ (follow-up recupera leads
             │       │         │  que não compraram)
             │       │         │
P4 — MÊS    │   4   │  2h     │ 🟡 Médio
             │       │         │ (lead magnet precisa de /api/leads)
             │       │         │
P5 — MÊS    │   6   │  2h     │ 🟡 Médio
             │       │         │ (churn recorrente precisa existir
             │       │         │  antes de tratar)
             │       │         │
P6 — MÊS    │  7+8  │  4h     │ 🔵 Baixo
             │       │         │ (métricas + infra, importante
             │       │         │  mas não bloqueia operação)
```

---

## 6. PRÓXIMO PASSO RECOMENDADO

1. **Corrigir P-1 e P-2 no workflow Bloco 1** (2 nós de insert + 1 IF) — 1h
2. **Adicionar rate limit + segurança** (Evolution API key) — 30min
3. **Configurar Hotmart webhook** (apontar para o workflow Bloco 3) — 30min
4. **Migrar prompt do SSH para Supabase** — 1h
5. **Testar fluxo completo** — 1h

**Total para Blocos 1+3 funcionarem em produção: ~4h de implementação.**

Quer que eu implemente a correção dos 5 itens acima agora?
