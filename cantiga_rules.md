# Regras do Motor Cromus v2.1 — Fonte da Verdade

## Regras visuais (aplicar em TODAS as cantigas)
- global-staff-size: 32
- ragged-last: ##t
- 4 compassos por sistema (usar \break após cada 4 compassos)
- Último compasso: tamanho normal, não esticar
- Barra final: \bar "|."
- Ogiva do Ré (Grau II): escala horizontal 0.75

## Regras de conversão Sintaxe Cromus → LilyPond

### Notas
1=Dó(c) 2=Ré(d) 3=Mi(e) 4=Fá(f) 5=Sol(g) 6=Lá(a) 7=Si(b)

### Durações por posição no tempo (compasso 2/4)
- Nota sozinha num tempo → semínima (4)
- Duas notas num tempo  → colcheia cada (8)
- Três notas num tempo  → semicolcheia cada (16)
- Traço ( - )           → pausa de semínima (r4)
- Mínima explícita      → (2)

### Oitava padrão
Todas as notas na oitava c' (clave de sol, posição central)
Apóstrofo ' sobe uma oitava → ex: 6' = a''

### Repetições
- ||:       → \repeat volta 2 {
- :||       → }
- (CASA 1)  → primeira chave de \alternative { { ... }
- (CASA 2)  → segunda chave de \alternative { ... { ... } }
- FIM       → \bar "|." no último compasso
- Traço (-) → pausa de semínima (r4)

---

## CANTIGA 01 — A Dona Aranha

### Fonte da verdade (Sintaxe Cromus original)
|1, 12| 3, 33| 21, 23| 1, 1|
|11, 12| 3, 3| 21, 23| 1, -|
|66, 66| 5, 31| 66, 66| 5, 3|
||: 11, 12| 3, 33| 21, 23|
(CASA 1) 1 :||
(CASA 2) 1, 1| 11, 12| 3, 33| 21, 23| 1, - || FIM

### Tabela de conversão compasso a compasso
| #  | Cromus  | LilyPond         | Leitura           |
|----|---------|------------------|-------------------|
|  1 | 1, 12   | c'4 c'8 d'8      | Dó♩ Dó♪Ré♪        |
|  2 | 3, 33   | e'4 e'8 e'8      | Mi♩ Mi♪Mi♪         |
|  3 | 21, 23  | d'8 c'8 d'8 e'8  | Ré♪Dó♪ Ré♪Mi♪     |
|  4 | 1, 1    | c'4 c'4          | Dó♩ Dó♩            |
|  5 | 11, 12  | c'8 c'8 c'8 d'8  | Dó♪Dó♪ Dó♪Ré♪     |
|  6 | 3, 3    | e'4 e'4          | Mi♩ Mi♩             |
|  7 | 21, 23  | d'8 c'8 d'8 e'8  | Ré♪Dó♪ Ré♪Mi♪     |
|  8 | 1, -    | c'4 r4           | Dó♩ pausa♩         |
|  9 | 66, 66  | a'8 a'8 a'8 a'8  | Lá♪Lá♪ Lá♪Lá♪     |
| 10 | 5, 31   | g'4 e'8 c'8      | Sol♩ Mi♪Dó♪        |
| 11 | 66, 66  | a'8 a'8 a'8 a'8  | Lá♪Lá♪ Lá♪Lá♪     |
| 12 | 5, 3    | g'4 e'4          | Sol♩ Mi♩            |
| 13 | 11, 12  | c'8 c'8 c'8 d'8  | Dó♪Dó♪ Dó♪Ré♪     |
| 14 | 3, 33   | e'4 e'8 e'8      | Mi♩ Mi♪Mi♪         |
| 15 | 21, 23  | d'8 c'8 d'8 e'8  | Ré♪Dó♪ Ré♪Mi♪     |
| C1 | 1, -    | c'4 r4           | Dó♩ pausa♩ (casa 1) |
| C2 | 1, 1    | c'4 c'4          | Dó♩ Dó♩ (casa 2)   |
| 16 | 11, 12  | c'8 c'8 c'8 d'8  | Dó♪Dó♪ Dó♪Ré♪     |
| 17 | 3, 33   | e'4 e'8 e'8      | Mi♩ Mi♪Mi♪         |
| 18 | 21, 23  | d'8 c'8 d'8 e'8  | Ré♪Dó♪ Ré♪Mi♪     |
| FM | 1, -    | c'4 r4 \bar "|." | Dó♩ pausa♩ ‖       |

### notas_ly_raw validado
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

### Instruções para o Claude Code
Antes de editar qualquer cantiga:
1. Leia este arquivo cantiga_rules.md
2. Confira a tabela compasso a compasso
3. Use o notas_ly_raw acima como fonte da verdade absoluta
4. Altere APENAS o que foi explicitamente solicitado
5. Nunca modifique notas, breaks ou parâmetros não mencionados
6. Após compilar, confirme que o PDF bate com a tabela
