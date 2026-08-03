# Handoff — Pro Studio v3 (deploy VPS)
**Para:** sessão de Claude Code na VPS `srv1609088` (`187.77.43.169`)
**De:** sessão Claude (claude.ai), 02/07/2026
**Substitui:** a camada de app do `handoff_nfp_pro_fable5.md` (01/07) — os três gaps do item 3 daquele handoff estão resolvidos aqui.

---

## 1. O que é

`pro_studio.html` — aplicação NFP Pro completa em **arquivo único**, client-side, sem backend. Converte Sintaxe Cromus (modelo R7) em partitura RNFG com gravura profissional (VexFlow 4 / fonte Bravura, mesma família do LilyPond), com playback e exportação. Validada com a Cantiga 02 (O Cravo Brigou com a Rosa) que já vem carregada.

**Funcionalidades:** título/compasso/andamento; **tonalidade + modo** (8 maiores, 6 menores) com armadura, acidentes automáticos e legenda dinâmica grau→forma→cor; três modos de visualização (**Real** = formas coloridas, **Forma** = formas pretas, **Pauta** = tradicional); pausas, ligaduras (inclusive cruzando compasso), quiálteras, pontos de aumento, oitavas, `#`/`b`; playback Tone.js com destaque de nota e clique-para-ouvir; **Salvar/Abrir** (`.cromus.txt`), **Código** (importar/exportar texto com `@titulo/@compasso/@tom/@andamento`), **SVG**, **WAV** (render offline 16-bit) e **PDF** (impressão).

## 2. Decisões de arquitetura (registrar — R5)

1. **VexFlow 4.2.2 embutido no HTML** (build `vexflow-bravura.js`, 560 KB). Motivo: na v1, o CDN do VexFlow falhou no ambiente do Guiga (player via outro CDN funcionou, partitura não). Zero dependência de rede para a gravura.
2. **Motor de pauta manual descartado** (v2). Guiga avaliou como amador vs LilyPond. Gravura agora é 100% VexFlow/Bravura.
3. **Cabeça de nota original com `fill:none`** nos modos Real/Forma (não pintar de branco): pintar de papel apagava a linha da pauta e vazava lasca branca na lateral das formas estreitas.
4. **Título e subtítulo gravados dentro do SVG** (estilo LilyPond) — saem no SVG exportado e no PDF.
5. **Layout:** 4 compassos por sistema (2 em tela estreita), última linha *ragged* como `ragged-last` do LilyPond.
6. **Tone.js continua via CDN** (cdnjs) — funcionou no ambiente do Guiga. Pendência P3 na seção 8 se quisermos offline total.

## 3. Correções de formas RNFG (o motivo deste ciclo) — GEOMETRIA CANÔNICA

Definidas com Guiga em 02/07 e validadas visualmente em zoom. **Levar para `rng_mapper.ts` e `biblia_cromus.md`** (hoje a bíblia diz só "ogiva/elipse" e "hexágono", sem orientação — insuficiente, foi o que deixou isso "desresolver").

Todas centradas em `(cx,cy)`, `s` = meia-altura de referência (≈ 5.4 no staff space 10):

| Grau | Forma | Especificação |
|---|---|---|
| 2 | **Ogiva dupla, deitada** | Dois arcos com **pontas agudas nas laterais** (não elipse!). Path: `M cx-w,cy Q cx,cy-2h cx+w,cy Q cx,cy+2h cx-w,cy Z` com `w=1.38s`, `h=0.95s`. Mais larga que alta. |
| 6 | **Hexágono deitado** | Vértices nas **laterais**, faces retas em cima/embaixo (não em pé!). Vértices: `(±w,cy)`, `(±w/2,±h)` com `w=1.38s`, `h=0.92s`. **Mesma dimensão da ogiva.** |
| 7 | **Casinha com beiral** | Telhado **ultrapassa as paredes** (abas evidentes), telhado baixo, corpo largo. Paredes `±0.84s`; beiral `±1.46s` na linha `cy-0.34s`; cumeeira `cy-1.12s`; base `cy+0.98s`. |

Inalteradas: 1=círculo (`r=0.98s`), 3=triângulo ponta-cima, 4=quadrado, 5=**estrela** 5 pontas, contorno em todas `rgba(0,0,0,.32)` 0.8px.

