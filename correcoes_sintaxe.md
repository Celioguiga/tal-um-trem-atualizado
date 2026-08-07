
---
**2026-06-13 00:58:05**

**Sintaxe:** ` -*-*5*5* | 1’1’, 72’|1’*7**6*,5**5*5*| 1’1’, 72’|

|1’*7**6*,5|1’*5**3*,25|4*3**2*, 1|1’*5**3*,25|4*3**2*, 1**5*5*|| 

`

**Dúvida:** 

**Decisão:** Substituído o primeiro compasso por r4. g'16 g'16, representando a anacruse de duas semicolcheias de Sol precedida de pausa semínima pontuada, conforme sintaxe Cromus -*-*5*5*

---
**2026-06-13 00:58:06**

**Sintaxe:** ` -*-*5*5* | 1’1’, 72’|1’*7**6*,5**5*5*| 1’1’, 72’|

|1’*7**6*,5|1’*5**3*,25|4*3**2*, 1|1’*5**3*,25|4*3**2*, 1**5*5*|| 

`

**Dúvida:** 

**Decisão:** (correção automática)

---
**2026-06-13 00:59:59**

**Sintaxe:** ` -*-*5*5* | 1’1’, 72’|1’*7**6*,5**5*5*| 1’1’, 72’|

|1’*7**6*,5|1’*5**3*,25|4*3**2*, 1|1’*5**3*,25|4*3**2*, 1**5*5*|| 

`

**Dúvida:** 

