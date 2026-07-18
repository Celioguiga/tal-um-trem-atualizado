# CLAUDE.md — CONTEXTO OPERACIONAL · CROMUS STUDIO / MOTOR CROMUS v2.1
> Synemusic · Executor único: Célio Guiga (Solo-Orchestra)
> Este arquivo é lido automaticamente pelo Claude Code em toda sessão nesta pasta.
> Última consolidação: 2026-07-03 (Prompt Mestre v10.6 + CLI synemusic)

---

## 1. O QUE É ESTE SISTEMA

O **Cromus Studio** é um editor local (Mac) onde o Guiga escreve cantigas em **Sintaxe Cromus** e vê a partitura **Real Nota Forma Grau (RNFG)** renderizada na hora, via LilyPond. Objetivo de produto: produzir as 30 cantigas brasileiras do livro RNFG e evoluir para o Note Form Pro (SaaS).

Princípio RNFG: cada nota tem **cor fixa**, cada grau tem **forma geométrica fixa**; com a tonalidade, as formas rotacionam e as cores acompanham as notas.

## 2. HIERARQUIA DE VERDADE (ordem de prevalência)

1. **`~/prompt_mestre_synemusic_v10.6.md`** — O Prompt Mestre. Visão global do ecossistema Synemusic: MAESTRUM, camadas I–X, pricing, roadmap. LEIA antes de qualquer decisão estratégica ou nova feature.
2. **`~/biblia_cromus.md`** — A BÍBLIA. Fonte única de verdade da sintaxe, cores, formas e padrões. LEIA-A antes de qualquer tarefa que toque em regras, tradução ou renderização. Em conflito com qualquer outro arquivo ou documento, a Bíblia vence.
3. `~/cromus_header.ily` — implementação canônica das formas (stencils). Deve estar 100% conforme a seção 3 da Bíblia.
4. `~/pipeline.py` — motor canônico: gerar_ly(cantiga, saida_ly, modo) monta o .ly; compila REAL e FORMA.
5. `~/cromus_studio.py` — o Studio (servidor local, porta 4242): interface, tradutor, modo admin, Bíblia, diálogo.
6. `~/synemusic/` — CLI unificada do ecossistema (em construção).
7. `~/cantiga_rules.md` — LEGADO. Consultar apenas como histórico.

## 3. MAPA DE ARQUIVOS (home: /Users/celiopereira_synemusic)

| Arquivo/pasta | Papel |
|---|---|---|
| `cromus_studio.py` | Servidor do Studio. Endpoints: GET / (interface), POST /render, GET /pdf, GET+POST /biblia, POST /corrigir, POST /dialogo |
| `pipeline.py` | Motor canônico de geração .ly + compilação LilyPond (NÃO modificar sem ordem explícita) |
| `cromus_header.ily` | Stencils das 7 formas + engraver REAL/FORMA (copiado para studio_tmp a cada render — mudanças valem na renderização seguinte, sem reiniciar) |
| `biblia_cromus.md` | A Bíblia (editável pela aba do Studio) |
| `biblia_versoes/` | Backups automáticos da Bíblia a cada salvamento |
| `correcoes_sintaxe.md` | Caderno: toda correção/interpretação aplicada, com timestamp |
| `studio_tmp/` | Área de trabalho de compilação (descartável) |
| `backups_studio/` | Cópias datadas do cromus_studio.py em estados estáveis |
| `output/` | PDFs finais das cantigas gerados pelo pipeline |
| `synemusic/` | CLI unificada do ecossistema: `synemusic studio`, `synemusic nfp`, etc. |

## 4. AMBIENTE

- macOS · MacBook Air M5 · Python 3.14.5 · LilyPond 2.26.0 (Homebrew) · Claude Code v2.1.159
- Servidor do Studio: `http://localhost:4242`
- Chave da API Anthropic (para /corrigir e /dialogo): `~/.anthropic_env` ou env `ANTHROPIC_API_KEY`
- Modelo das chamadas de IA internas do Studio: `claude-sonnet-4-6`

## 5. SINTAXE CROMUS — RESUMO OPERACIONAL (íntegra na Bíblia, seção 5)

Dígitos 1–7 = graus · vírgula separa tempos · notas agrupadas dividem o tempo igualmente · `-` = pausa · apóstrofo à direita = oitava acima, à esquerda = abaixo · asteriscos = nº de parcelas que a nota ocupa; soma das parcelas no tempo = total da grade; se total não for potência de 2 vira quiáltera automática (ex: `7**6*` = tercina si 2/3 + lá 1/3, `5**5*5*` = colcheia + 2 semicolcheias). Quiáltera explícita: `(3 4 5)` = 1 tempo, `((3 4 5))` = compasso inteiro · `+` = ligadura · `||:` `:||` + `(CASA1)`/`(CASA2)` = ritornello com casas · `FIM` = markup final · `|` é separador visual de compasso · **normalizar `’ ‘ \`` → `'` antes de traduzir**.