⚠️ **Divergência aberta:** o handoff de 01/07 diz grau 5 (Sol) = **estrela** (correção `make-circulo`→`make-estrela`); a cópia da `biblia_cromus.md` dentro da skill diz "5 = Círculo". Segui o handoff (estrela). **Guiga precisa cravar qual é o canônico e corrigir a outra fonte.**

## 4. Parser Cromus (R7) — implementado em `src/core.js`

Vírgula = tempo; espaço = divisão igual; `*` = parcelas; total não-potência-de-2 = quiáltera automática (`num_notes=total`, `notes_occupied=2^⌊log₂(total)⌋`); `-`/`0` = pausa; `'` direita/esquerda = oitava acima/abaixo; `#`/`b`; `~` = ligadura (mesma altura soma duração no playback, não re-ataca). Normaliza apóstrofos tipográficos do **ditado por voz** (`’‘´`→`'`). Repetições (`||:` `:||` `CASA` `FIM`) são detectadas e renderizadas **linearmente com aviso** — volta real é pendência. Avisos não-fatais para compasso com nº de tempos ≠ fórmula.

Pitch: grau→letra a partir da tônica (menor natural via armadura relativa); `midi = 12(oitava+1) + semitom + armadura + acidente`; acidentes desenhados via `Accidental.applyAccidentals` (respeita armadura e estado do compasso).

## 5. Estrutura do pacote e REGRA DE OURO

```
pro_studio_deploy/
├── pro_studio.html      ← produto final (588 KB) — NUNCA editar direto
├── build.py             ← montagem: python3 build.py
├── src/
│   ├── shell.html       ← HTML/CSS/estrutura (marcador @INJETAR_SCRIPTS)
│   ├── core.js          ← RNG_MAPPER + parser R7 + buildScore
│   ├── renderer.js      ← gravura VexFlow + formas RNFG (geometria da seção 3)
│   └── app.js           ← UI, playback, WAV, salvar/abrir/código
└── vendor/
    └── vexflow-bravura.js  ← VexFlow 4.2.2 (não tocar)
```

**Regra (mesma lição do `cromus_studio.py` corrompido):** editar SEMPRE os arquivos pequenos em `src/` com `str_replace` cirúrgico e rodar `python3 build.py`. Editar o HTML de 588 KB direto = repetir o erro das 104 linhas.

## 6. Deploy na VPS

No Mac (arquivo baixado/descompactado em `~/Downloads/pro_studio_deploy`):
```bash
scp -r ~/Downloads/pro_studio_deploy root@187.77.43.169:~/pro_studio
```
Na VPS — servir na **porta 4243** (não mexer no 4242 do cromus_studio):
```bash
cd ~/pro_studio_deploy && nohup python3 -m http.server 4243 > ~/pro_studio.log 2>&1 &
```
Acessar: `http://187.77.43.169:4243/pro_studio.html`
Reiniciar: `pkill -f "http.server 4243"` e repetir o nohup. Se a porta estiver bloqueada, liberar no firewall da Hostinger (mesmo procedimento usado para a 4242).
Após qualquer edição em `src/`: `cd ~/pro_studio_deploy && python3 build.py` (recarregar o navegador).

## 7. Testes executados (evidência desta sessão)

Suíte em Node/jsdom com o mesmo código embarcado — 3 casos, zero erros/avisos, âncoras conferidas, render inspecionado visualmente em PNG (inclusive zoom nas formas):
1. **Cantiga 02, Dó maior, modo Real** — 35 eventos; exercita pausa, ligadura mesma altura, oitavas, beams.
2. **Cantiga 02, Sol maior, modo Pauta** — armadura 1♯, transposição de graus.
3. **Caso pesado, Lá menor, modo Forma** — tercina, grade `5**5*5*`, `-*-*5*5*`, `3#` com ligadura, `'5`, `4b`, ligadura cruzando compasso.

## 8. Pendências (ordem sugerida)

