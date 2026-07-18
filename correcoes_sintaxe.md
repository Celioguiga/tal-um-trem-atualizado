
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
