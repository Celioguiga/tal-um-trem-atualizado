# 📕 Bíblia Cromus — Fonte da Verdade Absoluta

> **Documento-fonte da verdade do sistema Cromus / Synemusic.**
> Qualquer trabalho com Sintaxe Cromus, regras ou formas DEVE consultar este arquivo PRIMEIRO.
> Hierarquia de verdade: este arquivo > código > memória.

---

## 0. ARQUITETURA DO SISTEMA

### Arquivos e localização (todos na HOME: `~/`)
| Arquivo | Papel |
|---------|-------|
| `cromus_studio.py` | Servidor/interface web (porta 4242). Contém o conversor Sintaxe→LilyPond. |
| `pipeline.py` | Motor canônico. Gera o `.ly` final a partir do dicionário `cantiga`. |
| `cromus_header.ily` | Stencils coloridos RNFG (formas + cores). Incluído via `\include`. |
| `biblia_cromus.md` | Este arquivo — fonte da verdade. |
| `CLAUDE.md` | Instruções operacionais para o Claude Code. |

### Outros produtos do ecossistema (fora do `cromus_studio.py`, achados/registrados 2026-07-30)
> A Bíblia historicamente só documentava o `cromus_studio.py`. Isso ficou incompleto — hoje existem
> pelo menos mais dois produtos independentes consumindo a mesma Sintaxe Cromus / mapeamento RNFG,
> nenhum deles com fonte de dados realmente compartilhada entre si. Ver seção 9.

| Produto | Localização | Papel |
|---|---|---|
| **Pro Studio** (Real Tablatura) | `~/dev/pro_studio/` | App JS client-side (VexFlow/Bravura) — pauta + tablatura de violão, playback, repetições, ritmo completo. `src/core.js`/`src/rng_tab_module.js` têm cópia própria do mapeamento RNFG, independente do item abaixo. |
| **Braço RNFG** | `braco_rnfg_v5.2.html` (localização exata não confirmada) | Origem canônica citada pelo `rng_mapper_shared.js` — não investigado ainda. |
| `rng_mapper_shared.js` | `~/Downloads/` e `~/Documents/Ecossitema Synemusic/Real Tablatura /` (duas cópias, já divergentes, nenhuma dentro de um projeto versionado) | Pretende ser o mapeador compartilhado entre Pro Studio e Braço RNFG — **não está de fato conectado ao build do Pro Studio**. |

### Backups de segurança (NÃO apagar)
- `cromus_studio_v211_FUNCIONANDO.py` — estado estável v2.1
- `cromus_studio_antes_quialteras.py`
- `cromus_studio_antes_duracao.py`

### Como rodar o servidor (zsh)
```bash
pkill -f cromus_studio; python3 ~/cromus_studio.py &
```
Acessar no navegador: `localhost:4242`

---

## 1. CONTRATO DO PIPELINE (`pipeline.py`)

### Função principal
```python
def gerar_ly(cantiga: dict, saida_ly: str, modo: str = "REAL") -> None
```
- `cantiga` = dicionário (NÃO string)
- `saida_ly` = caminho do arquivo .ly de saída
- `modo` = "REAL" (cores) ou "FORMA" (preto)

### Dois caminhos de geração
1. **Modo `notas_ly_raw`** (USADO PELO STUDIO): o dicionário tem a chave `notas_ly_raw` com LilyPond pronto. Pula o `_converter_notas` interno. **É o caminho correto para quiálteras e durações por contexto.**
2. Modo `vozes`: o dicionário tem `vozes[0]["notas"]` em formato simplificado. Limitado, NÃO suporta quiálteras.

### Dicionário cantiga (modo raw — usar este)
```python
cantiga = {
    "titulo": titulo,
    "compositor": "Synemusic",
    "compasso": compasso,            # ex "2/4"
    "tonalidade": "c \\major",
    "andamento": 80,
    "compassos_por_linha": 4,
    "notas_ly_raw": notas_raw,       # bloco LilyPond completo
}
```

### Mapeamentos internos do pipeline (NÃO confundir com os do studio)
```python
_PITCH = {1:"c'", 2:"d'", 3:"e'", 4:"f'", 5:"g'", 6:"a'", 7:"b'"}
_DUR   = {"m":("2",2.0), "s":("4",1.0), "c":("8",0.5)}   # m=mínima s=semínima c=colcheia
```
⚠️ O `_DUR` do pipeline usa **m/s/c**, diferente da Sintaxe Cromus (w/h/q/e/s/t).
Por isso o studio gera `notas_ly_raw` direto e NÃO usa o `_converter_notas`.

---

## 2. SINTAXE CROMUS — MODELO DE DURAÇÕES POR CONTEXTO

> **Esta é a regra central do sistema. Validada e implementada em jun/2026.**

### Princípios fundamentais
1. **A VÍRGULA separa TEMPOS** (não compassos). Em 4/4 → 4 grupos por vírgula.
2. **Dentro de um tempo, as notas dividem o espaço** conforme o número de parcelas.
3. **ESPAÇO** separa notas de IGUAL valor: `5 5` = 2 colcheias iguais.
4. **ASTERISCO `*`** marca parcelas, usado quando há pausas ou valores DIFERENTES.
   - O número de asteriscos após uma nota = quantas parcelas ela ocupa.
   - A soma de todas as parcelas no tempo = total da grade.

### Tabela de notas (grau → pitch)
| Grau | Nota | Pitch LilyPond |
|------|------|----------------|
| 1 | Dó | `c'` |
| 2 | Ré | `d'` |
| 3 | Mi | `e'` |
| 4 | Fá | `f'` |
| 5 | Sol | `g'` |
| 6 | Lá | `a'` |
| 7 | Si | `b'` |
| 0 ou - | Pausa | `r` |

### Modificadores
| Símbolo | Posição | Significado | Exemplo |
|---------|---------|-------------|---------|
| `'` | à DIREITA | oitava ACIMA | `5'` → `g''` |
| `'` | à ESQUERDA | oitava ABAIXO | `'5` → `g` |
| `#` | após o grau | sustenido | `3#` → `eis'` |
| `b` | após o grau | bemol | `3b` → `ees'` |
| `-` | sozinho | pausa | `-` → `r` |
| `*` | após a nota | nº de parcelas que ocupa | `7**` = 2 parcelas |
| `.` | após a nota (antes de `~`/`+`, se houver) | ponto de aumento — nota dura 1,5× o tempo, estendendo pro tempo seguinte SEM dividir tempo com outra nota nesse trecho | `6.` = semínima pontuada (1 tempo + metade do próximo) |