1. **P1 — Guiga validar no navegador** (Mac/iPhone): formas, armaduras, WAV, impressão. Formas foram aprovadas em imagem, falta o teste real.
2. **P2 — Sincronizar fontes da verdade:** levar a geometria da seção 3 para `rng_mapper.ts` e `biblia_cromus.md`; resolver a divergência estrela×círculo do grau 5; formalizar o vocabulário de ditado por voz como seção nova da bíblia (pendente desde 01/07).
3. **P3 — Embutir Tone.js:** ✅ feito (2026-07-30). `vendor/tone.js` (14.8.49, mesma versão do CDN anterior — baixado, não reescrito), injetado por `build.py` no mesmo padrão do `vexflow-bravura.js`; `<script src=cdnjs...>` removido de `shell.html`. `pro_studio.html` foi de 623KB pra 964KB (+341KB, menos da metade da estimativa de +700KB do handoff original). Validado: zero requisição de rede externa no carregamento (só `file://`/`blob:`), `Tone.version` continua `14.8.49`, playback com highlight funcionando igual.
4. **P4 — Repetições reais:** ✅ *gravura* feita em 03/07 (ver §10 — barras `||: :||`, casas 1/2 como Volta, `fim`=`|.`). ✅ **playback** também feito (2026-07-30): `unfoldRepeats()` (`core.js`) já existia calculando a ordem executada de compassos, mas nunca era chamada — `render()` agora preenche `lastPlayOrder` com ela, e `schedule()` (`app.js`) percorre a sequência de ocorrências daí (compasso executado → eventos daquele compasso) em vez da ordem linear escrita. O `skip` de ligadura foi reindexado por posição na sequência executada (não pelo índice original do evento), já que a mesma nota escrita pode tocar mais de uma vez (corpo repetido) ou nenhuma (casa da passada errada). `idx` continua sendo o índice original em `lastEvents` — a mesma nota na partitura acende de novo a cada repetição, não duplica visualmente. Validado tocando de verdade (não só matemática): sequência de halos observada bateu 100% com a ordem esperada (corpo→casa1→corpo de novo→casa2), sem regressão em peça sem repeat.
5. **P5 — Compasso composto:** ✅ feito (2026-07-30). `6/8`, `9/8`, `12/8` adicionados ao `<select>` (`shell.html`); `app.js` extrai `tsDen` de `"num/den"` e propaga pra `buildScore`/`renderScore`. Em `core.js`, `buildScore` detecta `compound=(tsDen===8&&tsNum%3===0)` e usa `tempoRef=24` (semínima pontuada = 1 tempo R7) em vez de `16`; validação de contagem de tempos por compasso passa a comparar contra `tsNum/3` em composto, não o numerador bruto; tabela `DUR` estendida (24/32/48/64) unificou a antiga tabela `FIGURA` do `+` (fim da duplicação de fonte de verdade). `renderer.js`: `VF.Voice({beat_value:tsDen})` em vez de `4` fixo. `rng_tab_module.js` não mudou nada — é agnóstico a simples/composto por construção (só lê `code`/`beats`/`dots` já calculados). Bug pego em teste antes de qualquer uso real: a detecção automática de quiáltera (potência de 2) marcava 3 colcheias dividindo naturalmente 1 tempo composto como tercina errada — corrigido em `parseBeat` (agora recebe `compound` desde `parseCromus`, que por sua vez passou a receber `tsNum,tsDen`) comparando contra `3×potência-de-2` em vez da série binária pura quando o compasso é composto. Validado: `buildScore` direto (6 colcheias em 6/8 → `code:"8",dots:0` certo; `+` fundindo 2 tempos compostos → mínima pontuada certa; aviso de contagem citando `tsNum/3`; regressão em 3/4 e 4/4 com repeat/casa/`+` sem diferença) + visual no navegador (beam 3+3 correto na pauta e na tablatura, mínima pontuada vazada certa). Registrado na Bíblia seção 2 (exceção de quiáltera) e seção 9 (histórico). Troca de compasso no meio da obra (sintaxe `[6/8]`, decidida mas não implementada) e decomposição de `((...))` como quiáltera de compasso inteiro seguem fora de escopo.

