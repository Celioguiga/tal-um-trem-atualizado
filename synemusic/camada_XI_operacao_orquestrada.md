# CAMADA XI — OPERAÇÃO ORQUESTRADA (Sistema Executivo de Agentes)
> Extensão canônica do Prompt Mestre Synemusic v10.6 · Data: 2026-07-08
> Executor único: Célio Guiga (Solo-Orchestra) · Governada pelo MAESTRUM
> Fontes reconciliadas: `n8n/` (workflows + schema), `synemusic/analise_handoff_crm.md`,
> `synemusic/diagnostico_automacao.md`, `HANDOFF_SAIRA.md`, `bilhete_familias.md`, `Plano_Diretor_Synemusic`.

---

## 0. IDENTIDADE DA CAMADA

**O que é:** a camada operacional que dissolve trabalho manual repetitivo em duas frentes
simultâneas (Escola Saíra + Synemusic) usando um **único sistema de agentes**, gerando
receita real e produzindo, como subproduto, a prova de conceito vendável do produto **Automac**.

**Posição na arquitetura:** senta sobre as camadas existentes, não as substitui.
- **Camada VI (NFP Live)**, **VII (Transcrição RNG)** → produto.
- **Camada IX (Ativos Presenciais: Roda Música + Clube da Música)** → é aqui que a Saíra vive.
- **Camada X (Engenharia de Custo de IA e Governança de Inferência)** → governa o custo desta camada.
- **Camada XI (esta)** → o **tecido operacional** que conecta IX a X e ao MAESTRUM: os agentes que executam.

**Missão da camada:** que o Solo-Founder **não envie mais nenhuma mensagem repetitiva**.
O agente atende, pesquisa e executa; Guiga só decide (confirmar matrícula, confirmar pagamento, aprovar rascunho).

**Métrica-mãe (KPI reframe):** não é "leads qualificados" nem "estágio de funil". É
**(a) horas/mês economizadas** e **(b) % de receita que passa a ser automática vs. manual**.

---

## 1. TESE ESTRATÉGICA (cliente-zero)

Guiga é o **cliente-zero** do produto que está montando. Sequência de valor:

```
Saíra (receita real)  →  Automac (demo vendável)  →  Synemusic (prova de conceito / P3)
```

A Escola Saíra Sete Cores (programas *Clube das Cordas* e *Roda de Violão*, contraturno)
é o piloto real da tese "escola de música dentro da escola, atendida por agente com
inteligência RNFG, rodando na mesma infra que a Synemusic venderá a donos de escola".
O que funcionar aqui vira demonstração comercial (Automac) e valida a Camada VIII (Posicionamento).

---

## 2. OS 4 REDIRECIONAMENTOS INCORPORADOS

Correções sobre a proposta anterior (`analise_handoff_crm.md` + `diagnostico_automacao.md`),
que ficam como **regra desta camada**:

1. **CRM ÚNICO, dois funis lado a lado.** Não existem "dois CRMs". Um contato pode ser
   pai de aluno da Saíra **E** interessado em consultoria/SaaS Synemusic. Banco unificado
   de `contatos`; funis separados por domínio (Saíra = `matriculas.status`; Synemusic = `crm.estagio`).

2. **Agente que EXECUTA, não só audita.** O Agente Pesquisador (auditor/relatório) é
   necessário mas insuficiente. Adiciona-se o **Agente Executivo**: dispara bilhetes
   programados, follow-up de lista de espera, lembrete de pagamento — sem comando manual.

3. **Bilhete é processo, não config estática.** O `bilhete_familias.md` deixa de ser
   rascunho e vira **template acionado por um formulário de setup** (preenchido 1×) →
   campanhas mensais automáticas (cron).

4. **KPI = tempo economizado + receita não-manual** (ver seção 6), não vaidade de funil.

---

## 3. ARQUITETURA DE AGENTES (4 agentes sobre 1 infra)

Reuso, não duplicação. Os quatro agentes compartilham Evolution API + N8N + Supabase +
LLM (Anthropic com **fallback OpenAI** — GAP 4). A distinção é de **instância, prompt e contexto**.

| Agente | Papel | Gatilho | Instância/Prompt | Escreve em |
|--------|-------|---------|------------------|------------|
| **A1 — Atendimento Saíra** | Tira dúvida, organiza matrícula, informa PIX | `saira-inbound` (WhatsApp) | Instância Evolution dedicada · `prompt_atendimento_saira` | `matriculas`, `mensagens` |
| **A2 — Atendimento Synemusic** | Vendas/suporte do NFP e cantigas | `evolution-inbound` (WhatsApp) | Instância comercial · `prompt_atendimento` | `crm`, `mensagens` |
| **A3 — Pesquisador** (auditor) | Relatório diário 06h30 (todas as frentes) | cron 06h30 | `coleta_operacao.sh` + views | leitura (relatório) |
| **A4 — Executivo** (executor) | Bilhetes cíclicos, follow-up, lembretes, inadimplência | crons + regras | workflows N8N | envia mensagens, agenda |