Cores v2.1: Dó `#C0001A` · Ré `#ECD200` · Mi `#F07300` · Fá `#00B050` · Sol `#0066FF` · Lá `#8B5E00` · Si `#9B5FC0`.
Formas I→VII: círculo · ogiva de pontas agudas (escala 0,75 na pauta) · triângulo ponta p/ cima · quadrado · estrela 5 pontas · hexágono · casinha (polígono único de 7 vértices, telhado ~39°, beirais ±0,60 > parede ±0,46, base recolhida ±0,32). Coordenadas exatas: Bíblia seção 3.

## 6. REGRAS DE OURO (invioláveis)

1. **LEIA a Bíblia antes** de qualquer tarefa sobre sintaxe, tradução ou formas.
2. **NUNCA** hardcode cores/formas/graus fora de `cromus_header.ily` e `rng_mapper.ts`.
3. **NUNCA** use emojis para representar formas — geometria pura; a cor pertence à nota.
4. **NUNCA** aproxime formas (estrela≠círculos concêntricos; casinha≠retângulo; ogiva≠elipse de pontas redondas).
5. **NÃO modifique** `pipeline.py` nem `cromus_header.ily` sem ordem explícita; alterações em formas exigem conformidade com a Bíblia seção 3.
6. Mudanças de regra só valem **após registro na seção 9 da Bíblia** (Histórico de Decisões).
7. Em tarefas longas: **edições pequenas e sequenciais**, nunca imprimir arquivos inteiros na resposta (limite de 32k tokens de saída), resumos de 2–3 linhas por passo.
8. Toda interpretação/correção aplicada deve ser registrada em `correcoes_sintaxe.md`.

## 7. ROTINAS

**Reiniciar o Studio** (necessário após editar cromus_studio.py ou pipeline.py; NÃO necessário para Bíblia e cromus_header.ily):
```
pkill -f cromus_studio
cd ~ && python3 cromus_studio.py   # em background quando executado pelo Claude Code
```
Regra do operador: a janela do Terminal que roda o servidor é só dele; comandos vão em janela nova.

**Backup de estado estável:**
```
mkdir -p ~/backups_studio && cp ~/cromus_studio.py ~/backups_studio/cromus_studio_AAAA-MM-DD.py
```

**Validar o tradutor:** O Pião é o gabarito — traduzir a sintaxe original e comparar com o LilyPond validado no pipeline até bater nota a nota.

**Ciclo de aprendizado do sistema:**
render → dúvida/erro → aba Diálogo (editor propõe interpretações OU Guiga dita a correção) → decisão aplicada e registrada no caderno → correções recorrentes são promovidas a regra na Bíblia → tradutor é atualizado conforme a Bíblia.

## 8-0. HANDOFF DA SESSÃO 2026-07-08 (LER PRIMEIRO)

> Sessão feita no OpenCode; continuidade no Claude Code. Estado atual do trabalho:

**Bugs corrigidos no `cromus_studio.py` (valem para Studio 4242 e NFP 5173 — mesmo backend via proxy):**
1. **Oitava abaixo `'5`** — tokenizador de `_converter_tempo` não aceitava apóstrofo à esquerda nem acidentes `#/b`; adicionada normalização de apóstrofos curvos (macOS U+2019 → U+0027).
2. **`'7` sumia ao mudar de clave** — `transpose_cromus`/`_parse_cromus_token` não reconheciam apóstrofo curvo nem notas grudadas em vírgula/parênteses; quebra ampliada para `[\s,|()]+` + normalização.
3. **Grau 1 (Dó) virava hexágono ao mudar de clave (ESTRUTURAL)** — `_transpor_sintaxe_para_clef` agora é **NO-OP**: mudar de clave só troca o glifo, preserva altura/forma. Regra registrada na Bíblia seção 5.
4. **Ritmo `5 * * * 4 *`** (colcheia pontuada) — regressão do fix 1; agora cola só os asteriscos ao token anterior (`re.sub(r'\s+\*','*')`).
5. **Compasso 3/4 (e 6/8)** — barra de compasso passou a contar TEMPOS REAIS via `_beats_de_ly`/`_beats_flat` contra `beats_por_compasso = num*4/denom` (trata mínima, ponto, quiáltera).
Tudo validado compilando no LilyPond; registrado em `correcoes_sintaxe.md`. Backups em `backups_studio/`.