6. **Modo rolagem/scrubber (auto-scroll no playback):** ✅ feito (2026-07-30), registrado retroativamente — foi implementado na mesma sessão do P4/P3 mas nunca tinha sido escrito aqui, o que gerou um roadmap externo desatualizado. Leitura (a): não é um segundo modo de layout (a partitura continua quebrada em múltiplos sistemas, igual a hoje) — o contêiner `#score` (`shell.html`, `overflow-x/y:auto; max-height:70vh`) ganhou auto-scroll que segue o índice da nota tocando agora, o mesmo índice que já alimenta `pintarHalo`. `app.js`: `layoutAtual` guarda a saída de `renderScore` (âncoras, `perLine`, `rowH`, `top`) depois de cada render; `acompanharScroll(idx)` calcula se a linha da nota atual (vertical) e a posição X dela dentro da linha (horizontal) já estão visíveis — só rola quando não estão (não segue nota a nota, é "modo página"); `autoScrollAtivo` desliga automaticamente se o usuário rolar manualmente (listener em `#score`, ignora scroll que o próprio `acompanharScroll` disparou via flag `scrollProgramatico` com timeout de 1s pra não confundir animação `smooth` em andamento com scroll manual) e liga de novo a cada `play()`. Validado: peça longa (14 compassos, `perLine=2` na largura de teste) — `scrollTop` avança em degraus conforme as linhas mudam durante o playback, sem erro de console; peça de 1 compasso — sem jitter, estabiliza numa única correção pequena mesmo com viewport menor que 1 sistema.

## 9. Fora do escopo desta entrega (não confundir — R4)

Isto é o **NFP Pro** (Pro Studio). NFP Live continua produto distinto e bloqueado atrás dos gates GO/NO-GO. As features da spec funcional do Prompt Mestre (Modo Apresentação `/apresentacao`, sincronização professor-aluno, banco) seguem como próxima camada, agora desbloqueadas porque a camada de dados (Score com pausa/ligadura/multi-compasso) existe e está validada.

## 10. 03/07/2026 — Gramática estrutural entra no tokenizer (R5)

**Problema:** o parser (`src/core.js`) reconhecia notas/quiálteras/oitavas, mas os símbolos de **estrutura** e o **ponto de aumento** apenas eram *removidos com aviso* ("renderizado linear") ou caíam no `default` do tokenizer. Resultado: o `:` de `:||` e as palavras `casa`/`fim` quebravam o array de tempos — figuras sumiam e sobravam hastes órfãs.

**Feito (str_replace cirúrgico em `core.js` + `renderer.js`; backups `*.bak_*` em `src/`):**
- Tokenizer consome os símbolos estruturais **antes** de parsear nota, convertendo em sentinelas `@RB@/@RE@/@V1@/@V2@/@END@` que sobrevivem ao `split("|")`:
  - `||:` → repeat-begin (`VF.Barline.REPEAT_BEGIN`)
  - `:||` → repeat-end (`VF.Barline.REPEAT_END`)
  - `(casa 1)` / `(casa 2)` → `VF.Volta` (casa pode abranger vários compassos: BEGIN na 1ª, MID no meio, END na última; rótulo `1.`/`2.` só em BEGIN/BEGIN_END, que é onde o VexFlow desenha o número). **Case-insensitive.**
  - `fim` → barra final `|.` (`VF.Barline.END`). **Case-insensitive.**
- `~` (ligadura) já estava no tokenizer; agora formalizado na bíblia.
- `.` (ponto de aumento): **açúcar sintático sobre R7**, ×1,5 nas parcelas (`5.` → 3 parcelas = `5***` = 3/4 do tempo). NÃO cria ritmo paralelo — R7 (parcelas) continua fonte única. Reaproveita o `dots` do VexFlow via a tabela `DUR`.
- `parseCromus` agora anexa a cada compasso: `{repeatBegin, repeatEnd, volta, endBar}`; `renderScore` lê via `opts.measures[mi]`.
- **R1/R2/R3 intactos:** nenhuma mudança em notas/formas/cores (`RNG_MAPPER`). Só tokenizer/estrutura.

**Validado:** A Dona Aranha completa (`||: :|| casa 1 casa 2 fim`) renderiza headless (jsdom + VexFlow embutido) **sem exceção**, 62 formas RNFG, voltas presentes, **zero aviso de símbolo órfão**. Único aviso restante é legítimo: `(casa 1) 1` tem 1 tempo e a fórmula 2/4 pede 2 (divergência do texto-fonte, não do parser — a ref. LilyPond usa `c'4 r4`).

**LIÇÃO (registrar e obedecer):** *Nenhum símbolo entra na bíblia sem entrar no tokenizer.* A gramática canônica do Cromus = **interseção** `biblia_cromus.md ∩ parser core.js`. Todo símbolo documentado precisa ter caminho de parse; todo caminho de parse precisa estar documentado. (Foi por documentar `||:`/`casa`/`fim` sem implementá-los que a renderização "desresolvia".)

**Pendente relacionado:** playback ainda toca linear (não dá o salto de volta) — P4 na §8.