### Notas que excedem 1 tempo — `~` (ligadura), `+` (soma de tempos inteiros) e `.` (ponto de aumento)
> `~`/`+` registrados em 2026-07-29 (Pro Studio). `.` registrado em 2026-08-05 —
> correção do Guiga sobre uso indevido de `~` dentro do mesmo compasso. Ver seção 9,
> Histórico de Decisões.

O modelo R7 (parcelas) só descreve o que acontece **dentro** de 1 tempo. Pra uma nota
durar mais que 1 tempo (mínima, mínima pontuada, semibreve, semínima pontuada, ou
qualquer ligadura de expressão), existem três símbolos, com escopos que NÃO se
sobrepõem:

| Símbolo | Escopo | Posição | Significado | Exige mesma altura na próxima nota? | Resultado |
|---------|--------|---------|-------------|--------------------------------------|-----------|
| `~` | **SOMENTE atravessando compasso** (nunca dentro do mesmo compasso — correção 2026-08-05) | após a nota/pausa | Ligadura de prolongamento — liga a última nota de um compasso à primeira do próximo. | Se a próxima nota for de altura diferente, `~` não quebra — vira ligadura de expressão (slur), mantendo as duas notas com ataque próprio. | Mantém 2+ eventos separados, ligados por um arco visual. Duração soma pro áudio, mas a pauta desenha 2 cabeças de nota. |
| `+` | dentro do mesmo compasso, nota **sozinha** em TODOS os tempos que ocupa (sem dividir nenhum deles com outra nota) | após uma nota/pausa que ocupa **1 tempo inteiro, sem subdivisão** (sem `*`/`.`) | Soma de tempos inteiros — forma direta de escrever mínima/semibreve como 1 figura só. Encadeável (`1+,1+,1` = mínima pontuada). | **Sim, obrigatório** — próxima nota (ou pausa) tem que ser a MESMA altura (ou também pausa). Se não for, ou se a nota estiver subdividida, `+` é **ignorado com aviso**, sem fundir nada. | **Colapsa em 1 evento só** — 1 cabeça de nota tradicional (mínima = cabeça aberta + haste; semibreve = cabeça aberta sem haste nenhuma), sem arco. **Implementado e verificado no render (`cromus_studio.py`, 2026-08-06)** — `_resolver_extensoes` colapsa cadeias de 2/3/4 grupos numa nota LilyPond só (`c'2`/`c'2.`/`c'1`); antes disso renderizava como semínimas ligadas por arco, não como a Bíblia promete. |
| `.` | dentro do mesmo compasso, nota dura 1,5× o tempo (1 tempo inteiro + metade do seguinte), podendo o RESTO do tempo seguinte ser ocupado por outra nota | após a nota, antes de `~`/`+` se houver | Ponto de aumento tradicional — 1 evento só, sem cortar nem ligar. O tempo seguinte é computado só com o que sobra (a grade R7 não exige que a soma feche o tempo inteiro). | Não aplicável — é 1 nota só, não uma cadeia. | **1 evento só**, cabeça de nota com ponto (notação tradicional). **Implementado e verificado no render (`cromus_studio.py`, 2026-08-06)** — `_parse_nota` reconhece o ponto solto, `_converter_tempo` aplica o multiplicador na fração, e `_resolver_extensoes` reduz o orçamento do próximo grupo em meio tempo. Testado de ponta a ponta contra a Aurora (PDF real, `a'4.` etc. aparecendo corretos). |
| `2` tempos (`1+,1`) | — | — | Mínima | — | `code:"h", dots:0` |
| `3` tempos (`1+,1+,1`) | — | — | Mínima pontuada | — | `code:"h", dots:1` |
| `4` tempos (`1+,1+,1+,1`) | — | — | Semibreve | — | `code:"w", dots:0` |
| Qualquer outra soma (5, 6, 7...) via `+` | — | — | Sem figura tradicional única | — | **Erro/aviso** — nada é fundido. Se for exatamente 1,5 tempo, usar `.` em vez de `+`. Decomposição automática de outras somas fica fora de escopo por ora. |

Funciona igual em pausa (`-+,-` = pausa de mínima) — mesma exigência de "mesmo tipo"
(pausa só liga com pausa). `.` em pausa (`-.`) seria pausa pontuada — não testado ainda
contra caso real.

**O que fica SEM notação por ora** (nem `+`, nem `.`, nem `~` dentro do compasso
cobrem): nota que cruza fronteira de tempo sem alinhar em 2/3/4 tempos inteiros E sem
ser exatamente 1,5 tempo (ex.: quiáltera irregular abrangendo o compasso inteiro, achado
real em `03_choro_03.musicxml` compasso 36). R1: registra e descarta, não inventa —
motivo de ter existido um "corte-em-~" genérico nessas situações por um tempo curto
(2026-08-05, revertido na mesma sessão pela correção do Guiga acima).

### Quiálteras
- **Detecção automática:** quando o total de parcelas no tempo NÃO é potência de 2 (3, 5, 6, 7, 9), vira quiáltera.
- **Exceção em compasso composto (6/8, 9/8, 12/8; registrado 2026-07-30, Pro Studio):** o tempo composto já se divide naturalmente em 3 — a referência de "potência de 2" passa a ser `3×potência-de-2` (3, 6, 12, 24), não a série binária pura. Ou seja, 3 (ou 6) notas dividindo igualmente 1 tempo composto é divisão NORMAL (3 colcheias simples, sem marca de tercina); só o que foge dessa base (ex.: 2 notas no lugar de 3 — uma duína) vira quiáltera de verdade.
- **Explícita por parênteses:**
  - `(3 4 5)` → quiáltera de 1 tempo
  - `((3 4 5))` → quiáltera ocupando o COMPASSO inteiro
- Frações: 3→`3/2`, 5→`5/4`, 6→`6/4`, 7→`7/4`, 9→`9/8`

---

## 3. DICIONÁRIO DE CONVERSÃO (entrada → LilyPond) — VALIDADO

> Todos os exemplos abaixo passaram nos testes (9/9). Compasso de referência: cada vírgula = 1 tempo de semínima.

