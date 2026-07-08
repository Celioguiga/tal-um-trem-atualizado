# Diagnóstico de Automação — Ecossistema Synemusic
> Análise de negócio + proposta de automação N8N para startup
> Data: 2026-07-06 · Versão: 1.0

---

## Sumário Executivo

O ecossistema Synemusic tem **código funcional mas operação manual**. O Note Form Pro
existe como MVP, o Studio renderiza partituras, a CLI orquestra comandos — mas **não há
um único processo automatizado de negócio**: cadastro não gera lead no CRM, venda não
dispara email, dúvida do usuário não tem resposta automática, finanças são planilha
mental.

Este documento diagnostica as lacunas e propõe **12 workflows N8N** que transformam
a operação de artesanal para automatizada, com custo de ~R$200/mês de infra.

---

## 1. DIAGNÓSTICO — O QUE FALTA

### 1.1 Atendimento ao Cliente (hoje: zero)

| Problema | Impacto |
|----------|---------|
| Aluno chega pelo Instagram, WhatsApp ou blog e não tem resposta automatizada | Perda de lead em <2h |
| Dúvidas sobre RNFG, syntax Cromus, planos — tudo cai no WhatsApp do Guiga | Escala quebrada (Solo-Orchestra) |
| Suporte pós-venda (Hotmart) não tem integração com o app | Aluno paga mas não consegue ajuda no NFP |
| **Não há FAQ, chatbot, ticket ou base de conhecimento integrada** | Cada dúvida é atendimento 1:1 |

### 1.2 Financeiro (hoje: R$0 registrado)

| Problema | Impacto |
|----------|---------|
| Sem gateway de pagamento conectado (Hotmart prometido, não implementado) | Produto não vende |
| Sem registro de receita recorrente (MRR) | Não sabe se negócio é viável |
| Sem controle de custos de IA (Camada X — Eng. de Custo) | LLM pode queimar margem |
| Sem nota fiscal ou relatório financeiro | Não pode crescer B2B / escolas |

### 1.3 Marketing & Vendas (hoje: manual)

| Problema | Impacto |
|----------|---------|
| Lead magnet (Dona Aranha) não entrega ebook automaticamente | Quem baixa não vira lead no CRM |
| Campanhas de marketing são arquivos .md, não disparos reais | Nada sai do papel |
| Sem segmentação: não sabe quem é aluno free, pago, lead, fã | Não personaliza comunicação |
| Sem métrica de funil: visitante → lead → trial → pago → retenção | Cego em todas as etapas |

### 1.4 Infraestrutura (hoje: localhost)

| Problema | Impacto |
|----------|---------|
| NFP roda só em `localhost:5173`, API em `localhost:4243` | Produto não existe para o mundo |
| Sem deploy, sem domínio, sem SSL | Não pode cobrar |
| Sem banco conectado (Supabase schema existe mas vazio) | Dados de usuário voam |
| Sem backup automatizado, sem monitoramento | Se cair, não sabe |

---

## 2. PROPOSTA DE AUTOMAÇÃO — ARQUITETURA N8N

### 2.1 Stack recomendada

```
[Usuário] → Vercel (NFP app)
                  ↓ API
           [N8N Self-Hosted] → Supabase (banco)
           or N8N Cloud          → Hotmart (pagamentos)
                                 → Resend (email)
                                 → WhatsApp API (Z-API / WMeta)
                                 → OpenAI/Claude (FAQ IA)
                                 → Google Sheets (finanças)
                                 → Stripe (fallback)
```

**Custo estimado de operação/mês:**
- N8N self-hosted (Railway ou Fly.io): ~R$80
- Resend (5k emails): ~R$40
- Supabase Pro: ~R$80
- Hotmart taxa: ~10% por venda
- **Total fixo: ~R$200/mês** (viável desde 2 assinaturas Essenciais)

### 2.2 Os 12 Workflows

