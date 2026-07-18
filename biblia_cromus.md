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

### Quiálteras
- **Detecção automática:** quando o total de parcelas no tempo NÃO é potência de 2 (3, 5, 6, 7, 9), vira quiáltera.
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

> ⚠️ NUNCA alterar estes valores. Toda cor/forma deriva de `rng_mapper.ts` — nunca hardcoded.

| Grau | Nota | Cor HEX | Forma |
|------|------|---------|-------|
| 1 | Dó | `#C0001A` | Círculo |
| 2 | Ré | `#ECD200` | Ogiva/elipse (escala horizontal 0.75) |
| 3 | Mi | `#F07300` | Triângulo (ponta cima) |
| 4 | Fá | `#00B050` | Quadrado |
| 5 | Sol | `#0066FF` | Círculo |
| 6 | Lá | `#8B5E00` | Hexágono |
| 7 | Si | `#9B5FC0` | Casa (pentágono) |

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

*Última atualização: jun/2026 — modelo de durações por contexto implementado e validado.*