| Sintaxe Cromus | LilyPond | Leitura |
|----------------|----------|---------|
| `5` | `g'4` | Sol semínima (1 nota = tempo inteiro) |
| `5 5` | `g'8 g'8` | 2 colcheias iguais |
| `5 5 5` | `\tuplet 3/2 { g'8 g'8 g'8 }` | tercina de colcheias |
| `5 5 5 5` | `g'16 g'16 g'16 g'16` | 4 semicolcheias iguais |
| `5**5*5*` | `g'8 g'16 g'16` | colcheia + 2 semicolcheias (grade 4: 2+1+1) |
| `-*-*5*5*` | `r16 r16 g'16 g'16` | pausa, pausa, sol, sol (4 semicolcheias) |
| `7**6*` | `\tuplet 3/2 { b'4 a'8 }` | tercina: Si vale 2/3, Lá vale 1/3 |
| `1'` | `c''4` | Dó oitava acima |
| `'5` | `g4` | Sol oitava abaixo |
| `3#` | `eis'4` | Mi sustenido |
| `3b` | `ees'4` | Mi bemol |
| `-` | `r4` | pausa de semínima |
| `(3 4 5)` | `\tuplet 3/2 { e'8 f'8 g'8 }` | tercina explícita |
| `((1 2 3 4 5))` | `\tuplet 5/4 { ... }` | quintina no compasso inteiro |

### Como o conversor calcula (algoritmo)
1. Divide a sintaxe por vírgulas → cada pedaço é 1 TEMPO.
2. Dentro do tempo:
   - Se tem `*`: cada nota leva seus asteriscos = suas parcelas.
   - Se tem só espaço: cada nota = 1 parcela.
3. `total = soma das parcelas`.
4. Se `total` é potência de 2 (1,2,4,8,16,32) → durações normais.
5. Se não → quiáltera com fração `_TUPLET_FRAC[total]`.
6. Cada nota dura `(parcelas / total) × tempo`.

---

## 4. MAPEAMENTO RNFG — CORES E FORMAS CANÔNICAS

> ⚠️ NUNCA alterar estes valores. Toda cor/forma deriva do mapeador canônico — nunca hardcoded.
> **Nota de proveniência (2026-07-30):** existe um `rng_mapper_shared.js` (origem: `braco_rnfg_v5.2.html`,
> 15/07/2026) pensado como fonte única entre Pro Studio e Braço RNFG — mas ele **não está conectado**
> ao build do Pro Studio hoje (`build.py` não o referencia; `core.js`/`rng_tab_module.js` têm cópias
> próprias e independentes). Duas cópias soltas do arquivo (`~/Downloads/` e `~/Documents/Ecossitema
> Synemusic/Real Tablatura /`) já divergiram entre si. Ver seção 9 — reconciliação pendente, decisão
> de arquitetura ainda em aberto.

| Grau | Nota | Cor HEX | Forma |
|------|------|---------|-------|
| 1 | Dó | `#C0001A` | Círculo |
| 2 | Ré | `#ECD200` | Ogiva/elipse (escala horizontal 0.75) |
| 3 | Mi | `#F07300` | Triângulo (ponta cima) |
| 4 | Fá | `#00B050` | Quadrado |
| 5 | Sol | `#0066FF` | Estrela |
| 6 | Lá | `#8B5E00` | Hexágono |
| 7 | Si | `#9B5FC0` | Casa (pentágono) |

### Geometria exata (path SVG, referência = raio `s`, centro `cx,cy`)
> Validada contra `renderer.js` do Pro Studio (`shapeSvg`) em 2026-07-30 — código e Bíblia batem
> path por path, isso só formaliza por escrito o que já está implementado.

| Grau | Forma | Especificação |
|---|---|---|
| 1 | Círculo | `r = 0.98s` |
| 2 | **Ogiva dupla, deitada** | Dois arcos com **pontas agudas nas laterais** (não é elipse). `M cx-w,cy Q cx,cy-2h cx+w,cy Q cx,cy+2h cx-w,cy Z`, com `w=1.38s`, `h=0.95s`. Mais larga que alta. |
| 3 | Triângulo | Ponta pra cima. |
| 4 | Quadrado | `s=0.86 do raio de referência`. |
| 5 | Estrela | 5 pontas, raio externo `1.26s`, interno `0.44s`. |
| 6 | **Hexágono deitado** | Vértices nas **laterais**, faces retas em cima/embaixo (não em pé). Vértices `(±w,cy)` e `(±w/2,±h)`, com `w=1.38s`, `h=0.92s` — **mesma dimensão da ogiva**. |
| 7 | **Casinha com beiral** | Telhado **ultrapassa as paredes** (abas evidentes), telhado baixo, corpo largo. Paredes `±0.84s`; beiral `±1.46s` na linha `cy-0.34s`; cumeeira `cy-1.12s`; base `cy+0.98s`. |

Contorno em todas as formas: `rgba(0,0,0,.32)`, 0.8px.

---

## 5. REGRAS VISUAIS (aplicar em TODAS as cantigas)
- `global-staff-size`: 32
- `ragged-last`: `##t`
- 4 compassos por sistema (`\break` após cada 4)
- Último compasso: tamanho normal, não esticar
- Barra final: `\bar "|."`
- Ogiva do Ré (Grau II): escala horizontal 0.75
- **Clave (decisão 2026-07-08):** mudar de clave NÃO transpõe a música. A FORMA é fixa por grau e o engraver a deriva da ALTURA REAL da nota; portanto Dó é sempre círculo (vermelho), Lá sempre hexágono, etc., em qualquer clave. Trocar a clave apenas muda o símbolo/posição no pentagrama (LilyPond reposiciona as mesmas alturas). Nunca reescrever os graus em função da clave.

---

## 6. REPETIÇÕES E ESTRUTURA
| Cromus | LilyPond |
|--------|----------|
| `\|\|:` | `\repeat volta 2 {` |
| `:\|\|` | `}` |
| `(CASA 1)` | primeira chave de `\alternative { { ... }` |
| `(CASA 2)` | segunda chave de `\alternative { ... { ... } }` |
| `FIM` | `\bar "\|."` no último compasso |