```
WORKFLOW 01 — Onboarding automático
─────────────────────────────────────
Gatilho: Usuário cadastra no NFP (Supabase auth.users)
Ações:
  1. Busca perfil na tabela public.profiles
  2. Se plano=free:
     - Envia email de boas-vindas (Resend) com tutorial RNFG + link Dona Aranha
     - Agenda email D+3: "Como usar o editor Cromus"
     - Agenda email D+7: "Conheça o plano Essencial"
  3. Se plano=essencial:
     - Envia email de boas-vindas com guia completo + acesso ao suporte
     - Adiciona à lista de alunos ativos (Supabase students)
     - Notifica no Discord/Slack: "Novo assinante: {email}"


WORKFLOW 02 — Captura de lead (lead magnet)
─────────────────────────────────────────────
Gatilho: POST em /api/leads (formulário "baixe Dona Aranha grátis")
Ações:
  1. Registra lead em public.leads (com source, ip_hash, consent)
  2. Envia email com PDF da Dona Aranha (anexo ou link)
  3. Adiciona à lista de nutrição (Resend audience)
  4. Dispara notificação: "Novo lead: {email} — fonte: {source}"


WORKFLOW 03 — Venda Hotmart (pós-compra)
─────────────────────────────────────────────
Gatilho: Webhook Hotmart (compra confirmada)
Ações:
  1. Valida assinatura do webhook (HMAC)
  2. Busca usuário pelo email em auth.users
  3. Se existe: atualiza plan='essencial' em public.profiles
  4. Se não existe: cria convite (magic link) e envia email
  5. Envia email de boas-vindas com instruções
  6. Registra transação em tabela public.transactions
  7. Atualiza MRR no dashboard financeiro (Google Sheets)


WORKFLOW 04 — Cancelamento / Churn
─────────────────────────────────────────────
Gatilho: Webhook Hotmart (cancelamento ou chargeback)
Ações:
  1. Atualiza plan='free' em public.profiles
  2. Envia email de retenção: "O que você perdeu? Ofertas especiais"
  3. Se não reativar em 7 dias:
     - Move para lista de churn
     - Agenda re-engajamento D+30
  4. Notifica churn no dashboard


WORKFLOW 05 — FAQ inteligente (chat + automação)
─────────────────────────────────────────────────
Gatilho: Usuário abre chat no NFP ou envia email para suporte@
Ações:
  1. Mensagem → embedding vector (OpenAI text-embedding-3-small)
  2. Busca similaridade na base de FAQ (Supabase pgvector)
  3. Se match > 85%:
     - Responde automaticamente com link para FAQ
  4. Se match < 85%:
     - Encaminha para Guiga (Discord/Slack)
     - Registra pergunta não respondida em public.faq_pending
     - Se mesma pergunta aparece 3+ vezes: sugere criar novo artigo de FAQ


WORKFLOW 06 — NFP Live: sessão de ensaio
─────────────────────────────────────────
Gatilho: Agendamento de sessão (Calendly / formulário)
Ações:
  1. Cria evento no Google Calendar
  2. Envia email de confirmação com link Meet/Zoom
  3. 1h antes: envia lembrete com material preparatório
  4. Após sessão: envia formulário de feedback
  5. Registra sessão em public.sessions


WORKFLOW 07 — Financeiro automático (MRR + custos)
───────────────────────────────────────────────────
Gatilho: Semanal (cron: toda segunda 8h)
Ações:
  1. Conta assinantes ativos em public.profiles WHERE plan='essencial'
  2. Calcula MRR = assinantes × R$97
  3. Busca custo de API Anthropic/OpenAI do período (Camada X)
  4. Calcula cost-per-MRR ratio
  5. Escreve linha em Google Sheets (dashboard financeiro)
  6. Se ratio > 15%: notifica alerta no Discord
  7. Se ratio > 25%: notifica CRÍTICO + pausa chamadas não-essenciais


WORKFLOW 08 — Backup e saúde do sistema
─────────────────────────────────────────
Gatilho: Diário (cron: 3h da manhã)
Ações:
  1. Backup do banco Supabase (pg_dump → storage)
  2. Verifica se servidor Studio está respondendo (health check)
  3. Verifica se API NFP está no ar
  4. Verifica SSL expiração
  5. Log de tudo para notificação matinal


WORKFLOW 09 — Atualização de conteúdo (Bíblia + cantigas)
───────────────────────────────────────────────────────────
Gatilho: Push no repositório GitHub (áudio/cantigas)
Ações:
  1. Detecta arquivos alterados
  2. Se biblia_cromus.md mudou: notifica "Bíblia atualizada"
  3. Se cantiga nova: dispara pipeline de compilação
  4. Se PDF novo: atualiza booklets no storage


WORKFLOW 10 — Ritornello de marketing automático
─────────────────────────────────────────────────
Gatilho: Semanal (cron: quarta 10h)
Ações:
  1. Pega campanha da semana (tabela public.campaigns WHERE status='active')
  2. Gera rascunho de post Instagram + Reel + YouTube + Blog
     (usa Claude API para adaptar conteúdo da campanha para cada canal)
  3. Salva como rascunho na pasta campanhas/
  4. Notifica para revisão: "Ritornello da semana pronto — revisar?"


WORKFLOW 11 — NPS e retenção
─────────────────────────────
Gatilho: D+30 da assinatura
Ações:
  1. Envia NPS (Net Promoter Score) via email: "De 0 a 10, quanto recomenda?"
  2. Se nota >= 9: pede depoimento/testimonial
  3. Se nota <= 6: dispara alerta de retenção + oferta de desconto
  4. Registra resposta em public.nps_responses


WORKFLOW 12 — Orquestrador do Maestro IA
─────────────────────────────────────────
Gatilho: Aluno faz pergunta no chat do NFP (tópico RNFG)
Ações:
  1. Identifica contexto: qual cantiga? qual grau? qual dúvida?
  2. Consulta base RNFG (rng_mapper.ts + biblia_cromus.md)
  3. Gera resposta socrática via Claude API
  4. Registra interação para métricas de aprendizado
  5. Se dúvida recorrente: sugere novo conteúdo para FAQ

```

