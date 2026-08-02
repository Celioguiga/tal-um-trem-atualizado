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

### Notas que excedem 1 tempo — `~` (ligadura) e `+` (soma de tempos inteiros)
> Registrado em 2026-07-29 (Pro Studio). Nunca documentado formalmente antes disso —
> ver seção 9, Histórico de Decisões.

O modelo R7 (parcelas) só descreve o que acontece **dentro** de 1 tempo. Pra uma nota
durar mais que 1 tempo (mínima, mínima pontuada, semibreve, ou qualquer ligadura de
expressão), existem dois símbolos, com propósitos diferentes:

| Símbolo | Posição | Significado | Exige mesma altura na próxima nota? | Resultado |
|---------|---------|-------------|--------------------------------------|-----------|
| `~` | após a nota/pausa | Ligadura de prolongamento (caso geral) — liga duas notas escritas, de valores fracionários ou inteiros, tipicamente atravessando compasso (ex.: última semínima de um compasso ligada à primeira do próximo). | Se a próxima nota for de altura diferente, `~` não quebra — vira ligadura de expressão (slur), mantendo as duas notas com ataque próprio. | Mantém 2+ eventos separados, ligados por um arco visual. Duração soma pro áudio, mas a pauta desenha 2 cabeças de nota. |
| `+` | após uma nota/pausa que ocupa **1 tempo inteiro, sem subdivisão** (sem `*`/`.`) | Soma de tempos inteiros — forma direta de escrever mínima/semibreve como 1 figura só. Encadeável (`1+,1+,1` = mínima pontuada). | **Sim, obrigatório** — próxima nota (ou pausa) tem que ser a MESMA altura (ou também pausa). Se não for, ou se a nota estiver subdividida, `+` é **ignorado com aviso**, sem fundir nada. | **Colapsa em 1 evento só** — 1 cabeça de nota tradicional (mínima = cabeça aberta + haste; semibreve = cabeça aberta sem haste nenhuma), sem arco. |
| `2` tempos (`1+,1`) | — | Mínima | — | `code:"h", dots:0` |
| `3` tempos (`1+,1+,1`) | — | Mínima pontuada | — | `code:"h", dots:1` |
| `4` tempos (`1+,1+,1+,1`) | — | Semibreve | — | `code:"w", dots:0` |
| Qualquer outra soma (5, 6, 7...) | — | Sem figura tradicional única | — | **Erro/aviso** — nada é fundido; reescreva com `~` ligando figuras válidas. Decomposição automática em múltiplas figuras fica fora de escopo por ora. |

Funciona igual em pausa (`-+,-` = pausa de mínima) — mesma exigência de "mesmo tipo"
(pausa só liga com pausa).

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
| — | Pendente: reconciliar esse modelo (`~`/`+`) com `cromus_studio.py`/`pipeline.py` — que têm seu próprio histórico de sufixos de duração por letra (`w/h/q/e/s/t/i` em `cromus_studio.py`, `m/s/c` em `pipeline.py`, nenhum deles idêntico ao que está documentado aqui). Investigação e decisão de reconciliação adiadas para sessão futura. | Bíblia é fonte de verdade única pros dois motores (Cromus Studio Python e Pro Studio JS) — deixar os dois sistemas com semânticas de duração divergentes é o tipo de furo que gerou essa própria sessão de trabalho. |
| 2026-07-30 | Pro Studio: `unfoldRepeats()` (já existia em `core.js`, nunca era chamada) conectada ao playback — `schedule()` agora toca a ordem executada de verdade (corpo repete, casa da passada errada é pulada), não só a gravura. | P4 do handoff — pauta/tab já desenhavam `\|\|: :\|\|`/casas corretos, mas o áudio ignorava e tocava tudo linear. |
| 2026-07-30 | Registrado (não resolvido): `rng_mapper_shared.js` existe pretendendo ser fonte única entre Pro Studio e um terceiro produto (`braco_rnfg_v5.2.html`, "Braço RNFG", nunca antes documentado aqui) — mas não está conectado ao build do Pro Studio, e suas duas cópias soltas já divergiram entre si. Ver seção 0. | Achado investigando P2 (sincronizar fontes de verdade) — decisão de arquitetura (unificar de verdade, ou formalizar que cada produto mantém cópia própria) ainda pendente, não decidi sozinho. |
| 2026-07-30 | Pro Studio passa a suportar compasso composto (6/8, 9/8, 12/8) como propriedade da peça inteira. Decisão musical central: em composto, **1 tempo R7 (1 vírgula) = o tempo composto inteiro** (semínima pontuada — 6/8 sente-se em 2, não em 6), igual à leitura tradicional. Consequência prática: 6 colcheias simples em 6/8 se escrevem com 2 vírgulas, cada uma agrupando 3 notas por espaço — mesma mecânica que já existia pra colcheias dentro de 1 tempo simples, sem sintaxe nova. Contagem de tempos esperados por compasso passa a ser `numerador/3` em composto (6/8→2, 9/8→3, 12/8→4) em vez do numerador bruto. | P5 do handoff — suportar compasso composto é condição mínima de competência de mercado pro Ecossistema Synemusic, mesmo sem nenhuma cantiga do repertório atual usando isso ainda. Troca de compasso no meio da obra (multi-metria) fica para uma rodada futura; sintaxe `[6/8]` reservada (colchetes não colidem com nada hoje) mas não implementada. |
| 2026-07-30 | Corrigido durante a validação do item acima: a detecção automática de quiáltera (seção 2, "Quiálteras") comparava sempre contra a série binária (1,2,4,8,16...), o que fazia 3 notas dividindo naturalmente 1 tempo composto (divisão ternária nativa) serem incorretamente marcadas como tercina. A detecção agora usa como referência `3×potência-de-2` (3,6,12,24) quando o compasso é composto, e a série binária normal quando é simples — só o que foge dessa base natural (ex.: 2 notas no lugar de 3 = duína) continua virando quiáltera de verdade. | Bug pego em teste programático antes de qualquer uso real — sem essa correção, toda cantiga em compasso composto teria colcheias simples desenhadas como colcheias pontuadas erradas. |
| 2026-07-30 | Registrado retroativamente: Pro Studio ganhou auto-scroll durante o playback (`acompanharScroll` em `app.js`) na mesma sessão do P4/P3, mas nunca tinha sido escrito aqui — o roadmap de acompanhamento externo seguiu tratando o item como "não iniciado" por falta de registro. Não é um segundo modo de layout (a partitura continua quebrada em múltiplos sistemas); o contêiner rolável (`#score`) passa a seguir o índice da nota tocando agora (mesmo índice do halo), rolando só quando a linha atual ou a posição X da nota saem da área visível — "modo página", não nota a nota. Desliga sozinho se o usuário rolar manualmente, religa a cada novo playback. | Trabalho já feito, só não documentado — o gap de registro é o mesmo tipo de furo que motivou criar esta seção 9: decisão real de arquitetura que existia só no código, invisível pra qualquer rastreamento fora dele. |

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