### Navegação segno/coda (2026-08-05 — ver seção 9)
| Cromus | Significado | LilyPond (IMPLEMENTADO, `cromus_studio.py`) |
|--------|-------------|----------|
| `SEGNO` | marca o sinal 𝄋 (prefixo, igual `\|\|:`) | `\mark \markup { \musicglyph #"scripts.segno" }` |
| `CODA` | marca um sinal 𝄌 — aparece 2×: ponto de saída e ponto de chegada; a ORDEM no texto desambigua (prefixo) | `\mark \markup { \musicglyph #"scripts.coda" }` |
| `D.S. AL CODA` | volta pro `SEGNO`; ao reencontrar o 1º `CODA`, pula pro 2º `CODA` (sufixo, igual `:\|\|`) | `\mark \markup { \bold "D.S. al Coda" }` |
| `D.C. AL CODA` | mesma coisa, mas volta pro INÍCIO da peça, não pro `SEGNO` (sufixo) | `\mark \markup { \bold "D.C. al Coda" }` — mapeamento não testado contra peça real ainda |
| `D.C. AL FINE` | volta pro início, toca até achar `FINE` (sufixo) | `\mark \markup { \bold "D.C. al Fine" }` — não testado ainda |
| `D.S. AL FINE` | volta pro `SEGNO`, toca até achar `FINE` (sufixo) | `\mark \markup { \bold "D.S. al Fine" }` — não testado ainda |
| `FINE` | ponto de parada de um D.C./D.S. al Fine — diferente de `FIM` (fim FÍSICO da partitura escrita) (prefixo) | `\mark \markup { \bold "Fine" }` — não testado ainda |

**Implementado em `cromus_studio.py` (`_sintaxe_para_ly_raw`, 2026-08-05) como marca decorativa** —
`\mark \markup {...}` solto, igual ao mecanismo antigo (ver entrada retroativa abaixo), só
que com texto/glifo PRÓPRIO por token em vez de substring solta genérica. Testado de
verdade renderizando "Aurora" via `/render` + inspeção visual do PDF: SEGNO, 1º CODA e
D.S. AL CODA saem corretos e nos lugares certos. **Achado real, não resolvido**: quando
um marcador de INSTRUÇÃO (`D.S. AL CODA`) cai imediatamente antes de um marcador de
POSIÇÃO (`CODA`) sem nenhuma nota entre os dois, o motor de marcação do LilyPond só
aceita 1 `\mark` por instante musical — o segundo é descartado silenciosamente
(`discarding event: ad-hoc-mark-event`), e pode deixar um aviso residual
`already have a VoltaBracket`. Na Aurora isso derrubou o 2º sinal de CODA (ponto de
chegada da seção). Fica registrado como pendência — não investigado a fundo ainda.

**NÃO implementado (pesquisado e verificado por compilação real, mas fora de escopo por
decisão do Guiga — mudança estrutural maior, mais arriscada):** `\repeat segno` nativo
do LilyPond 2.26.0, que gera os símbolos/texto AUTOMATICAMENTE a partir de UMA
estrutura (sem `\mark` manual, sem risco de colisão de marcas simultâneas):
```lilypond
\repeat segno 2 {
  <corpo entre o SEGNO e o D.S.>
  \alternative {
    \volta 1 { <só na 1ª passada> }
    \volta 2 { <só na 2ª passada, terminando aqui> \fine }
  }
}
\sectionLabel "Coda"
<material da coda>
```
Confirmado rodando `lilypond` de verdade contra um `.ly` de teste isolado (não por
memória/documentação genérica) — provavelmente resolveria o achado de colisão de marcas
acima, já que não depende de `\mark` manual pro caso comum. Candidato natural pra quando
justificar o retrabalho estrutural.

---

## 7. REGRAS OPERACIONAIS PARA O CLAUDE CODE

### Antes de QUALQUER edição
1. Ler este `biblia_cromus.md` (fonte da verdade).
2. Fazer backup ANTES de editar: `cp ~/cromus_studio.py ~/cromus_studio_bak_$(date +%s).py`
3. Usar `str_replace` em blocos PEQUENOS — NUNCA reescrever o arquivo inteiro (estoura o limite de 32k tokens e corrompe o arquivo).
4. Alterar APENAS o que foi explicitamente pedido.
5. Após editar, validar: `python3 -c "import ast; ast.parse(open('/Users/celiopereira_synemusic/cromus_studio.py').read()); print('OK')"`
6. Reiniciar: `pkill -f cromus_studio; python3 ~/cromus_studio.py &`

### NUNCA fazer
- ❌ Reescrever cromus_studio.py inteiro de uma vez (já corrompeu o arquivo uma vez)
- ❌ Modificar cores/formas RNFG sem autorização explícita
- ❌ Modificar notas, breaks ou parâmetros não mencionados
- ❌ Reiniciar o servidor sem antes matar o processo (`pkill -f cromus_studio`)

### Histórico de erros resolvidos (não repetir)
| Erro | Causa | Solução |
|------|-------|---------|
| `gerar_ly() missing argument 'saida_ly'` | adaptador chamava com assinatura errada | usar dict `cantiga` + `saida_ly` temp |
| `invalid literal for int(): ''` | `_converter_notas` esperava formato grau+dur colado | gerar `notas_ly_raw` direto |
| `\| 'q'` (KeyError) | durações w/h/q/e do studio ≠ m/s/c do pipeline | mapear via `notas_ly_raw` |
| Arquivo reduzido a 104 linhas | Claude Code reescreveu o arquivo inteiro e estourou 32k tokens | usar str_replace pequenos; restaurar do backup |
| Painel some / layout quebra | regra CSS `.spanel.open` duplicada conflitando | remover regra antiga `transform:translateX` |
| Grau 1 (Dó) vira hexágono (Lá) ao mudar de clave | `_transpor_sintaxe_para_clef` transpunha os graus "para manter posição visual", mudando a altura real e, com ela, a FORMA (derivada da altura pelo engraver) | mudar de clave é NO-OP na música: só troca o glifo da clave (`_gerar_clef_override`), preservando alturas e formas. 2026-07-08 |

---

## 8. CANTIGA 01 — A Dona Aranha (REFERÊNCIA — notação legada)

> ⚠️ Esta cantiga usa a notação ANTIGA (dígitos colados `12`).
> No padrão ATUAL, notas no mesmo tempo separam-se por ESPAÇO: `1 2`.
> Mantida aqui como referência histórica e teste de regressão.

### Sintaxe Cromus original (notação legada)
```
|1, 12| 3, 33| 21, 23| 1, 1|
|11, 12| 3, 3| 21, 23| 1, -|
|66, 66| 5, 31| 66, 66| 5, 3|
||: 11, 12| 3, 33| 21, 23|
(CASA 1) 1 :||
(CASA 2) 1, 1| 11, 12| 3, 33| 21, 23| 1, - || FIM
```

