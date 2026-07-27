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
3. **P3 — Embutir Tone.js** no build para offline total (mesmo padrão do VexFlow, +~700 KB).
4. **P4 — Repetições reais:** ✅ *gravura* feita em 03/07 (ver §10 — barras `||: :||`, casas 1/2 como Volta, `fim`=`|.`). Falta o **playback** dar o salto de volta real (hoje toca linear).
5. **P5 — Limites conhecidos:** fórmulas apenas com denominador 4 (2/4, 3/4, 4/4); quiálteras explícitas `((...))` de compasso inteiro tratadas como grupo de tempo.

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