**Relação com os 8 Blocos / 12 Workflows já documentados** (não se joga fora nada):
- Bloco 1 (Atendimento) = **A1 + A2** (mesmo `workflow_atendimento_v2.json`, 4 mudanças de config — ver `HANDOFF_SAIRA` §Arquitetura).
- Bloco 3 (Financeiro Hotmart) = pipeline Synemusic; Saíra usa PIX + confirmação manual.
- Blocos 2/4/5/6/10/11 (follow-up, lead magnet, onboarding, churn, ritornello, NPS) = **A4**.
- Bloco 7 (Métricas/Relatórios) + Workflow 12 (Maestro IA) = **A3** + Camada X.
- Bloco 8 (Infra/Deploy) = base de todos (GitOps — GAP 8).

**Enriquecimento de contexto obrigatório (GAP 5):** antes de responder sobre turma/vaga/preço,
A1 injeta `v_vagas` (turmas/vagas/preços reais). O agente **nunca** responde sobre turma sem esse dado.
A2 injeta `produtos` + FAQ. Prompt vive no banco (`prompts`, versionado — GAP 2), não em SSH.

---

## 4. CRM UNIFICADO — 1 BASE, 2 FUNIS

```
                         ┌───────────────────────────┐
                         │   contatos (UNIFICADO)     │
                         │   telefone, nome, consent  │
                         └───────┬───────────┬────────┘
              funil escolar      │           │   funil comercial
                    ▼            │           │            ▼
          ┌──────────────────┐   │           │   ┌──────────────────┐
          │  matriculas       │  │           │   │  crm             │
          │  status:          │  │           │   │  estagio:        │
          │  interesse →      │  │           │   │  lead → nutrido →│
          │  matricula_pend → │  │           │   │  trial → cliente │
          │  confirmada(👤) → │  │           │   │  → churn         │
          │  lista_espera     │  │           │   └──────────────────┘
          └──────────────────┘   │           │
                    └─────────────┴───────────┴─── mensagens (event sourcing, GAP 1)
                                  │
                         ┌────────▼─────────┐
                         │  financeiro       │  receita Saíra (PIX) + Synemusic (Hotmart)
                         │  + metricas        │  em uma visão só (receita líquida consolidada)
                         └───────────────────┘
```

**Schema:** base em `Downloads/files (12)/schema_supabase.sql` (`contatos`, `crm`, `conversas`,
`financeiro`, função `avancar_estagio`, views `v_funil`/`v_receita_semana`) + `002_crm_mensagens.sql`
(`prompts`, `produtos`, `faq`, `metricas_atendimento`, `rate_limit`). A **extensão escolar** foi
criada em **`n8n/migrations/003_extensao_saira.sql`**: `turmas`, `matriculas` (com trigger
guarda-inegociáveis), views `v_vagas` e `v_painel_saira`. **Contato é único**; um mesmo
`contato_id` pode ter linha em `matriculas` e em `crm` — daí "dois funis lado a lado".