### notas_ly_raw VALIDADO (fonte da verdade absoluta desta cantiga)
```
  \time 2/4
  \tempo 4 = 96
  \key c \major

  c'4 c'8 d'8
  e'4 e'8 e'8
  d'8 c'8 d'8 e'8
  c'4 c'4
  \break
  c'8 c'8 c'8 d'8
  e'4 e'4
  d'8 c'8 d'8 e'8
  c'4 r4
  \break
  a'8 a'8 a'8 a'8
  g'4 e'8 c'8
  a'8 a'8 a'8 a'8
  g'4 e'4
  \break
  \repeat volta 2 {
    c'8 c'8 c'8 d'8
    e'4 e'8 e'8
    d'8 c'8 d'8 e'8
  }
  \alternative {
    { c'4 r4 }
    {
      c'4 c'4
      c'8 c'8 c'8 d'8
      e'4 e'8 e'8
      d'8 c'8 d'8 e'8
      c'4 r4 \bar "|."
    }
  }
```

### Instruções para o Claude Code (cantigas)
1. Leia este arquivo antes de editar qualquer cantiga.
2. Confira a tabela/notas_ly_raw como fonte da verdade absoluta.
3. Altere APENAS o que foi explicitamente solicitado.
4. Nunca modifique notas, breaks ou parâmetros não mencionados.
5. Após compilar, confirme que o PDF bate com a referência.

---

## 9. HISTÓRICO DE DECISÕES

