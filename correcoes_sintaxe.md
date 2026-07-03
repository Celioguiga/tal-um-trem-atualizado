
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