> **Dívida técnica sinalizada:** há duas definições de `mensagens` (uuid em `schema_supabase.sql`
> vs bigint em `002`) — consolidar em uma antes de produção (redirecionamento #1: "banco redundante").
> **P-1/P-2 já resolvidos** no `workflow_atendimento_v2.json` (nós `Grava Msg Cliente`/`Grava Resposta Agente` + IF `Tem Resposta?`).

---

## 5. FILTROS, H1–H10 E REGRAS INEGOCIÁVEIS

Toda automação desta camada passa pelos **3 filtros** do Prompt Mestre:
- **[F1] Pedagógico** — o agente serve o aprendizado, não o substitui.
- **[F2] Humanístico (H1–H10)** — "Maestro IA é eletricidade, não professor" (H10). O agente é braço, não voz.
- **[F3] Econômico** — respeita cost-per-MRR (seção 6).

**Inegociáveis operacionais (herdados do `HANDOFF_SAIRA`, agora regra da camada):**
1. **Bot nunca confirma pagamento.** PIX é informado; `confirmada` só por ação manual de Guiga (18h–20h). Dinheiro de família de escola não admite falso positivo.
2. **Bot nunca confirma matrícula final.** Registra `matricula_pendente`; Guiga bate o martelo.
3. **Transparência:** o agente se apresenta como assistente digital na 1ª mensagem. Comunidade pequena — bot disfarçado destrói confiança.
4. **LGPD — minoria de dados de menores:** só primeiro nome + ano escolar. Sem sobrenome, foto ou dado de saúde no banco.
5. **Escopo blindado:** assunto fora do programa de música → secretaria da escola. O canal não vira SAC.
6. **Co-assinatura institucional** (Professora Sueli / coordenação) antes de qualquer bilhete sair.

**Segurança técnica (GAP 3/6):** webhook Evolution valida `apiKey`; rate limit por contato (janela 5s).

---

## 6. ECONOMIA DA CAMADA (Camada X aplicada)

- **Custo de infra alvo:** ~R$200/mês (N8N + Supabase + Resend), viável desde ~2 assinaturas Essenciais.
- **cost-per-MRR ratio** (governança de inferência): saudável **<8%** · alerta **>15%** · crise **>25%**.
  A3 calcula semanalmente; se >15% notifica; se >25% pausa chamadas não-essenciais e encurta prompts.
- **Resiliência de custo:** fallback OpenAI (~1/5 do custo do Sonnet) com prompt reduzido a ~500 tokens.

**KPI-mãe medido continuamente:**

| Dimensão | Como medir |
|----------|-----------|
| Horas/mês economizadas | baseline manual (msgs/dia × min) − tempo pós-automação |
| Receita não-manual | % da receita (Saíra PIX + Synemusic Hotmart) fechada sem Guiga digitar |
| Case Automac | nº de conversas reais documentadas + taxa de conversão conhecida |

---

## 7. ROADMAP — 4 FASES / 8 SEMANAS (mapeado nos ativos existentes)

| Fase | Semana | Entregável | Ativo que já existe | Falta |
|------|--------|-----------|--------------------|-------|
| **0 — Config única** | 1 (seg) | Formulário de setup → popula tabelas | `bilhete_familias.md` (template) | Form + `extensao_schema_saira.sql` |
| **1 — Agente Pesquisador (A3)** | 1–2 | Relatório diário 06h30 | `coleta_operacao.sh` (E8 Escola) | views `v_painel_saira` |
| **2 — Saíra GO-LIVE (A1)** | 2–3 | 1ª família matriculada 100% pelo bot | `workflow_atendimento_v2.json` | instância Evolution nova + P-1/P-2/P-5 |
| **3 — CRM Synemusic beta (A2)** | 3–8 | 50+ conversas, conversão conhecida | Bloco 1 + `workflow_hotmart_v2.json` | depende de P1 (≥3 cantigas Hotmart) |
| **4 — Agente Executivo (A4)** | 6–8 | Operação roda sem comando manual | Blocos 2/5/6/10/11 (esqueleto) | crons de bilhete, follow-up, lembrete |

**Bloqueadores herdados (valem para as duas frentes):** **P-1** (gravar mensagens no histórico —
bloqueia produção), **P-2** (IF resposta null), **P-5** (HTTPS). Sem P-1, nada vai a produção.

---

## 8. FORMULÁRIO DE SETUP (FASE 0 — Guiga preenche 1×, ~30min)

Saída esperada: **JSON de config** que popula `turmas`, `produtos`, `prompts` e env vars.

**Bloco Saíra (as 5 pendências do bilhete):**
1. Instrumentos + faixa de anos por turma
2. Dias/horários + vagas por turma (→ tabela `turmas`)
3. Valor da mensalidade + chave PIX
4. Número/instância Evolution dedicada (nunca o pessoal de Guiga)
5. Confirmação de co-assinatura (coordenação)

**Bloco Synemusic:**
6. Catálogo/preços (Free/Essencial/Performer/Escola) → `produtos`
7. HOTTOK Hotmart + link de compra por produto
8. WhatsApp comercial (instância separada) + WhatsApp de notificação de Guiga

**Bloco governança:**
9. Horário da janela de decisão manual (ex.: 18h–20h) e do relatório (06h30)
10. Limiares cost-per-MRR (default 8/15/25%)

---

## 9. MÉTRICAS DE SUCESSO POR FASE

| Fase | Métrica | Baseline | Meta |
|------|---------|----------|------|
| 0 | Config setup | — | 1×, 30min (Guiga não redigita) |
| 1 | Relatório automático | Nunca | 1/dia 06h30 (~15min/dia economizados) |
| 2 | % matrículas Saíra pelo bot | 0% | 50% das matrículas de agosto (~5h/mês) |
| 3 | Conversas Synemusic documentadas | 0 | 50+ (case Automac pronto) |
| 4 | Mensagens manuais enviadas por Guiga | 100% | 20% (8–10h/mês liberadas) |

---

## 10. INTEGRAÇÃO COM A HIERARQUIA DE VERDADE

- Esta camada **não altera** o Prompt Mestre nem a Bíblia; estende-os. Na próxima revisão do
  Prompt Mestre (**v10.7**), incluir "Camada XI — Operação Orquestrada" na lista de camadas e
  citar este arquivo como fonte.
- Fonte de verdade operacional desta camada: **este documento** + `n8n/` (workflows/schema).
- Cores/formas RNFG continuam vindo de `rng_mapper.ts`/Bíblia — o agente as consome, nunca as redefine.

---

## 11. NOME DA OPERAÇÃO

Recomendado (aderente ao vocabulário Synemusic — MAESTRUM, Ritornello):
**"Operação Orquestrada — Sistema Executivo de Agentes"**.
Alternativas: "Do Manual ao Automático (Caso Real)" · "O Assistente que Multiplica o Solo-Founder".
Decisão final é do Guiga.