> Seção criada em 2026-07-29 (não existia antes — o CLAUDE.md já referenciava ela como
> destino de registro obrigatório de mudança de regra, "Regra de Ouro 6", mas a seção
> em si nunca tinha sido escrita). A partir daqui, toda mudança de regra de sintaxe
> precisa de uma entrada aqui antes de valer.

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-07-08 | Mudar de clave é NO-OP musical — só troca o glifo da clave, nunca transpõe grau/altura/forma. | Bug estrutural: grau 1 (Dó) virava hexágono (forma de Lá) ao trocar de clave, porque a transposição mudava a altura real por baixo do pano. Forma é derivada da altura real, não da posição visual na pauta. |
| 2026-07-29 | Pro Studio (JS, `~/dev/pro_studio/`): tablatura de violão ("Real Tablatura") passa a ter highlight de playback sincronizado com a pauta, oitava corrigida (busca por MIDI exato, não só classe de altura), transposição de -12 semitons (violão soa 1 oitava abaixo do escrito), ligadura de prolongamento, símbolos de repetição/casa, e ritmo (haste/colchete/beam) — tudo espelhando o que a pauta (VexFlow) já fazia, mas desenhado à mão em SVG. | A tablatura vinha sendo tratada como acessório visual simples; virou um segundo sistema de notação que precisa de paridade com a pauta pra não passar impressão de ferramenta incompleta. |
| 2026-07-29 | `~` (ligadura de prolongamento) formalizado como o símbolo do caso geral — já estava implementado no Pro Studio, mas nunca tinha sido escrito na Bíblia (o CLAUDE.md, seção 5, chegou a documentar `+` como ligadura em algum momento anterior — nunca refletido aqui nem no código; considerar essa menção obsoleta). | Uso mais comum: ligar 2 notas de mesma altura atravessando barra de compasso (ex.: última semínima de um compasso ligada à 1ª do próximo). Mantém 2 eventos separados (arco visual), permite altura diferente (vira slur). |
| 2026-07-29 | `+` introduzido como símbolo dedicado pra somar tempos inteiros iguais (mínima, mínima pontuada, semibreve), diferente de `~`: colapsa em 1 evento só, produzindo a figura tradicional de verdade (cabeça aberta, haste certa — semibreve sem haste nenhuma) em vez de 2 semínimas ligadas por arco. Exige mesma altura (trava com erro/aviso se não bater) e nota "sozinha no tempo" (sem `*`/`.`). Soma que não bate com mínima/mínima-pontuada/semibreve (2/3/4 tempos) é erro — sem decomposição automática por ora. | Notação Cromus não tinha NENHUMA forma de escrever mínima/semibreve — furo real, o motor não conseguia representar durações básicas de partitura tradicional. Decomposição automática de somas não-padrão (5, 6, 7 tempos) fica como trabalho futuro, só se aparecer de verdade no repertório. |
| 2026-07-29 | Pausas passam a ser visíveis na tablatura (antes eram 100% invisíveis) — símbolo neutro numa linha central fixa do bloco de 6 cordas, com haste/colchete próprios (nunca em beam entre si, igual a pauta nunca beameia sobre pausa), reaproveitando o mesmo sistema de ritmo das notas. | Ritmo é acromático (regra de ouro já existente) — pausa não tem grau/corda, mas precisa comunicar sua própria duração visualmente, senão o silêncio simplesmente some da leitura da tablatura. |
| 2026-08-03 | Em compasso composto (6/8, 9/8, 12/8...), 1 tempo = semínima pontuada, e 3 (ou 6, 12, 24...) notas iguais dividindo naturalmente 1 tempo NÃO são quiáltera — são subdivisão reta. A quiáltera automática só entra fora dessa série (3 × potência de 2 quando composto, em vez da série binária pura). | Bug trazido do Pro Studio (ciclo 30/07): `cromus_studio.py` sempre tratava 1 tempo como semínima simples e comparava só contra potências de 2, então 3 colcheias retas em 6/8 saíam com tercina forçada. Corrigido em `_eh_tuplet_total`/`_converter_tempo`; vale para Studio (4242) e Note Form Pro (5173), mesmo backend. |
| 2026-08-03 | Polifonia/vozes simultâneas: `@voz2:`, `@voz3:`, `@voz4:` marcam vozes extras completas e independentes dentro do mesmo texto Cromus (sintaxe R7 normal em cada uma), soando junto com a voz principal (sem marcador). Máximo 4 vozes. Genérico (`@vozN:`), não amarrado a corda de violão (`@cordaN:`) — vale pra pauta comum (REAL/FORMA/REAL_NOTA/STAFFLESS); modo TAB fica de fora por ora. Direção de haste é a nativa do LilyPond por voz (`\voiceOne`/`\voiceThree`=cima, `\voiceTwo`/`\voiceFour`=baixo), não uma regra por altura real. | Cromus nunca teve nenhuma forma de escrever notas soando ao mesmo tempo (só sequencial/arpejado) — furo real pra harmonização, acompanhamento, 2 vozes cantando junto. Inspirado no `@cordaN:` do Pro Studio (30/07), mas generalizado porque o motor principal do livro de cantigas (`cromus_studio.py`) renderiza pauta comum, não tablatura. |
| 2026-08-03 | Geometria da casinha (grau 7/Si) em `cromus_header.ily` corrigida pra bater com a spec da seção 3 (validada contra `renderer.js`/`shapeSvg` do Pro Studio): corpo retangular reto, telhado baixo, beiral ~1,74× a largura da parede (abas evidentes). Aprovado visualmente pelo Guiga em comparação antes/depois. | `cromus_header.ily` (o motor que desenha de verdade) tinha ficado pra trás depois que a geometria foi fechada só no Pro Studio/Bíblia em 30/07 — a casinha renderizada saía como um pentágono arredondado, sem o beiral evidente que a Bíblia já descrevia. Afeta qualquer cantiga com grau 7 renderizada a partir de agora. |
| — | Pendente: reconciliar esse modelo (`~`/`+`) com `cromus_studio.py`/`pipeline.py` — que têm seu próprio histórico de sufixos de duração por letra (`w/h/q/e/s/t/i` em `cromus_studio.py`, `m/s/c` em `pipeline.py`, nenhum deles idêntico ao que está documentado aqui). Investigação e decisão de reconciliação adiadas para sessão futura. | Bíblia é fonte de verdade única pros dois motores (Cromus Studio Python e Pro Studio JS) — deixar os dois sistemas com semânticas de duração divergentes é o tipo de furo que gerou essa própria sessão de trabalho. |
| 2026-07-30 | Pro Studio: `unfoldRepeats()` (já existia em `core.js`, nunca era chamada) conectada ao playback — `schedule()` agora toca a ordem executada de verdade (corpo repete, casa da passada errada é pulada), não só a gravura. | P4 do handoff — pauta/tab já desenhavam `\|\|: :\|\|`/casas corretos, mas o áudio ignorava e tocava tudo linear. |
| 2026-07-30 | Registrado (não resolvido): `rng_mapper_shared.js` existe pretendendo ser fonte única entre Pro Studio e um terceiro produto (`braco_rnfg_v5.2.html`, "Braço RNFG", nunca antes documentado aqui) — mas não está conectado ao build do Pro Studio, e suas duas cópias soltas já divergiram entre si. Ver seção 0. | Achado investigando P2 (sincronizar fontes de verdade) — decisão de arquitetura (unificar de verdade, ou formalizar que cada produto mantém cópia própria) ainda pendente, não decidi sozinho. |
| 2026-07-30 | Pro Studio passa a suportar compasso composto (6/8, 9/8, 12/8) como propriedade da peça inteira. Decisão musical central: em composto, **1 tempo R7 (1 vírgula) = o tempo composto inteiro** (semínima pontuada — 6/8 sente-se em 2, não em 6), igual à leitura tradicional. Consequência prática: 6 colcheias simples em 6/8 se escrevem com 2 vírgulas, cada uma agrupando 3 notas por espaço — mesma mecânica que já existia pra colcheias dentro de 1 tempo simples, sem sintaxe nova. Contagem de tempos esperados por compasso passa a ser `numerador/3` em composto (6/8→2, 9/8→3, 12/8→4) em vez do numerador bruto. | P5 do handoff — suportar compasso composto é condição mínima de competência de mercado pro Ecossistema Synemusic, mesmo sem nenhuma cantiga do repertório atual usando isso ainda. Troca de compasso no meio da obra (multi-metria) fica para uma rodada futura; sintaxe `[6/8]` reservada (colchetes não colidem com nada hoje) mas não implementada. |
| 2026-07-30 | Corrigido durante a validação do item acima: a detecção automática de quiáltera (seção 2, "Quiálteras") comparava sempre contra a série binária (1,2,4,8,16...), o que fazia 3 notas dividindo naturalmente 1 tempo composto (divisão ternária nativa) serem incorretamente marcadas como tercina. A detecção agora usa como referência `3×potência-de-2` (3,6,12,24) quando o compasso é composto, e a série binária normal quando é simples — só o que foge dessa base natural (ex.: 2 notas no lugar de 3 = duína) continua virando quiáltera de verdade. | Bug pego em teste programático antes de qualquer uso real — sem essa correção, toda cantiga em compasso composto teria colcheias simples desenhadas como colcheias pontuadas erradas. |
| 2026-07-30 | Registrado retroativamente: Pro Studio ganhou auto-scroll durante o playback (`acompanharScroll` em `app.js`) na mesma sessão do P4/P3, mas nunca tinha sido escrito aqui — o roadmap de acompanhamento externo seguiu tratando o item como "não iniciado" por falta de registro. Não é um segundo modo de layout (a partitura continua quebrada em múltiplos sistemas); o contêiner rolável (`#score`) passa a seguir o índice da nota tocando agora (mesmo índice do halo), rolando só quando a linha atual ou a posição X da nota saem da área visível — "modo página", não nota a nota. Desliga sozinho se o usuário rolar manualmente, religa a cada novo playback. | Trabalho já feito, só não documentado — o gap de registro é o mesmo tipo de furo que motivou criar esta seção 9: decisão real de arquitetura que existia só no código, invisível pra qualquer rastreamento fora dele. |
| 2026-07-30 | Pro Studio ganha suporte a vozes/polifonia por corda (até 6, ritmos independentes de verdade — não só acorde pontual). Sintaxe: `@cordaN:` (N=1..6, **numeração de violonista** — 1=corda mais aguda, 6=mais grave) declara uma trilha extra completa dentro do MESMO texto Cromus, com sua própria sintaxe R7 independente (vírgulas, pausas, ligaduras). A trilha SEM marcador continua sendo exatamente a sintaxe de sempre — retrocompatibilidade total, nenhuma cantiga existente muda. `\|\|:`/`(casa N)`/`fim` só valem na trilha principal; numa trilha `@cordaN:` viram aviso e são ignorados. Trilha principal é obrigatória (peça só com vozes marcadas fica fora de escopo). Direção de haste com 2+ vozes simultâneas: **não** é por corda fixa nem por papel fixo de voz — é por altura real a cada agrupamento simultâneo (a nota mais grave entre as vozes que soam juntas naquele tempo recebe haste pra baixo, as outras pra cima), mesma regra já fechada pra acordes numa sessão anterior. Posição na tablatura de trilha com corda declarada é DIRETA (fórmula, sem busca heurística) — só a trilha principal usa `posicionaMelodia`/CAGED. Colisão de corda entre trilhas no mesmo instante gera aviso, não bloqueia nem tenta evitar automaticamente. A tablatura recebeu a mesma regra de haste por altura real, mas só ENTRE trilhas simultâneas: quando 2+ vozes soam no mesmo tempo, a mais grave fica com haste pra baixo e as outras pra cima, sobrepondo a regra de corda de sempre (cordas 0-2 baixo/3-5 cima) só nesse caso; dentro de 1 trilha só (sem outra voz naquele tempo), a regra de corda continua decidindo sozinha, sem mudança. | Item mais caro e arriscado do roadmap do Pro Studio (mudança de linguagem, não feature nova) — Guiga pediu sessão de planejamento à parte antes de qualquer código. Decisão de sintaxe (retrocompatível + trilha extra opt-in por corda) escolhida entre 3 propostas justamente por não quebrar nenhuma cantiga existente e por simplificar o posicionamento na tab (declaração explícita em vez de heurística) em vez de complicar. |
| 2026-08-03 | Pro Studio ganha áudio realista (item 6 do roadmap): o sintetizador triangular (`Tone.PolySynth`) é trocado por `Tone.Sampler` com amostras reais de violão nylon, extraídas do SoundFont "MS Basic.sf3" do MuseScore (MIT — cadeia Frank Wen→Michael Cowgill→S. Christian Collins, créditos completos em `dev/pro_studio/CREDITS.md`, exigência da licença). 21 notas (MIDI 36-96, passo de 3 semitons) renderizadas via `fluidsynth`, cortadas/comprimidas via `ffmpeg` (mono, MP3), embutidas em base64 — `Tone.Sampler` interpola o resto do braço a partir delas. | Guiga escolheu o timbre nylon entre nylon/aço ouvindo as duas opções lado a lado; SoundFont escolhido (MS Basic sobre FluidR3_GM) especificamente por ter licença MIT clara pra uso comercial — FluidR3_GM tinha ambiguidade de licenciamento pra embutir num produto vendido. |
| 2026-08-05 | Navegação segno/coda (`SEGNO`, `CODA`, `D.S. AL CODA`, `D.C. AL CODA`, `D.C. AL FINE`, `D.S. AL FINE`, `FINE`) introduzida como sintaxe nova — ver seção 6. Cromus nunca teve nenhuma forma de representar essas instruções (busca por "segno"/"coda" na Bíblia não achava nada antes desta entrada). Escopo original desta rodada: só a REPRESENTAÇÃO em texto Cromus, implementada no `musicxml2cromus` (projeto isolado, `~/dev/musicxml2cromus/`) — detecção de `<segno/>`/`<coda/>`/`<words>` (D.S./D.C./Fine) no MusicXML de origem e emissão dos marcadores correspondentes. **Escopo ampliado ainda na mesma sessão — ver entrada seguinte.** | Achado real ao converter "Aurora" (Zequinha de Abreu, valsa, acervo Encore) via `musicxml2cromus`: a peça usa Segno + 2 Coda + "D.S. al Coda", que o conversor não reconhecia — os marcadores de repetição/casa (`\|\|:`/`(CASA N)`) ficavam mal aplicados, produzindo colchetes de repetição sobrepostos no PDF (LilyPond acusou `already have a VoltaBracket`). Padrão real e recorrente em choro/valsa/schottisch e formas populares afins — não é caso isolado da Aurora, por isso vira regra formal em vez de gambiarra pontual só pra essa peça. |
| 2026-08-05 | **Registrado retroativamente** (achado ao investigar por que a Aurora não renderizava certo mesmo com a sintaxe nova): `cromus_studio.py` (`_sintaxe_para_ly_raw`) já tinha um mecanismo PRÉ-EXISTENTE pra segno/coda/D.C./D.S., nunca documentado aqui — viola a própria Regra de Ouro 6 igual outros achados retroativos desta seção. Mecanismo antigo: `s.replace('D.C.', ...)`/`s.replace('D.S.', ...)` (substring solta em qualquer parte do texto, sem checar limite de palavra) → `\mark \markup { \musicglyph #"scripts.dacapo/segno" }`; `𝄌`/`𝄋` (CARACTERES UNICODE LITERAIS, não as palavras) → glifos de coda/segno. Puramente decorativo (marca visual solta, não estrutura repetição — sem `\repeat segno`, o músico lê e navega sozinho). Limitação real: `D.C.` sempre mostra o texto fixo "D.C. al Fine" (hardcoded, errado pra "D.C. al Coda"); `D.S.` só desenha o símbolo, sem NENHUM texto — não distingue "al Coda" de "al Fine" em nenhum dos dois casos. | Guiga, avisado do conflito entre esse mecanismo antigo e a sintaxe nova registrada na entrada acima, decidiu (2026-08-05) NÃO usar o atalho antigo pra Aurora — pediu pra atualizar `cromus_studio.py` de vez pra semântica completa (distinção al Coda/al Fine certa), em vez de aproximar com o mecanismo velho. Ver entrada seguinte pra decisão de implementação. |
| 2026-08-05 | **Implementado e testado de ponta a ponta** (mesma sessão): `cromus_studio.py` ganhou 7 entradas novas em `LILY_MARKS` (uma por token da sintaxe nova, cada uma com texto/glifo PRÓPRIO — a diferença central pedida) mantendo a filosofia decorativa existente (`\mark \markup {...}` solto, sem reestruturar pra `\repeat segno`). Regex específicos checados ANTES das substrings antigas soltas (`D.C.`/`D.S.`), pra "D.S. AL CODA" não perder um pedaço pro replace antigo. Junto, achado e corrigido um bug SEPARADO (não relacionado a segno/coda): `(volta "2")` nunca era limpo com `(volta #f)` depois que CASA2 terminava — só o `FIM` (fim de TODA a peça) fazia isso — então com 2+ seções de repetição independentes na mesma peça (a Aurora tem 3), a próxima `start-repeat` colidia com o estado pendurado da anterior. Fix: `@start_rep@` agora sempre inclui `(volta #f)` antes de `start-repeat` (no-op se já limpo). `musicxml2cromus` (`emitter.py`) também ganhou `_normalizar_repeticoes`: descarta `:||` sem `||:` aberto correspondente, e insere um `||:` IMPLÍCITO bem em cima de um `(CASA 1)` órfão (achado real: a Aurora tem 2 barras de repetição-pra-trás consecutivas no XML de origem sem abertura explícita nenhuma antes). Testado renderizando a Aurora de verdade via `/render` + inspeção visual do PDF (não só "compilou sem erro"): SEGNO, 1º CODA e D.S. AL CODA saem corretos. **Pendência real, não resolvida:** o 2º CODA (ponto de chegada) foi descartado silenciosamente pelo LilyPond por colidir com a marca "D.S. al Coda" no mesmo instante musical (ver seção 6, "Achado real, não resolvido") — ainda sobra 1 aviso `already have a VoltaBracket` no log, provavelmente ligado a essa mesma colisão. | Guiga pediu implementação completa, não só documentação — 58/58 testes em `musicxml2cromus`, backup de `cromus_studio.py` feito antes de editar (`~/backups_studio/cromus_studio_2026-08-05.py`), edições pequenas e sequenciais (Regra de Ouro 7), plano revisado e aprovado antes de tocar no arquivo protegido. |
| 2026-08-05 | **Correção do Guiga sobre `~`:** ligadura de prolongamento dentro do MESMO compasso estava sendo usada errado — o "corte-em-`~`" implementado mais cedo nesta sessão (pra resolver a semínima pontuada da Aurora dividindo tempo com outra nota) cortava a nota em pedaços e ligava com `~`, mas `~` deveria valer SÓ atravessando compasso (a Bíblia já dizia "tipicamente", a correção fecha isso pra "somente"). Substituído por `.` (ponto de aumento) — ver seção 6, tabela de modificadores e "Notas que excedem 1 tempo". `rhythm.py`/`processar_compasso` agora tenta, nessa ordem: (1) `+` (nota sozinha em tempos inteiros), (2) `.` (nota de 1,5 tempo, resto do tempo seguinte livre pra outra nota), (3) se nenhum dos dois servir, `RitmoNaoMapeavel`/`LigaduraComplexaNaoImplementada` de novo (volta a registrar-e-descartar em vez de adivinhar). `_dividir_e_anexar` (o corte-em-~ genérico) removida. | Guiga: "estas ligaduras deveriam ser utilizadas somente quando as notas têm duração que ultrapassa um compasso... deveríamos utilizar as figuras rítmicas de mínima, mínima pontuada [dentro do compasso]". Efeito colateral aceito conscientemente: a quiáltera de compasso inteiro (`03_choro_03.musicxml` compasso 36) que o corte-em-`~` resolvia de propósito volta a ficar sem mapear — R1 prioriza notação correta sobre taxa de cobertura. |
| 2026-08-06 | **`+`/`.` agora colapsam de verdade em 1 figura tradicional no render** (`cromus_studio.py`). Achado real: `1+,1` (mínima) renderizava como `"c'4~ c'4"` (2 semínimas LIGADAS por arco), não como `"c'2"` (1 cabeça de mínima de verdade) — não batia com a promessa da própria Bíblia ("colapsa em 1 evento só"). Mesma causa raiz do `.`: `_converter_tempo` processa cada grupo (separado por vírgula) de forma INDEPENDENTE, sem memória do grupo anterior. Nova função `_resolver_extensoes` faz uma pré-passada sobre os grupos ANTES da conversão: detecta cadeia `+` de 2/3/4 grupos mesma altura → colapsa num `dur_override` único (`c'2`/`c'2.`/`c'1`); detecta grupo com `.` solto → reduz o orçamento do PRÓXIMO grupo em meio tempo (`_converter_tempo` ganhou parâmetro `unidade_tempo_override`). Combinações não confirmadas (ponto seguido de ponto, etc.) caem no comportamento antigo — R1, não generaliza sem caso real. | Guiga generalizou o pedido do `.`: "não é só o caso da nota pontuada... é o caso das notas que valem dois tempos... mínima e semibreve, que às vezes também tem que aparecer". Mesmo problema estrutural (falta de estado entre grupos), corrigido junto. |
| 2026-08-06 | **Achado real SEPARADO, não relacionado a `+`/`.`:** `musicxml2cromus` (`emitter.py`) trocava `\|` por `\n` puro na quebra de linha a cada 4 compassos — mas `cromus_studio.py` só reconhece `\|` como separador de compasso; `\n` vira espaço qualquer, absorvido dentro do compasso ANTERIOR. Corrompia silenciosamente a contagem de tempo toda vez que a peça cruzava uma quebra de linha (a Aurora, com 86 compassos, cruza várias). Só apareceu como sintoma agora (`bar check failed`) porque o `+`/`.` corrigidos acima finalmente produzem durações exatas que expõem a corrupção — antes, a imprecisão das semínimas ligadas mascarava o problema. Nunca pego antes porque o teste de round-trip (Dona Aranha) só compara TEXTO, nunca manda pro tradutor de verdade. Fix: `\|` sempre presente entre compassos; `\n` vira decoração cosmética ADICIONAL (igual ao exemplo legado em `cantiga_rules.md`, que mantém `\|` em toda fronteira mesmo quebrando linha). | Achado durante a verificação de ponta a ponta da correção acima — sem esse fix, `+`/`.` continuariam quebrando em qualquer peça com mais de 4 compassos que cruzasse a quebra de linha, mesmo depois de "corrigidos". |

---

## 10. VOCABULÁRIO DE DITADO POR VOZ

> Seção criada em 2026-07-30, atendendo pendência do handoff do Pro Studio (P2) e do CLAUDE.md,
> que já citava o problema sem nunca ter virado seção própria aqui. **Incompleta —
> só há 2 exemplos conhecidos até agora.** Guiga: se você tiver mais casos de transcrição errada
> que já reconhece de cabeça, valem entrar aqui pra qualquer sessão futura já saber interpretar
> de cara, sem precisar perguntar de novo.

| Ouvido (transcrição) | Quer dizer |
|---|---|
| "Cromos" | Cromus |
| "Not Form" | Note Form |

---

*Última atualização: 2026-07-30 — geometria de forma, produtos do ecossistema, vocabulário de voz e suporte a compasso composto (6/8, 9/8, 12/8) registrados; modelo de durações por contexto (jun/2026) e ~/+ (jul/2026) seguem a base do documento.*