**Decisão:** Aplicada a regra canônica da Bíblia Cromus: Ogiva do Ré (Grau II) deve ter escala horizontal 0.75. Adicionado override de NoteHead para todas as notas Ré (d') com font-size e X-extent ajustados via shape para ogiva esticada horizontalmente em 0.75.

---
**2026-06-13 01:00:00**

**Sintaxe:** ` -*-*5*5* | 1’1’, 72’|1’*7**6*,5**5*5*| 1’1’, 72’|

|1’*7**6*,5|1’*5**3*,25|4*3**2*, 1|1’*5**3*,25|4*3**2*, 1**5*5*|| 

`

**Dúvida:** 

**Decisão:** (correção automática)

---
**2026-06-13 01:04:03**

**Sintaxe:** ` -*-*5*5* | 1’1’, 72’|1’*7**6*,5**5*5*| 1’1’, 72’|

|1’*7**6*,5|1’*5**3*,25|4*3**2*, 1|1’*5**3*,25|4*3**2*, 1**5*5*|| 

`

**Dúvida:** 

**Decisão:** Aplicado alongamento horizontal 0.45 para a ogiva do Ré (Grau II), atualizando a Bíblia Cromus: escala horizontal do Grau II passa de 0.75 para 0.45.

---
**2026-06-13 01:04:03**

**Sintaxe:** ` -*-*5*5* | 1’1’, 72’|1’*7**6*,5**5*5*| 1’1’, 72’|

|1’*7**6*,5|1’*5**3*,25|4*3**2*, 1|1’*5**3*,25|4*3**2*, 1**5*5*|| 

`

**Dúvida:** 

**Decisão:** (correção automática)

---
**2026-06-13 01:07:42**

**Sintaxe:** ` -*-*5*5* | 1’1’, 72’|1’*7**6*,5**5*5*| 1’1’, 72’|

|1’*7**6*,5|1’*5**3*,25|4*3**2*, 1|1’*5**3*,25|4*3**2*, 1**5*5*|| 

`

**Dúvida:** 

**Decisão:** Aplicada Opção A: re-ogiva agora usa ly:make-stencil com X-extent recalculado após escala 0.45, e cada nota Ré recebe \once \override NoteHead.X-extent = #'(-0.3 . 0.3) para forçar a diferença visual.

---
**2026-06-13 01:07:42**

**Sintaxe:** ` -*-*5*5* | 1’1’, 72’|1’*7**6*,5**5*5*| 1’1’, 72’|

|1’*7**6*,5|1’*5**3*,25|4*3**2*, 1|1’*5**3*,25|4*3**2*, 1**5*5*|| 

`

**Dúvida:** 

**Decisão:** (correção automática)

---
**2026-06-13 01:08:53**

**Sintaxe:** ` -*-*5*5* | 1’1’, 72’|1’*7**6*,5**5*5*| 1’1’, 72’|

|1’*7**6*,5|1’*5**3*,25|4*3**2*, 1|1’*5**3*,25|4*3**2*, 1**5*5*|| 

`

**Dúvida:** 

**Decisão:** Aplicada Opção B: cabeça de nota do Ré (Grau II) substituída por elipse alongada horizontalmente via make-ellipse-stencil com proporção 1.2 horizontal e 0.55 vertical, diferenciando claramente a ogiva do Grau II das demais figuras.

---
**2026-06-13 01:08:53**

**Sintaxe:** ` -*-*5*5* | 1’1’, 72’|1’*7**6*,5**5*5*| 1’1’, 72’|

|1’*7**6*,5|1’*5**3*,25|4*3**2*, 1|1’*5**3*,25|4*3**2*, 1**5*5*|| 

`

**Dúvida:** 

**Decisão:** (correção automática)

---
**2026-06-14 13:59:47**

**Sintaxe:** `| - , - , 5 | 5, 31’, 76| 5, 4, 6| 6,41’,76|

 |6+,6, 6| 1, 1`1`,21|7,6,6|5,76,42|

(CASA1)1+1,1:||(CASA2)1+1,-||FIM
`

**Dúvida:** 

**Decisão:** No compasso '|6+,6, 6|' (3/4), as duas primeiras notas 'a'' estavam ligadas (6+,6) como duas semínimas. Transformei a ligadura em uma mínima explícita (a'2), mantendo a terceira semínima (a'4) intacta.

---
**2026-06-14 13:59:47**

**Sintaxe:** `| - , - , 5 | 5, 31’, 76| 5, 4, 6| 6,41’,76|

 |6+,6, 6| 1, 1`1`,21|7,6,6|5,76,42|

(CASA1)1+1,1:||(CASA2)1+1,-||FIM
`

**Dúvida:** 

**Decisão:** (correção automática)

---
**2026-06-14 14:00:49**

**Sintaxe:** `| - , - , 5 | 5, 31’, 76| 5, 4, 6| 6,41’,76|

 |6+,6, 6| 1, 1`1`,21|7,6,6|5,76,42|

(CASA1)1+1,1:||(CASA2)1+1,-||FIM
`

**Dúvida:** 

**Decisão:** No compasso '|6+,6, 6|' (3/4), as duas primeiras notas 'a'' estavam ligadas (6+,6) como duas semínimas. Transformei a ligadura em uma mínima explícita (a'2), mantendo a terceira semínima (a'4) intacta. O compasso já estava correto com a'2 a'4 — confirmado e mantido.

---
**2026-06-14 14:00:50**

**Sintaxe:** `| - , - , 5 | 5, 31’, 76| 5, 4, 6| 6,41’,76|

 |6+,6, 6| 1, 1`1`,21|7,6,6|5,76,42|

(CASA1)1+1,1:||(CASA2)1+1,-||FIM
`

**Dúvida:** 

**Decisão:** (correção automática)

---
**2026-06-14 14:09:24**

**Sintaxe:** `| - , - , 5 ||: 5, 31’, 76| 5, 4, 6| 6,41’,76| 

| 5+,5, 5| 1', 1`1`,2'1'|7,6,6|5,76,42|

|(CASA1)1+,1,1:||(CASA2)1+,1,-`

**Dúvida:** 

**Decisão:** Adicionado \break após cada grupo de compassos para forçar 4 compassos por linha, respeitando a estrutura da peça em 3/4 com anacruse.

---
**2026-06-14 14:09:24**

**Sintaxe:** `| - , - , 5 ||: 5, 31’, 76| 5, 4, 6| 6,41’,76| 

| 5+,5, 5| 1', 1`1`,2'1'|7,6,6|5,76,42|

|(CASA1)1+,1,1:||(CASA2)1+,1,-`

**Dúvida:** 

**Decisão:** (correção automática)

---
**2026-06-14 14:10:15**

**Sintaxe:** `| - , - , 5 ||: 5, 31’, 76| 5, 4, 6| 6,41’,76| 

| 5+,5, 5| 1', 1`1`,2'1'|7,6,6|5,76,42|

|(CASA1)1+,1,1:||(CASA2)1+,1,-`

**Dúvida:** 

**Decisão:** Revertido para as configurações de página canônicas da Bíblia Cromus: global-staff-size 32, margens padrão, sem uniform-stretching.

---
**2026-06-14 14:10:15**

**Sintaxe:** `| - , - , 5 ||: 5, 31’, 76| 5, 4, 6| 6,41’,76| 

| 5+,5, 5| 1', 1`1`,2'1'|7,6,6|5,76,42|

|(CASA1)1+,1,1:||(CASA2)1+,1,-`

**Dúvida:** 

**Decisão:** (correção automática)

---
**2026-06-14 14:11:11**

**Sintaxe:** `| - , - , 5 ||: 5, 31’, 76| 5, 4, 6| 6,41’,76| 

| 5+,5, 5| 1', 1`1`,2'1'|7,6,6|5,76,42|

|(CASA1)1+,1,1:||(CASA2)1+,1,-`

**Dúvida:** 

**Decisão:** Adicionado markup 'FIM' após a barra final no último compasso.

---
**2026-06-14 14:11:11**

**Sintaxe:** `| - , - , 5 ||: 5, 31’, 76| 5, 4, 6| 6,41’,76| 

| 5+,5, 5| 1', 1`1`,2'1'|7,6,6|5,76,42|

|(CASA1)1+,1,1:||(CASA2)1+,1,-`

**Dúvida:** 

**Decisão:** (correção automática)

---
**2026-06-14 14:12:13**

**Sintaxe:** `| - , - , 5 ||: 5, 31’, 76| 5, 4, 6| 6,41’,76| 

| 5+,5, 5| 1', 1`1`,2'1'|7,6,6|5,76,42|

|(CASA1)1+,1,1:||(CASA2)1+,1,-`

**Dúvida:** 

**Decisão:** Mantida a palavra FIM e ajustada a barra final para dupla \bar "|." já estava correta como barra final; confirmado que \bar "||" não é o padrão — a barra canônica de fim é \bar "|." que já estava presente. Reconfirmado sem alteração de notas.

---
**2026-06-14 14:12:13**

**Sintaxe:** `| - , - , 5 ||: 5, 31’, 76| 5, 4, 6| 6,41’,76| 

| 5+,5, 5| 1', 1`1`,2'1'|7,6,6|5,76,42|

|(CASA1)1+,1,1:||(CASA2)1+,1,-`

**Dúvida:** 

**Decisão:** (correção automática)

## 2026-06-14 — Durações por contexto + quiálteras
- Vírgula = separa tempos (confirmado)
- Asteriscos após nota = parcelas que ocupa; soma = grade
- Quiálteras: (3 4 5) = 1 tempo, ((3 4 5)) = compasso
- Oitava: 5' acima, '5 abaixo
- Adaptador via notas_ly_raw (gerar_ly recebe dict cantiga)
- Durações studio (whqest) convertidas no _sintaxe_para_ly_raw

---
**2026-07-08 (BUGFIX tradutor — oitava abaixo e acidentes)**

**Sintaxe:** `'5` `''5` `3#` `3b` `1 '1 1'`

**Dúvida:** Guiga reportou que o apóstrofo à esquerda (nota grave) não abaixava a oitava na renderização.

**Causa raiz (cromus_studio.py, _converter_tempo):**
1. Regex do tokenizador (linha ~482) só aceitava apóstrofo à DIREITA e não capturava `#`/`b` — descartava o apóstrofo esquerdo e os acidentes antes de chegar ao _parse_nota.
2. `.replace(' ','')` colava o apóstrofo de `'1` como oitava-ACIMA da nota anterior (`1 '1 1'` → `c'' c' c''`).
3. Apóstrofos curvos do macOS (U+2019 etc.) não eram normalizados nesta rota.

**Decisão/correção:**
- Regex novo: `'*[0-7]['#b]*...` aceita apóstrofo à esquerda, à direita e acidentes; removido o `.replace(' ','')`.
- Normalização `' ' ‛ ` ´ → '` adicionada no início de _converter_tempo (conforme Bíblia seção 5).
- Bônus: acidentes `3#`→`eis'`, `3b`→`ees'` também estavam quebrados e foram corrigidos.

**Validação:** bateria 9/9 da Bíblia sem regressão + casos novos (`'5`→g, `''5`→g,, curvo→ok, `1 '1 1'`→c' c c'') + compilação real no LilyPond OK. Backup: backups_studio/cromus_studio_2026-07-08_pre-oitava-fix.py

---
**2026-07-08 (BUGFIX transposição por clave — nota grave '7 não escrita)**

**Sintaxe:** `'7` (e qualquer nota com apóstrofo) ao trocar a clave na interface.

**Dúvida:** Guiga reportou que, ao mudar a clave, a nota `'7` não era escrita no pentagrama.

**Causa raiz (cromus_studio.py):**
- Bug A: `_parse_cromus_token` só reconhecia apóstrofo RETO (`^['1-7]`). O `'7` curvo (U+2019, padrão do macOS) não era transposto — as demais notas moviam com a clave e o `'7` ficava no lugar errado.
- Bug B: `transpose_cromus` só quebrava em espaços; a última nota de cada tempo (grudada na vírgula, ex.: `3,`) falhava no parse e não era transposta.

**Decisão/correção:**
- Helper `_normalizar_apostrofos` (' ' ‛ ` ´ → ') aplicado no início de `gerar_arquivo_ly` e de `transpose_cromus` — chokepoint antes de qualquer transposição.
- `transpose_cromus` agora quebra em `[\s,|]+` (espaço, vírgula, barra), isolando a nota final do tempo.

**Validação:** `'7` (reto E curvo) transposto corretamente nas 8 claves (G_2, G_1, C_1, C_2, C_3, C_4, F_3, F_4); as duas ocorrências de `'7` na mesma linha ficam idênticas; compilação real no LilyPond OK nas 8 claves. Limitação remanescente conhecida: quiálteras entre parênteses `(3 4 5)` ainda não transpõem as notas de borda ao mudar clave (fora do escopo).

---
**2026-07-08 (BUGFIX transposição por clave — quiálteras entre parênteses)**

**Sintaxe:** `(3 4 5)`, `((1 3 5))` ao trocar a clave.

**Causa raiz:** `transpose_cromus` quebrava apenas em `[\s,|]+`, então `(3` e `5)` incluíam o parêntese e falhavam no `_parse_cromus_token` — as notas de BORDA da quiáltera não eram transpostas ao mudar de clave.

**Correção:** quebra ampliada para `[\s,|()]+` (inclui parênteses). Os parênteses são preservados como separadores na remontagem. `(CASA1)`/`(CASA2)` continuam intactos (o miolo `CASA1` é rejeitado pelo parser, então o dígito interno não é transposto).

**Validação:** `(3 4 5)`→`(5 6 7)` em C_3, `((1 3 5))`→`((3 5 7))`, `('7 1 2)` com oitava-abaixo dentro da quiáltera OK; compilação real no LilyPond nas claves G_2/C_3/C_4/F_4.

---
**2026-07-08 (BUGFIX ESTRUTURAL — mudança de clave alterava a FORMA do grau)**

**Relato:** grau 1 (Dó), na clave de Dó na 2ª linha (C_2), era desenhado com a forma do 6º grau (Lá, hexágono).

**Causa raiz:** o engraver de FORMA (cromus_header.ily) deriva a forma da ALTURA REAL da nota (`ly:pitch-notename`). A função `_transpor_sintaxe_para_clef` transpunha os graus ao mudar de clave ("manter posição visual"), mudando a altura → Dó (c') em C_2 virava Lá (a) → hexágono. Bug global em todas as claves não-G_2.

**Correção:** `_transpor_sintaxe_para_clef` agora é NO-OP (retorna a sintaxe intacta). Mudar de clave só troca o glifo (`_gerar_clef_override`/`_CLEF_LILYNAME`); o LilyPond reposiciona as mesmas alturas. Dó continua círculo/vermelho em qualquer clave.

**Escopo:** afeta as DUAS versões — Studio (4242) e NFP (5173) — porque ambas renderizam via `localhost:4242/render` (proxy do Vite e nfp/server.py). Uma única correção no cromus_studio.py resolve as duas.

**Validação:** grau 1 = `c'` em todas as 8 claves (G_2/G_1/C_1/C_2/C_3/C_4/F_3/F_4); escala `1 2 3 4 5 6 7 1'` em FORMA/C_2 renderizada e inspecionada visualmente (círculo, ogiva, triângulo, quadrado, estrela, hexágono, casinha, círculo); compilação LilyPond OK em REAL e FORMA. Backup: backups_studio/cromus_studio_2026-07-08_pre-clef-shape-fix.py

Registrado também na Bíblia (seção 5 + histórico de erros).

---
**2026-07-08 (BUGFIX ritmo — colcheia pontuada com asteriscos espaçados)**

**Relato:** `5 * * * 4 *` (compasso) saía como duas colcheias em vez de colcheia pontuada + semicolcheia.

**Causa:** regressão do fix de oitava-à-esquerda — ao remover `.replace(' ','')`, os asteriscos separados por espaço da nota (`5 * * *`) eram descartados pelo tokenizador; sobrava `5` e `4` (parcelas 1+1 = duas colcheias).

**Correção:** em `_converter_tempo`, colar SÓ os asteriscos ao token anterior via `re.sub(r'\s+\*', '*', clean_g)` antes de tokenizar — sem remover os demais espaços (preserva `'1`). `5 * * * 4 *` e `5***4*` agora dão `g'8. f'16`.

**Validação:** trecho compilado no LilyPond; sem regressão em `'5`, `1 '1 1'`, `-*-*5*5*`, `7**6*`, acidentes. Vale para 4242 e 5173 (mesmo backend).

---
**2026-07-08 (BUGFIX compasso 3/4 — barras de compasso com notas longas)**

**Relato:** sintaxe em 3/4 não era processada corretamente.

**Causa raiz:** em `_sintaxe_para_ly_raw`, a barra de compasso era inserida contando 1 por GRUPO (vírgula), assumindo que todo tempo = 1 semínima. Com notas longas (mínima `1h`, mínima pontuada `1h.`), comuns em valsa 3/4, a conta de tempos ficava errada e a barra sumia/deslocava. Ex.: `1h, 3` (3 tempos) não recebia barra; `1h.` (compasso inteiro) idem.

**Correção:** helpers `_beats_de_ly`/`_beats_flat` calculam os tempos REAIS de cada grupo (duração LilyPond → semínimas, tratando pontos e `\tuplet`). A barra passa a contar tempos reais contra `beats_por_compasso = num*4/denom` (3/4→3, 4/4→4, 6/8→3, 2/2→4), carregando o resto entre compassos.

**Validação:** `1h, 3`→`c'2 e'4 |`; `1h.`→`c'2. |`; valsa e quiálteras em 3/4 corretas; sem regressão em 2/4 e 4/4; mínimas em 4/4 (`1h,2h,3h`→`c'2 d'2 | e'2`); compilação LilyPond sem avisos de barcheck. Vale para 4242 e 5173. Bônus: melhora 6/8 e compassos com denominador ≠ 4.

---
**2026-08-03 (BUGFIX quiáltera falsa em compasso composto — 6/8, 9/8, 12/8)**

**Relato:** trazido do ciclo de melhorias do Pro Studio (`~/dev/pro_studio/`, item P5 do `HANDOFF_PRO_STUDIO_V3.md`, 30/07) — em compasso composto, 3 notas iguais dividindo naturalmente 1 tempo (ex.: `5*5*5*`) deveriam sair como 3 colcheias retas, mas em `cromus_studio.py` a detecção automática de quiáltera nunca sabia se o compasso era composto.

**Causa raiz:** `_eh_tuplet_total(total)` sempre comparava contra a série binária pura `(1,2,4,8,16,32)`, e `_converter_tempo` sempre tratava "1 tempo" como 1 semínima (`unidade=1.0`), mesmo quando a fórmula de compasso era 6/8, 9/8 ou 12/8 (onde 1 tempo é uma semínima pontuada, que se subdivide naturalmente em 3). Resultado: `5*5*5*` em 6/8 virava `\tuplet 3/2 {...}` (tercina) em vez de 3 colcheias retas.

**Correção:** `_sintaxe_para_ly_raw` calcula `compound = (denom==8 and num%3==0)` a partir da fórmula de compasso e passa adiante para `_converter_tempo(g, compound)`. Dentro dele: `_eh_tuplet_total(total, compound)` passa a comparar contra `(1,3,6,12,24,48)` quando composto (3 × potência de 2, em vez da série binária pura); `unidade_tempo` vira `1.5` (semínima pontuada) em vez de `1.0` quando composto — a tabela `POW2` já tinha as entradas pontuadas certas (`1.5→'4.'`, `0.75→'8.'` etc.), então não precisou de tabela nova. Tuplet explícito `(3 4 5)`/`((...))` não muda — continua forçado por sintaxe, independente do compasso.

**Validação:** `_converter_tempo('5*5*5*', compound=True)` → `g'8 g'8 g'8` (reto, sem tercina); `compound=False` no mesmo grupo → `\tuplet 3/2 {...}` (regressão preservada); `5*5*5*5*5*5*` em 6/8 → 6 semicolcheias retas; nota única em 6/8 → `g'4.`; compilação completa via `compilar()` OK (LilyPond sem erro) em 6/8, 9/8 e 12/8, e regressão OK em 4/4 (tercina) e 3/4 (sintaxe comum). Vale para 4242 e 5173 (mesmo backend via proxy). Backup: `backups_studio/cromus_studio_2026-08-03.py`. Não portado: duplet/tuplet irregular em composto (ex. 2 notas dividindo 1 tempo composto) — caso raro, fora de escopo desta correção.

---
**2026-08-03 (FEATURE — vozes/polifonia simultânea: `@voz2:`, `@voz3:`, `@voz4:`)**

**Relato:** feature nova (não existia em lugar nenhum do backend) — pedida como parte do mesmo ciclo de trazer pro `cromus_studio.py` o que fazia falta, inspirada no item "vozes/polifonia por corda" do Pro Studio (30/07), mas generalizada pra pauta comum em vez de amarrada a corda de violão (decisão tomada em conversa: `@vozN:` genérico, não `@cordaN:`).

**Sintaxe:** a voz principal continua exatamente como hoje, sem marcador nenhum. `@voz2:`, `@voz3:`, `@voz4:` (case-sensitive, sempre minúsculo) marcam, dentro do MESMO texto Cromus, uma voz extra completa e independente — sintaxe R7 igual à de sempre (vírgulas, pausas, ligaduras, oitavas, acidentes por nota) — valendo até o próximo marcador ou o fim do texto. Máximo 4 vozes simultâneas (limite dos contextos `\voiceOne`..`\voiceFour` do LilyPond). Retrocompatibilidade total: nenhuma cantiga existente muda, porque nenhuma tem `@vozN:`.

**Implementação (`cromus_studio.py`):** `_is_polifonico`/`_split_vozes` detectam e separam as vozes via `re.split(r'@voz(\d+)\s*:', sintaxe)` — funciona mesmo se `_transpor_sintaxe_real_nota` (modo REAL_NOTA) já tiver achatado quebras de linha em espaços, porque não depende de `^` início-de-linha, só do texto literal do marcador. `_sintaxe_para_ly_raw_polifonico` roda `_sintaxe_para_ly_raw` (inalterada) em cada voz separadamente — reaproveita de graça todo o motor já validado (quiáltera, compasso composto, oitava, ligadura); tira as vozes extras dos marcadores estruturais (`||:` `:||` `(CASA1/2)` `FIM` `D.C.` `D.S.`) porque só a voz principal governa repetição/estrutura do compasso; valida que todas as vozes têm o MESMO número de compassos (conta `|` no corpo de cada uma) — erro `ValueError` claro se não bater, sem tentar preencher/truncar sozinho. Monta `<< \new Voice { \voiceOne ... } \new Voice { \voiceTwo ... } ... >>` dentro do `\new Staff` já existente — **não precisou tocar em `pipeline.py`**: `notas_ly_raw` já era inserido cru dentro de `\new Staff { ... }`, então o bloco `<<...>>` de polifonia cabe ali sem mudar o template canônico. Direção de haste: **não reimplementa** a regra grave=baixo/aguda=cima na mão — os contextos nativos `\voiceOne`/`\voiceThree` (haste cima) e `\voiceTwo`/`\voiceFour` (haste baixo) do LilyPond já resolvem isso corretamente, é a forma idiomática do próprio motor de gravura (diferente do Pro Studio, que precisa desenhar haste na mão em SVG por não ter motor de partitura).

**Validação:** compilação completa via `compilar()` com 2 vozes (melodia + pausas/nota longa) e com 4 vozes simultâneas (graus diferentes em cada voz) — `ok: True`, sem erro do LilyPond; PNG inspecionado visualmente — formas/cores RNFG corretas em cada voz, noteheads e hastes das 4 vozes coexistindo na mesma pauta sem colisão. Erro esperado testado: vozes com número de compassos diferente (`ValueError` claro, "A voz 2 (@voz2:) tem 1 compasso(s), mas a voz principal tem 2..."); `@voz5:` rejeitado ("máximo de 4 vozes simultâneas"). Regressão: sintaxe sem `@vozN:` continua compilando idêntico a antes (`_is_polifonico` retorna `False`, cai na rota de sempre). Vale para 4242 e 5173 (mesmo backend via proxy).

**Fora de escopo desta rodada:** modo TAB (tablatura de violão) — a ideia de mapear voz→corda ficou registrada como possibilidade futura, mas não foi implementada; hoje `@vozN:` só funciona nos modos REAL/FORMA/REAL_NOTA/STAFFLESS (pauta comum). Reconciliar com a sintaxe `~`/`+` de ligadura documentada na Bíblia seção 9 (2026-07-29) dentro de cada voz — não testado a fundo, mas deve funcionar por reaproveitar `_sintaxe_para_ly_raw` sem mudança.

---
**2026-08-03 (CORREÇÃO DE FORMA — geometria da casinha, grau 7/Si, em `cromus_header.ily`)**

**Relato:** a Bíblia seção 3 já tinha a geometria da casinha atualizada (validada contra `renderer.js`/`shapeSvg` do Pro Studio em 2026-07-30: beiral bem mais largo que a parede, telhado baixo), mas o `cromus_header.ily` — o motor de verdade que desenha as formas no LilyPond — ainda estava na versão antiga: corpo levemente afunilado, telhado quase da mesma altura da parede, beiral só 1,3× a parede (deveria ser ~1,74×). Resultado visual: casinha parecia mais um pentágono arredondado do que uma casa com beiral evidente.

**Causa raiz:** `cromus_header.ily` nunca tinha sido atualizado depois que a geometria foi fechada com o Guiga via Pro Studio — a Bíblia documentava a forma certa, mas o stencil LilyPond continuava com números antigos.

**Correção:** reconstruí `make-casinha` a partir do path SVG **canônico** de `dev/pro_studio/src/renderer.js` (`shapeSvg`, case `"casinha"`: `bw=s*0.84, ew=s*1.46, ey=cy-s*0.34, bh=cy+s*0.98, ap=cy-s*1.12`) em vez de reconstruir a partir da descrição em texto — mais preciso. Converti de SVG (eixo Y pra baixo) pra PostScript/LilyPond (eixo Y pra cima, invertendo o sinal dos deslocamentos) e escalei (s≈0,49) pra manter o tamanho geral parecido com a casinha antiga e com as outras 6 formas do motor. Corpo agora é um retângulo reto (sem afunilamento), telhado nitidamente mais baixo que a parede (proporção 0,38/0,65 ≈ igual ao path original 0,78/1,32), beiral 1,76× a parede (path original: 1,74×) — abas evidentes.

**Validação:** compilação completa (todos os 7 graus juntos) sem erro; comparação visual antes/depois com zoom (`sips`, crop+upscale) enviada e aprovada pelo Guiga — casinha nova lê claramente como casa com beiral, diferente do pentágono arredondado de antes. Backup: `backups_studio/cromus_header_2026-08-03.ily`. Afeta TODAS as cantigas que usam grau 7 (Si) em qualquer modo (REAL/FORMA/REAL_NOTA/STAFFLESS/TAB) — as 5 cantigas já prontas em `output/` (A Dona Aranha, Caranguejo, O Cravo, O Pião, Peixe Vivo) precisam ser recompiladas se algum PDF já publicado tiver nota Si e precisar refletir a forma nova.