**Camada XI — Operação Orquestrada (negócio):** doc canônico em `synemusic/camada_XI_operacao_orquestrada.md`; Camada XI adicionada ao Prompt Mestre (adendo, consolidar em v10.7).

**Trabalho na pasta `n8n/` (ATENÇÃO: está no `.gitignore`, não versionado):**
- Cadeia de migrações reconciliada: `000_base_crm_atendimento.sql` → `002` (sem `mensagens` duplicada) → `003_extensao_saira.sql` (turmas/matriculas + trigger guarda-inegociáveis + views `v_vagas`/`v_painel_saira`) → `004_rpc_gravar_mensagem.sql`.
- Workflow `workflow_atendimento_v2.json`: nós de gravação passam a chamar `rpc/gravar_mensagem` (corrige P-1 de verdade — o insert antigo não mandava `contato_id`). Backup `.bak_*` na mesma pasta.
- **Validação pendente:** rodar as migrações no Supabase e reimportar o workflow no N8N (não há Postgres/N8N local).

**Pendências levantadas pelo Guiga (aguardando conteúdo):** trecho de sintaxe onde a **ligadura** falha; **lista de assuntos do NFP**.

**Git:** raiz = HOME (`~`), branch `main`. Rastreados e modificados: `cromus_studio.py`, `biblia_cromus.md`, `correcoes_sintaxe.md`, `prompt_mestre_synemusic_v10.6.md`, `CLAUDE.md` + novo `synemusic/camada_XI_operacao_orquestrada.md`. `n8n/`, `Downloads/`, `Library/`, `Documents/`, `.anthropic_env` estão no `.gitignore`. Sugestão: commit dos fixes do Cromus (1) e da Camada XI (2) separadamente; `backups_studio/` idealmente no `.gitignore`.

---

## 8. ESTADO ATUAL (2026-07-03)

**Implementado em 14/06 (Cromus Studio v2.1):**
- Conversor de DURAÇÕES POR CONTEXTO validado (9/9 testes): vírgula=tempo, asteriscos=parcelas, grades automáticas
- QUIÁLTERAS: detecção automática (total não-potência-de-2) + explícitas `(3 4 5)` e `((3 4 5))`
- Oitavas `5'`/`'5`, acidentes `3#`/`3b`, pausas `-`
- Adaptador conectado ao pipeline via `notas_ly_raw` (assinatura gerar_ly(cantiga, saida_ly, modo))
- Conversão de durações studio→pipeline (w/h/q/e/s/t)
- Painel de notas redimensionável à esquerda (resizer arrastável)
- Áudio (Tone.js), exportação MIDI/WAV/.ly, importação PDF/MusicXML, undo/redo, busca inline, tema claro/escuro, log
- Bíblia atualizada para 273 linhas com dicionário de conversão validado
- CLI unificada `synemusic/` (Python) iniciada — subcomandos studio, nfp, live, transcribe, etc.

**ATENÇÃO — lições de 14/06:** o Claude Code corrompeu o cromus_studio.py ao reescrevê-lo inteiro (estourou 32k tokens, reduziu para 104 linhas). SEMPRE usar str_replace pequeno + backup antes. Ver Bíblia seção 7 (tabela de erros resolvidos).

---

## 8b. ESTADO ANTERIOR (2026-06-12)

**Pronto e funcionando:** Studio no ar (porta 4242) · tradutor traduzir_sintaxe() validado contra O Pião · Modo Admin com painel LilyPond editável + Corrigir com IA · aba Bíblia com versionamento · caderno de correções · stencils da ogiva (pontas agudas) e casinha (definitiva) atualizados conforme Bíblia v1.2 · aba Diálogo (interpretações com opções clicáveis) implementada/em implantação.

**Pendências (Bíblia seção 8):** confirmar aposentadoria dos sufixos antigos de duração (s,c,m,i,f) · formalizar gramática completa dos asteriscos · interpretação de `` 2` `` em textos antigos · compassos compostos (6/8) · ratificar orientação do hexágono · verificação visual das 7 formas nos PDFs de O Pião (REAL+FORMA).

**Cantigas:** 3 completas (Dona Aranha, Peixe Vivo, Caranguejo — pré-correção de formas; precisarão ser recompiladas) + O Pião (gabarito do tradutor). Meta: 30.

## 9. COMO RECEBER TAREFAS

O Guiga descreve o objetivo em linguagem natural (frequentemente por voz, com possíveis erros de transcrição — ex.: "Cromos"=Cromus, "Not Form"=Note Form). Ao receber uma tarefa: (1) ler a Bíblia se o tema tocar regras/formas/tradução; (2) confirmar entendimento em 1 linha; (3) executar em passos pequenos; (4) validar (compilar O Pião quando aplicável); (5) reiniciar o servidor se tocou em código; (6) reportar resumo curto.