---

## 3. IMPLEMENTAÇÃO — FASES

### Fase 1 (Semanas 1-2) — Fundação · Custo: R$0 (tudo free tier)

```
[ ] N8N self-hosted na Railway (plano free)
[ ] Workflow 01 — Onboarding automático (email)
[ ] Workflow 02 — Captura de lead (lead magnet)
[ ] Conectar Resend (100 emails/dia grátis)
[ ] Tabela public.transactions no Supabase
```

### Fase 2 (Semanas 3-4) — Pagamento · Custo: ~R$200/mês

```
[ ] Hotmart webhook configurado
[ ] Workflow 03 — Venda Hotmart (pós-compra)
[ ] Workflow 04 — Cancelamento / Churn
[ ] Workflow 07 — Financeiro automático + dashboard
[ ] Deploy NFP na Vercel (produção)
```

### Fase 3 (Semanas 5-6) — Atendimento · Custo: ~R$300/mês

```
[ ] Workflow 05 — FAQ inteligente (chat + embedding)
[ ] Base de conhecimento RNFG (FAQ pública)
[ ] Workflow 06 — NFP Live agendamento
[ ] WhatsApp Business API conectado
```

### Fase 4 (Semanas 7-8) — Maturidade · Custo: ~R$400/mês

```
[ ] Workflow 08 — Backup e saúde do sistema
[ ] Workflow 09 — CI/CD de conteúdo
[ ] Workflow 10 — Marketing automático (Ritornello)
[ ] Workflow 11 — NPS e retenção
[ ] Workflow 12 — Maestro IA orquestrado
```

---

## 4. IMPACTO ESTIMADO

| Métrica | Hoje | Com automação (D+60) |
|---------|------|----------------------|
| Tempo de resposta ao lead | 2-24h (manual) | <5min (automático) |
| Custo de aquisição de lead | R$0 (só orgânico) | R$2-5 (com rastreio) |
| MRR registrado | R$0 (não mede) | R$2.000-5.000 (20-50 assinantes) |
| Churn rate | Desconhecido | <8% (com retenção ativa) |
| Atendimentos do Guiga/dia | Ilimitados (explícita) | <5/dia (só exceções) |
| Custo de infra/mês | R$0 (só laptop) | ~R$400 (escalável) |

---

## 5. PRÓXIMO PASSO CONCRETO

**O que fazer agora (ainda hoje):**
1. Criar conta no [N8N Cloud](https://app.n8n.cloud) ou deploy local com `docker`
2. Configurar Resend (domínio synemusic.com.br)
3. Implementar Workflow 01 + 02 (os mais simples, maior impacto imediato)
4. Colocar NFP no Vercel com domínio temporário (synemusic.vercel.app)

Quer que eu implemente o passo 1 (deploy do N8N + workflow 01) agora?
