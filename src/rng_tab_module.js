/* =====================================================================
   RNG_TAB_MODULE — lógica de Real Tablatura.
   Cola LOGO APÓS o bloco RNG_MAPPER no core.js (usa RNG_MAPPER, SEMI
   e LETTERS que já existem ali — NÃO redefine cor/forma, R3 respeitada).
===================================================================== */

/* ---------- instrumentos suportados: afinação, nº de cordas, transposição ----------
   `transposicao` é quanto SOMAR ao MIDI escrito (e.midi) pra achar o MIDI
   REAL que o instrumento toca no braço — cada instrumento tem sua própria
   relação entre "grafado" e "soa", e o catálogo de cantigas foi composto
   mirando o registro grave do violão.
   Violão: grafado 1 oitava ACIMA do que soa → -12 (desce).
   Ukulelê: cordas soltas ficam bem mais agudas que as do violão (Dó4=60 até
   Lá4=69) — a mesma nota escrita que cai confortável no violão (depois do
   -12) ficaria ABAIXO de qualquer corda solta do ukulelê sem correção
   nenhuma (tudo "fora"). Por isso o ukulelê SOBE 1 oitava → +12, sentido
   oposto ao violão, pra cair no registro real do instrumento.

   `transposicaoAudio` é a MESMA ideia, mas pro ÁUDIO (schedule() em app.js
   e scheduleDesenrolado() em scrubber_module.js — o que toca de verdade,
   Tone.Sampler). NÃO é sempre igual a `transposicao` (a do braço/tab): o
   violão HISTORICAMENTE toca o MIDI escrito direto, sem descer a oitava no
   áudio (0) — só a tab desce (-12); mudar isso agora mudaria como o violão
   soa hoje, sem terem pedido. O ukulelê é feature nova, sem comportamento
   herdado pra preservar — some 1 oitava tanto na tab quanto no áudio (+12
   nos dois), senão toca na mesma altura do violão com timbre diferente só
   (foi exatamente o bug reportado). */
const INSTRUMENTOS = {
  violao: {
    nome: 'Violão', nCordas: 6,
    cordas:     [SEMI.E ?? 4, SEMI.A ?? 9, SEMI.D ?? 2, SEMI.G ?? 7, SEMI.B ?? 11, SEMI.E ?? 4],
    cordasMidi: [40, 45, 50, 55, 59, 64],           // E2 A2 D3 G3 B3 E4
    nomes:      ['Mi','Lá','Ré','Sol','Si','Mi'],
    nCasas: 12, transposicao: -12, transposicaoAudio: 0,
  },
  ukulele: {
    nome: 'Ukulelê', nCordas: 4,
    cordas:     [SEMI.G ?? 7, SEMI.C ?? 0, SEMI.E ?? 4, SEMI.A ?? 9],
    cordasMidi: [67, 60, 64, 69],                   // G4 C4 E4 A4 (afinação padrão reentrante)
    nomes:      ['Sol','Dó','Mi','Lá'],
    nCasas: 12, transposicao: 12, transposicaoAudio: 12,
  },
  /* Contrabaixo: as cordas são as MESMAS 4 mais graves do violão em nome
     (Mi Lá Ré Sol), mas soam 2 oitavas abaixo — daí a transposição −24 e não
     −12. Com −12 o Dó escrito cairia na décima casa da corda Ré: dentro do
     braço, mas num registro agudo que não é onde um baixo faz melodia; com
     −24 ele cai na oitava casa da corda Mi grave, uma oitava abaixo do
     violão, que é a relação real entre os dois instrumentos. Tab e áudio
     andam juntos aqui (o −12/0 do violão é herança, não modelo).
     Sem entrada em CAGED_SHAPES de propósito — ver temCaged(). */
  contrabaixo: {
    nome: 'Contrabaixo', nCordas: 4,
    cordas:     [SEMI.E ?? 4, SEMI.A ?? 9, SEMI.D ?? 2, SEMI.G ?? 7],
    cordasMidi: [28, 33, 38, 43],                   // E1 A1 D2 G2
    nomes:      ['Mi','Lá','Ré','Sol'],
    nCasas: 12, transposicao: -24, transposicaoAudio: -24,
  },
};
let INSTRUMENTO_ATUAL   = 'violao';
let CORDAS              = INSTRUMENTOS[INSTRUMENTO_ATUAL].cordas;
let CORDAS_MIDI         = INSTRUMENTOS[INSTRUMENTO_ATUAL].cordasMidi;
let N_CORDAS             = INSTRUMENTOS[INSTRUMENTO_ATUAL].nCordas;
let NCASAS               = INSTRUMENTOS[INSTRUMENTO_ATUAL].nCasas;
let TRANSPOSICAO         = INSTRUMENTOS[INSTRUMENTO_ATUAL].transposicao;
let TRANSPOSICAO_AUDIO   = INSTRUMENTOS[INSTRUMENTO_ATUAL].transposicaoAudio;
/* troca o instrumento ativo — chamar ANTES de desenhaTabInline (app.js faz
   isso no topo de render()). Chave desconhecida cai em violão. */
function setInstrumento(key){
  const cfg = INSTRUMENTOS[key] || INSTRUMENTOS.violao;
  INSTRUMENTO_ATUAL = INSTRUMENTOS[key] ? key : 'violao';
  CORDAS = cfg.cordas; CORDAS_MIDI = cfg.cordasMidi; N_CORDAS = cfg.nCordas;
  NCASAS = cfg.nCasas; TRANSPOSICAO = cfg.transposicao; TRANSPOSICAO_AUDIO = cfg.transposicaoAudio;
}
const midiDoCorda = (corda,casa) => CORDAS_MIDI[corda] + casa;

/* pitch class de um evento da pauta (e.letter + e.acc, já vêm do buildScore) */
function pcDoEvento(e){ return ((SEMI[e.letter] ?? 0) + (e.acc||0) + 12) % 12; }

/* ---------- posições possíveis de um pc no braço ---------- */
function posicoesPossiveis(pc, maxCasa){
  maxCasa = maxCasa ?? NCASAS;
  const opcoes = [];
  for(let c=0;c<N_CORDAS;c++) for(let f=0; f<=maxCasa; f++)
    if((CORDAS[c]+f)%12 === pc) opcoes.push({corda:c, casa:f});
  return opcoes;
}
/* escolhe 1 posição dentre as opções, priorizando MIDI exato da nota (oitava
   certa) sobre o menor deslocamento — o deslocamento só desempata entre
   posições que já batem o MIDI exato. Se nenhuma bater, tenta o braço
   inteiro; se ainda assim nenhuma bater, cai pro pc mais próximo (oitava
   possivelmente errada) e marca fora=true. */
function escolherPosicao(pc, alvoMidi, opcoesPreferidas, atual){
  /* cada instrumento tem sua própria relação grafado↔soa (TRANSPOSICAO, ver
     INSTRUMENTOS acima) — a busca de posição mira no MIDI REAL do braço,
     não no MIDI escrito (e.midi) direto. */
  const alvoReal = alvoMidi + TRANSPOSICAO;
  let pool = opcoesPreferidas.filter(o=>midiDoCorda(o.corda,o.casa)===alvoReal);
  let fora = false;
  if(!pool.length){
    const todas = posicoesPossiveis(pc);
    const exatasTodas = todas.filter(o=>midiDoCorda(o.corda,o.casa)===alvoReal);
    pool = exatasTodas.length ? exatasTodas : (opcoesPreferidas.length ? opcoesPreferidas : todas);
    fora = true;
  }
  let melhor = pool[0], custo = Infinity;
  pool.forEach(o=>{
    const c = Math.abs(o.casa-atual.casa)*2 + Math.abs(o.corda-atual.corda);
    if(c<custo){custo=c; melhor=o;}
  });
  return {corda:melhor.corda, casa:melhor.casa, pc, fora};
}
/* modo "mais próxima": MIDI exato manda; deslocamento de casa/corda só desempata */
function posicionaMelodia(pcs, midis, casaInicial){
  let atual = {corda: Math.floor(N_CORDAS/2), casa: casaInicial ?? 0};
  return pcs.map((pc,k)=>{
    const p = escolherPosicao(pc, midis[k], posicoesPossiveis(pc), atual);
    atual = p;
    return p;
  });
}

/* ---------- CAGED: 5 caixas fixas, ancoradas na corda que dá nome ao desenho ----------
   ⚠ Limites aproximados (didática CAGED padrão) — confira 1 desenho contra
   referência antes de validar com aluno.
   Uma tabela por instrumento — as 5 LETRAS são as mesmas no <select> (C/A/G/
   E/D), mas a corda-âncora e a janela de casas mudam porque o braço é outro.
   Violão (EADGBE): mapeamento igual desde sempre. Ukulelê (GCEA reentrante):
   cada letra ainda usa a corda que "tem o nome dela" quando existe (C→corda
   Dó, A→corda Lá, G→corda Sol, E→corda Mi); D não tem corda própria no
   ukulelê, então ancora na corda Dó (mesma lógica do acorde de Ré aberto no
   ukulelê: Sol(2)-Dó(2)-Mi(2)-Lá(0), fundamental cai na corda Dó). */
const CAGED_SHAPES = {
  violao: {
    C: { nome:'Dó (C)',  corda:1, offsetMin:-3, offsetMax:1 },
    A: { nome:'Lá (A)',  corda:1, offsetMin:-1, offsetMax:3 },
    G: { nome:'Sol (G)', corda:0, offsetMin:-2, offsetMax:2 },
    E: { nome:'Mi (E)',  corda:0, offsetMin:0,  offsetMax:4 },
    D: { nome:'Ré (D)',  corda:2, offsetMin:-2, offsetMax:2 },
  },
  ukulele: {
    C: { nome:'Dó (C)',  corda:1, offsetMin:-2, offsetMax:2 },  // corda Dó (índice 1: Sol-Dó-Mi-Lá)
    A: { nome:'Lá (A)',  corda:3, offsetMin:-2, offsetMax:2 },  // corda Lá
    G: { nome:'Sol (G)', corda:0, offsetMin:-2, offsetMax:2 },  // corda Sol
    E: { nome:'Mi (E)',  corda:2, offsetMin:-2, offsetMax:2 },  // corda Mi
    D: { nome:'Ré (D)',  corda:1, offsetMin:-2, offsetMax:2 },  // corda Dó (acorde de Ré aberto: 2-2-2-0)
  },
};
/* CAGED é sistema de acorde dedilhado no braço — não se aplica a todo
   instrumento. Num contrabaixo, que faz linha de nota única, e em afinação
   aberta (viola caipira), forçar as cinco letras do violão seria inventar
   regra. A AUSÊNCIA de tabela em CAGED_SHAPES é a declaração de que o
   instrumento não tem CAGED; quem pergunta é getTabOpts (app.js), que cai
   em "mais próxima". Sem isso, CAGED_SHAPES[INSTRUMENTO_ATUAL][shape]
   estouraria em instrumento sem tabela. */
function temCaged(key){ return !!CAGED_SHAPES[key || INSTRUMENTO_ATUAL]; }

function casaFundamental(pc, corda){
  for(let f=0; f<=NCASAS; f++) if((CORDAS[corda]+f)%12 === pc) return f;
  return 0;
}
function janelaCaged(tonicaPc, shapeKey){
  const sh = CAGED_SHAPES[INSTRUMENTO_ATUAL][shapeKey];
  const base = casaFundamental(tonicaPc, sh.corda);
  return { min: Math.max(0, base+sh.offsetMin), max: Math.min(NCASAS, base+sh.offsetMax) };
}
function posicionaMelodiaCaged(pcs, midis, tonicaPc, shapeKey){
  const jan = janelaCaged(tonicaPc, shapeKey);
  let atual = {corda: CAGED_SHAPES[INSTRUMENTO_ATUAL][shapeKey].corda, casa: jan.min};
  return pcs.map((pc,k)=>{
    let opcoesJanela = posicoesPossiveis(pc).filter(o=>o.casa>=jan.min && o.casa<=jan.max);
    const foraJanela = !opcoesJanela.length;
    if(foraJanela) opcoesJanela = posicoesPossiveis(pc);
    const p = escolherPosicao(pc, midis[k], opcoesJanela, atual);
    p.fora = p.fora || foraJanela;
    atual = p;
    return p;
  });
}

/* ---------- desenho SVG: forma RNFG com o número da casa dentro ---------- */
function pathForma(forma, r){
  switch(forma){
    case 'circulo': return null;
    case 'ogiva':   return `M ${-r} 0 Q 0 ${-r*0.92} ${r} 0 Q 0 ${r*0.92} ${-r} 0 Z`;
    case 'triangulo': { const p=[[0,-r],[r*0.92,r*0.62],[-r*0.92,r*0.62]]; return 'M '+p.map(a=>a.join(' ')).join(' L ')+' Z'; }
    case 'quadrado': { const s=r*0.86; return `M ${-s} ${-s} L ${s} ${-s} L ${s} ${s} L ${-s} ${s} Z`; }
    case 'estrela': { let d=''; for(let i=0;i<10;i++){ const rr=i%2===0?r:r*0.44, a=-Math.PI/2+i*Math.PI/5; d+=(i?' L ':'M ')+(rr*Math.cos(a)).toFixed(2)+' '+(rr*Math.sin(a)).toFixed(2);} return d+' Z'; }
    case 'hexagono': { let d=''; for(let i=0;i<6;i++){ const a=i*Math.PI/3; d+=(i?' L ':'M ')+(r*Math.cos(a)).toFixed(2)+' '+(r*Math.sin(a)).toFixed(2);} return d+' Z'; }
    case 'casinha': { const w=r*0.60,b=r*0.85,e=r*1.02; return `M ${-w} ${b} L ${-w} 0 L ${-e} 0 L 0 ${-r} L ${e} 0 L ${w} 0 L ${w} ${b} Z`; }
  }
}
/* vazado=true: só contorno (mínima/semibreve) — mesmo princípio da cabeça
   aberta da pauta, sem mexer em haste/tamanho. extra (posição "fora") tem
   prioridade sobre o contorno padrão quando os dois coexistem. */
function noteForm(forma, cor, r, extra, vazado){
  const attrs = vazado
    ? (extra ? `fill="none" ${extra}` : `fill="none" stroke="${cor}" stroke-width="1.8"`)
    : `fill="${cor}" ${extra||''}`;
  if(forma==='circulo') return `<circle r="${r}" ${attrs}/>`;
  return `<path d="${pathForma(forma,r)}" ${attrs}/>`;
}
function tintaContraste(hex){
  const h=hex.replace('#',''); const R=parseInt(h.substr(0,2),16),G=parseInt(h.substr(2,2),16),B=parseInt(h.substr(4,2),16);
  return (R*299+G*587+B*114)/1000 > 150 ? '#111' : '#fff';
}
function noteFormNum(forma, cor, r, casa, extra, vazado){
  const tinta = vazado ? '#333' : tintaContraste(cor);
  const dy = forma==='triangulo' ? r*0.30 : forma==='casinha' ? r*0.34 : 0;
  const fs = (r*1.25).toFixed(1);
  return `${noteForm(forma,cor,r,extra,vazado)}<text x="0" y="${(dy+parseFloat(fs)*0.35).toFixed(1)}" font-family="IBM Plex Mono, monospace" font-weight="600" font-size="${fs}" fill="${tinta}" text-anchor="middle">${casa}</text>`;
}
/* arco de ligadura de prolongamento entre 2 posições (mesma linha do braço) */
function arcoLigadura(x1,y1,x2,y2){
  const bulge = Math.max(4, Math.min(10, Math.abs(x2-x1)*0.25));
  const midX = (x1+x2)/2, midY = (y1+y2)/2 - bulge;
  return `<path d="M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}" fill="none" stroke="#999" stroke-width="1.3"/>`;
}
/* repeat-begin/repeat-end: fina + grossa + 2 pontos (espírito de VF.Barline
   REPEAT_BEGIN/REPEAT_END). lado='begin': fina na borda, grossa e pontos pra
   dentro da seção repetida (direita). lado='end': espelhado (pontos e grossa
   à esquerda, fina na borda). */
function glifoRepeticao(xBorda, lado, y1, y2, cor){
  const dir = lado==='begin' ? 1 : -1;
  const xGrossa = xBorda + 3*dir, xPontos = xGrossa + 4*dir;
  const yMeio = (y1+y2)/2, dGap = (y2-y1)*0.09;
  return `<line x1="${xBorda}" y1="${y1}" x2="${xBorda}" y2="${y2}" stroke="${cor}" stroke-width="1.2"/>`
    + `<line x1="${xGrossa}" y1="${y1}" x2="${xGrossa}" y2="${y2}" stroke="${cor}" stroke-width="3.5"/>`
    + `<circle cx="${xPontos}" cy="${yMeio-dGap}" r="1.8" fill="${cor}"/>`
    + `<circle cx="${xPontos}" cy="${yMeio+dGap}" r="1.8" fill="${cor}"/>`;
}
/* barra final (fim de peça/seção, sem repetição): fina + grossa, sem pontos
   — equivalente a VF.Barline.type.END. Grossa fica na borda (ponta externa). */
function glifoBarraFinal(xBorda, y1, y2, cor){
  return `<line x1="${xBorda-3}" y1="${y1}" x2="${xBorda-3}" y2="${y2}" stroke="${cor}" stroke-width="1.2"/>`
    + `<line x1="${xBorda}" y1="${y1}" x2="${xBorda}" y2="${y2}" stroke="${cor}" stroke-width="3.5"/>`;
}
/* bracket de volta (casa 1/2): traço horizontal acima do braço, com gancho só
   nas pontas REAIS (início/fim de toda a casa, não da linha) e rótulo só
   quando hookInicio é verdadeiro — evita repetir "1." em meio-bracket. */
function traceVolta(x1, x2, y, hookInicio, hookFim, rotulo, cor, corTexto){
  let s = `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${cor}" stroke-width="1.4"/>`;
  if(hookInicio) s += `<line x1="${x1}" y1="${y}" x2="${x1}" y2="${y+6}" stroke="${cor}" stroke-width="1.4"/>`;
  if(hookFim) s += `<line x1="${x2}" y1="${y}" x2="${x2}" y2="${y+6}" stroke="${cor}" stroke-width="1.4"/>`;
  if(rotulo) s += `<text x="${x1+4}" y="${y-3}" font-size="11" font-weight="700" fill="${corTexto}" font-family="IBM Plex Mono, monospace">${rotulo}</text>`;
  return s;
}
/* nível de colchete/beam por código de duração (VexFlow: "q" = sem colchete) */
function nivelFlags(code){ return {8:1,16:2,32:3,64:4}[code] || 0; }
/* deslocamento horizontal do encaixe da haste na nota: pra cima encaixa pela
   direita, pra baixo pela esquerda — convenção padrão de partitura */
const STEM_DX = 4;
/* direção pela corda: metade aguda (índices altos) pra cima, metade grave
   (índices baixos) pra baixo — generalizado pro nº de cordas do instrumento
   ativo (violão: 3/3; ukulelê: 2/2). -1=cima, 1=baixo */
function direcaoHaste(corda){ return corda>=N_CORDAS/2 ? -1 : 1; }
/* haste — direção inferida do sinal de (yTopo-yBase): sobe (yTopo<yBase) ou
   desce (yTopo>yBase). nFlags>0 empilha colchetes perto da ponta, voltando
   em direção à nota — usada tanto pra nota solta quanto dentro de um beam
   (nFlags=0, a barra do beam substitui o colchete). */
function desenhaHaste(x, yBase, yTopo, nFlags, cor){
  const dir = yTopo<yBase ? -1 : 1;
  let s = `<line x1="${x}" y1="${yBase}" x2="${x}" y2="${yTopo}" stroke="${cor}" stroke-width="1.4"/>`;
  for(let i=0;i<nFlags;i++){
    const fy = yTopo - dir*i*5;
    const fx2 = x + (dir<0?7:-7), fx3 = x + (dir<0?6:-6);
    s += `<path d="M ${x} ${fy} Q ${fx2} ${fy+dir*3} ${fx3} ${fy+dir*9}" fill="none" stroke="${cor}" stroke-width="1.4"/>`;
  }
  return s;
}
/* corpo neutro de uma pausa na tab (fallback caso a extração do VexFlow
   falhe por qualquer motivo) — sem cor de grau, sem número de casa */
function glifoPausa(x, y, cor){
  return `<rect x="${x-4.5}" y="${y-2}" width="9" height="4" rx="1" fill="${cor}"/>`;
}
/* glifo REAL de pausa, extraído em runtime do próprio VexFlow (nunca
   hardcoded — sempre fiel à versão instalada do vendor/Bravura). Renderiza
   um VF.StaveNote de pausa fora da tela, acha o path do glifo pelo tamanho
   plausível (exclui as 5 linhas retas da pauta e as barras de compasso) e
   cacheia por código de duração — só paga o custo de extração 1x por código. */
const CACHE_PAUSA_VEXFLOW = {};
const ESCALA_PAUSA = 0.5;
function obterGlifoPausaVexFlow(code){
  if(CACHE_PAUSA_VEXFLOW[code]!==undefined) return CACHE_PAUSA_VEXFLOW[code];
  let resultado = null;
  if(typeof Vex!=='undefined' && Vex.Flow){
    const VF = Vex.Flow;
    const div = document.createElement('div');
    div.style.position='fixed'; div.style.top='-9999px'; div.style.left='-9999px';
    document.body.appendChild(div);
    try{
      const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
      renderer.resize(200,150);
      const ctx = renderer.getContext();
      const stave = new VF.Stave(0,0,180);
      stave.setContext(ctx).draw();
      const note = new VF.StaveNote({keys:['b/4'], duration: code+'r'});
      const voice = new VF.Voice({num_beats:4, beat_value:4}).setMode(VF.Voice.Mode.SOFT);
      voice.addTickables([note]);
      new VF.Formatter().joinVoices([voice]).format([voice],150);
      voice.draw(ctx, stave);
      const alvo = Array.from(div.querySelectorAll('path')).find(p=>{
        const bb=p.getBBox(); return bb.width>2.5 && bb.width<25 && bb.height>2 && bb.height<40;
      });
      if(alvo){
        const bb = alvo.getBBox();
        resultado = { d: alvo.getAttribute('d'), cx: bb.x+bb.width/2, cy: bb.y+bb.height/2 };
      }
    }catch(_){ resultado = null; }
    document.body.removeChild(div);
  }
  CACHE_PAUSA_VEXFLOW[code] = resultado;
  return resultado;
}
function glifoPausaVexFlow(code, x, y, cor){
  const g = obterGlifoPausaVexFlow(code);
  if(!g) return glifoPausa(x,y,cor);
  const tx = (x - g.cx*ESCALA_PAUSA).toFixed(2), ty = (y - g.cy*ESCALA_PAUSA).toFixed(2);
  return `<g transform="translate(${tx},${ty}) scale(${ESCALA_PAUSA})"><path d="${g.d}" fill="${cor}"/></g>`;
}
/* barra(s) de beam conectando as hastes de um grupo — nível = duração mais
   curta do grupo (decisão: beam único, sem beam parcial de gravura profissional).
   dir: -1=grupo sobe (barras empilham pra baixo, em direção às notas), 1=desce. */
function desenhaBeam(x1, x2, yBeam, nivel, cor, dir){
  let s = '';
  for(let i=0;i<nivel;i++){
    const y = yBeam - dir*i*4;
    s += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${cor}" stroke-width="3"/>`;
  }
  return s;
}

/* =====================================================================
   desenhaTab() — desenha a Real Tablatura da melodia (eixo X = tempo,
   uma coluna por evento não-pausa). Consome `events` de buildScore()
   direto — mesma fonte que alimenta renderScore(), zero parser novo.

   destino  — elemento <svg>
   events   — array de buildScore() (core.js) — usa e.rest, e.letter, e.acc, e.deg
   tonicaPc — pitch class da tônica (pra CAGED). Se vier de key.spec,
              calcule com: (SEMI[key.tonicLetter] + sinal) % 12
   opts     — { modo:'proxima'|'caged', shape:'C'|'A'|'G'|'E'|'D', claro:bool }

   ⚠️ LEGADO — mantida só como referência histórica, NÃO é chamada pelo
   app.js hoje (ele chama desenhaTabInline, mais abaixo). Não editar sem
   necessidade explícita de usar o modo standalone de novo.
===================================================================== */
function desenhaTab(destino, events, tonicaPc, opts){
  opts = opts || {};
  const modo = opts.modo || 'proxima';
  const shape = opts.shape || 'E';
  const compasso = opts.compasso || '';       // ex: "2/4"
  const armadura = opts.armadura || '';       // ex: "Sol maior · 1♯"
  const linha='#999', texto='#666', fundo='#ffffff', barra='#333';

  const notas = events.filter(e => !e.rest);
  if(!notas.length){ destino.innerHTML=''; return; }
  const pcs = notas.map(pcDoEvento);
  const midis = notas.map(e=>e.midi);
  const posicoes = modo==='caged'
    ? posicionaMelodiaCaged(pcs, midis, tonicaPc, shape)
    : posicionaMelodia(pcs, midis);

  const N = notas.length;
  const X0=70, PASSO=46, X1=X0+(N-1)*PASSO+40;
  const HEADER_H = 38;                        // faixa reservada pro cabeçalho
  const Y0=30+HEADER_H, ALT=30, Y1=Y0+5*ALT;
  const W=X1+20, H=Y1+40;
  const nomesCordas=['Mi','Lá','Ré','Sol','Si','Mi'];
  const linhaY = c => Y0 + (5-c)*ALT;

  let s = `<rect x="0" y="0" width="${W}" height="${H}" fill="${fundo}"/>`;

  // cabeçalho: fórmula de compasso (grande, estilo tradicional) + armadura (texto)
  if(compasso){
    const partes = compasso.split('/');
    s += `<text x="30" y="${20+HEADER_H*0.42}" font-size="20" font-weight="700" fill="#222" text-anchor="middle" font-family="Georgia, serif">${partes[0]||''}</text>`;
    s += `<text x="30" y="${20+HEADER_H*0.42+22}" font-size="20" font-weight="700" fill="#222" text-anchor="middle" font-family="Georgia, serif">${partes[1]||''}</text>`;
  }
  if(armadura){
    s += `<text x="56" y="${18+HEADER_H*0.5}" font-size="14" fill="${texto}" font-family="IBM Plex Mono, monospace">${armadura}</text>`;
  }
  s += `<text x="${W-16}" y="${18+HEADER_H*0.5}" font-size="11" fill="${texto}" text-anchor="end" font-family="IBM Plex Mono, monospace" letter-spacing="0.06em">REAL TABLATURA</text>`;

  if(modo==='caged') s += `<text x="${X0-30}" y="${Y0-22}" fill="${texto}" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="600">Desenho ${CAGED_SHAPES[INSTRUMENTO_ATUAL][shape].nome}</text>`;

  for(let c=0;c<6;c++){
    const y = linhaY(c);
    s += `<line x1="${X0-20}" y1="${y}" x2="${X1}" y2="${y}" stroke="${linha}" stroke-width="${1.6-c*0.15}"/>`;
    s += `<text x="${X0-44}" y="${y+5}" fill="${texto}" font-family="IBM Plex Mono, monospace" font-size="14" font-weight="600">${nomesCordas[c]}</text>`;
  }

  let lastMeasure = notas[0].measure;
  posicoes.forEach((p,i)=>{
    const e = notas[i];
    if(i>0 && e.measure !== lastMeasure){
      const xBar = X0 + i*PASSO - PASSO/2;
      s += `<line x1="${xBar}" y1="${Y0-10}" x2="${xBar}" y2="${Y1+10}" stroke="${barra}" stroke-width="1.4"/>`;
    }
    lastMeasure = e.measure;
  });
  s += `<line x1="${X1-10}" y1="${Y0-10}" x2="${X1-10}" y2="${Y1+10}" stroke="${barra}" stroke-width="2.2"/>`;

  posicoes.forEach((p,i)=>{
    const x = X0 + i*PASSO, y = linhaY(p.corda);
    const e = notas[i];
    const cor = RNG_MAPPER.cores[e.letter];
    const forma = RNG_MAPPER.formas[e.deg];
    const extra = p.fora ? `stroke="#c33" stroke-width="1.5" stroke-dasharray="2,2"` : '';
    s += `<g transform="translate(${x},${y})">${noteFormNum(forma, cor, 13, p.casa, extra)}</g>`;
  });

  destino.setAttribute('viewBox', `0 0 ${W} ${H}`);
  destino.setAttribute('width', W);
  destino.setAttribute('height', H);
  destino.style.width = W + 'px';
  destino.style.height = H + 'px';
  destino.style.maxWidth = 'none';
  destino.style.display = 'block';
  destino.innerHTML = s;
}

/* =====================================================================
   desenhaTabInline() — versão alinhada à pauta de verdade (decisão B).
   Desenha DENTRO do svg que o renderScore já produziu, sistema por
   sistema, usando anchors[i].cx (posição real de cada nota) e
   measureBoxes[mi].x (posição real de cada compasso) — alinhamento
   exato com a pauta, não espaçamento simulado.
===================================================================== */
function desenhaTabInline(svg, mk, trilhas, tracksAnchors, tracksRestAnchors, measureBoxes, measures, perLine, rowH, TAB_H, topY, tonicaPc, opts){
  opts = opts || {};
  const modo = opts.modo || 'proxima';
  const shape = opts.shape || 'E';
  const compasso = opts.compasso || '';
  const armadura = opts.armadura || '';
  const texto='#666', linhaCor='#999', barraCor='#333';
  const warns = [];
  const pecaTemCoda = measures.some(m=>m.coda);

  /* prepara, por trilha: idxNotas/idxPausas/posições/posPorIdx/tabHalos/suprimidos/
     gruposRitmo — mesmo cálculo que já existia, só rodado 1x por trilha. Trilha
     principal (corda==null) continua usando a busca heurística (posicionaMelodia/
     CAGED); trilha com corda declarada usa posição DIRETA (sem busca) — mesma
     transposição de -12 semitons que escolherPosicao já usa (violão soa 1 oitava
     abaixo do escrito). */
  const porTrilha = trilhas.map((tr,t)=>{
    const events = tr.events;
    const idxNotas=[], idxPausas=[];
    events.forEach((e,i)=>{ if(e.rest) idxPausas.push(i); else idxNotas.push(i); });

    let posicoes;
    if(tr.corda==null){
      const pcs = idxNotas.map(i=>pcDoEvento(events[i]));
      const midis = idxNotas.map(i=>events[i].midi);
      posicoes = modo==='caged'
        ? posicionaMelodiaCaged(pcs, midis, tonicaPc, shape)
        : posicionaMelodia(pcs, midis);
    }else{
      const arrIdx = cordaLabelToIndex(tr.corda);
      posicoes = idxNotas.map(i=>{
        const e=events[i];
        const casa = (e.midi-12) - CORDAS_MIDI[arrIdx];
        return {corda:arrIdx, casa, pc:pcDoEvento(e), fora: casa<0||casa>NCASAS};
      });
    }

    const tabHalos = new Array(events.length).fill(null);
    /* ligaduras de prolongamento (~ com mesma nota): a 2ª nota some da tela (sem
       glifo, sem halo) e vira só o destino de um arco saindo da 1ª — não duplica
       o ataque, igual ao skip set de schedule() em app.js */
    const ligaduras = idxNotas.filter(idx=>events[idx].tie && events[idx].sameTie);
    const suprimidos = new Set(ligaduras.map(idx=>idx+1));
    const posPorIdx = {}; idxNotas.forEach((idx,k)=>{ posPorIdx[idx]=posicoes[k]; });

    /* ritmo: agrupa por measure+beat — mesma chave/critério do byBeat da pauta
       (e.measure, e.beat, e.code já existem em events, nada recalculado do
       zero). suprimidos reaproveitado: nota sem glifo também não tem haste.
       Nunca mistura trilhas — cada trilha agrupa só as PRÓPRIAS notas. */
    const notasRitmo = idxNotas.filter(idx=>!suprimidos.has(idx));
    const gruposRitmo = {};
    notasRitmo.forEach(idx=>{
      const e=events[idx], chave=e.measure+'_'+e.beat;
      (gruposRitmo[chave]=gruposRitmo[chave]||[]).push(idx);
    });

    return {t, corda:tr.corda, events, idxNotas, idxPausas, posicoes, posPorIdx, tabHalos, ligaduras, suprimidos, gruposRitmo};
  });

  if(!measureBoxes.length || porTrilha.every(pt=>!pt.idxNotas.length&&!pt.idxPausas.length))
    return {tracksTabHalos: porTrilha.map(pt=>pt.tabHalos), warns};

  /* aviso (não-bloqueio) de colisão de corda: 2+ trilhas ocupando a MESMA corda no
     MESMO instante (measure+beat) — fisicamente impossível no violão real. v1 só
     avisa, não tenta evitar automaticamente (evitar exigiria alimentar a busca
     heurística com uma lista de cordas proibidas por instante — fora de escopo). */
  if(porTrilha.length>1){
    const ocupacao={};
    porTrilha.forEach(pt=>pt.idxNotas.forEach(idx=>{
      const e=pt.events[idx], p=pt.posPorIdx[idx];
      const chave=e.measure+'_'+e.beat+'_'+p.corda;
      (ocupacao[chave]=ocupacao[chave]||new Set()).add(pt.t);
    }));
    Object.entries(ocupacao).forEach(([chave,trilhasEnvolvidas])=>{
      if(trilhasEnvolvidas.size>1){
        const [mi,beat]=chave.split('_');
        warns.push(`Compasso ${+mi+1}, tempo ${+beat+1}: mais de uma voz ocupando a mesma corda ao mesmo tempo — sobreposição fisicamente impossível no violão.`);
      }
    });
  }

  /* direção de haste ENTRE trilhas simultâneas (2+): a nota mais grave entre as
     vozes que soam no MESMO instante (measure+beat) recebe haste pra baixo, as
     outras pra cima — mesma regra da pauta (renderer.js), aplicada só quando há
     de fato mais de 1 trilha soando junto naquele tempo. Dentro de 1 trilha só
     (melodia única, sem outra voz simultânea naquele tempo), direcaoHaste(corda)
     continua decidindo sozinho, sem mudança nenhuma. -1=cima, 1=baixo (mesma
     convenção de direcaoHaste). */
  const forcaDirecao = new Map(); // chave "t_idx" -> -1|1
  if(porTrilha.length>1){
    const porBeatCruzado={};
    porTrilha.forEach(pt=>pt.idxNotas.forEach(idx=>{
      const e=pt.events[idx], chave=e.measure+'_'+e.beat;
      (porBeatCruzado[chave]=porBeatCruzado[chave]||[]).push({t:pt.t,idx,midi:e.midi});
    }));
    Object.values(porBeatCruzado).forEach(grupo=>{
      if(new Set(grupo.map(g=>g.t)).size<2) return; // só 1 trilha nesse tempo — não força nada
      const menor=grupo.reduce((a,b)=>b.midi<a.midi?b:a);
      grupo.forEach(g=>forcaDirecao.set(g.t+'_'+g.idx, g===menor?1:-1));
    });
  }

  /* volta (casa 1/2): início/fim REAIS de cada casa, comparando com o compasso
     vizinho no array inteiro — igual ao renderer.js, independe de linha */
  const voltaInfo = measures.map((m,mi)=>{
    if(!m.volta) return null;
    const prev=measures[mi-1]||{}, next=measures[mi+1]||{};
    return { first: prev.volta!==m.volta, last: next.volta!==m.volta };
  });

  const ALT=15, PAD=22, STEM_H=22;
  const nomesCordas = INSTRUMENTOS[INSTRUMENTO_ATUAL].nomes;
  const nLines = Math.ceil(measureBoxes.length/perLine);

  for(let line=0; line<nLines; line++){
    const lineTop = topY + line*rowH;
    const linhaY = corda => lineTop + PAD + (N_CORDAS-1-corda)*ALT;

    const mStart = line*perLine, mEnd = Math.min(mStart+perLine, measureBoxes.length)-1;
    const xIni = measureBoxes[mStart].x - 32;
    const xFim = measureBoxes[mEnd].x + measureBoxes[mEnd].width;

    let frag = '';
    if(line===0){
      if(compasso){
        const partes=compasso.split('/');
        frag += `<text x="${xIni}" y="${lineTop-2}" font-size="15" font-weight="700" fill="#222" font-family="Georgia, serif">${partes[0]||''}</text>`;
        frag += `<text x="${xIni+16}" y="${lineTop-2}" font-size="15" font-weight="700" fill="#222" font-family="Georgia, serif">/${partes[1]||''}</text>`;
      }
      if(armadura) frag += `<text x="${xIni+50}" y="${lineTop-4}" font-size="11" fill="${texto}" font-family="IBM Plex Mono, monospace">${armadura}</text>`;
      if(modo==='caged') frag += `<text x="${xFim-120}" y="${lineTop-4}" font-size="11" fill="${texto}" font-family="IBM Plex Mono, monospace" font-weight="600">Desenho ${CAGED_SHAPES[INSTRUMENTO_ATUAL][shape].nome}</text>`;
    }

    for(let c=0;c<N_CORDAS;c++){
      const y=linhaY(c);
      frag += `<line x1="${xIni}" y1="${y}" x2="${xFim}" y2="${y}" stroke="${linhaCor}" stroke-width="${1.4-c*0.12}"/>`;
      frag += `<text x="${xIni-24}" y="${y+4}" font-size="10" fill="${texto}" font-family="IBM Plex Mono, monospace" font-weight="600">${nomesCordas[c]}</text>`;
    }
    for(let mi=mStart; mi<=mEnd; mi++){
      const box=measureBoxes[mi];
      const y1=linhaY(N_CORDAS-1)-7, y2=linhaY(0)+7;
      const prevM = mi>mStart ? measures[mi-1] : null;
      if(prevM && prevM.repeatEnd){
        frag += glifoRepeticao(box.x,'end',y1,y2,barraCor);
      }else if(prevM && prevM.endBar){
        frag += glifoBarraFinal(box.x,y1,y2,barraCor);
      }else if(measures[mi].repeatBegin){
        frag += glifoRepeticao(box.x,'begin',y1,y2,barraCor);
      }else{
        frag += `<line x1="${box.x}" y1="${y1}" x2="${box.x}" y2="${y2}" stroke="${barraCor}" stroke-width="1.2"/>`;
      }
    }
    { const mEndM=measures[mEnd], yF1=linhaY(N_CORDAS-1)-7, yF2=linhaY(0)+7;
      if(mEndM.repeatEnd){
        frag += glifoRepeticao(xFim,'end',yF1,yF2,barraCor);
      }else if(mEndM.endBar || mEnd===measures.length-1){
        frag += glifoBarraFinal(xFim,yF1,yF2,barraCor);
      }else{
        frag += `<line x1="${xFim}" y1="${yF1}" x2="${xFim}" y2="${yF2}" stroke="${barraCor}" stroke-width="2"/>`;
      }
    }

    { let segIni=null, segVolta=0;
      const fecharSegmento=(fimMi)=>{
        const x1=measureBoxes[segIni].x, x2=measureBoxes[fimMi].x+measureBoxes[fimMi].width;
        const y=linhaY(N_CORDAS-1)-12;
        const hookIni=voltaInfo[segIni].first, hookFim=voltaInfo[fimMi].last;
        frag += traceVolta(x1,x2,y,hookIni,hookFim,hookIni?segVolta+'.':'',barraCor,texto);
      };
      for(let mi=mStart; mi<=mEnd; mi++){
        const v = measures[mi].volta||0;
        if(v!==segVolta){
          if(segVolta) fecharSegmento(mi-1);
          segIni = v ? mi : null;
          segVolta = v;
        }
      }
      if(segVolta) fecharSegmento(mEnd);
    }

    // ---- Segno / D.S. / Fine / Coda: texto acima do compasso, mesmo padrão dos
    // rótulos de casa (traceVolta) — sem depender de glifo SMuFL.
    for(let mi=mStart; mi<=mEnd; mi++){
      const ms=measures[mi];
      if(!(ms.segno||ms.dalSegno||ms.fine||ms.toCoda||ms.coda)) continue;
      const box=measureBoxes[mi];
      const labels=[];
      if(ms.segno)    labels.push('Segno');
      if(ms.dalSegno) labels.push(ms.fine?'D.S. al Fine':pecaTemCoda?'D.S. al Coda':'D.S.');
      if(ms.fine)     labels.push('Fine');
      if(ms.toCoda)   labels.push('⊕ To Coda');
      if(ms.coda)     labels.push('⊕ Coda');
      labels.forEach((txt,li)=>{
        frag += `<text x="${box.x+2}" y="${lineTop-8-li*11}" font-size="10" font-weight="700" fill="${barraCor}" font-family="IBM Plex Mono, monospace">${txt}</text>`;
      });
    }

    const g=mk('g',{class:'real-tab-line'});
    g.innerHTML=frag;
    svg.appendChild(g);

    // desenha cada trilha nesta linha — todas compartilham a mesma grade de 6 cordas
    porTrilha.forEach(pt=>{
      const {events,idxNotas,idxPausas,posicoes,posPorIdx,tabHalos,ligaduras,suprimidos,gruposRitmo}=pt;
      const anchors=tracksAnchors[pt.t], restAnchors=tracksRestAnchors[pt.t];

      idxNotas.forEach((idx,k)=>{
        const e=events[idx];
        if(Math.floor(e.measure/perLine)!==line) return;
        if(suprimidos.has(idx)) return;
        const p=posicoes[k];
        const cor=RNG_MAPPER.cores[e.letter], forma=RNG_MAPPER.formas[e.deg];
        const cx=anchors[idx] ? anchors[idx].cx : null;
        if(cx==null) return;
        const extra=p.fora?`stroke="#c33" stroke-width="1.4" stroke-dasharray="2,2"`:'';
        const vazado = e.code==='h' || e.code==='w';
        const noteG=mk('g',{transform:`translate(${cx},${linhaY(p.corda)})`,'data-idx':idx,'data-trilha':pt.t});
        const halo=mk('circle',{r:14,fill:cor,opacity:0,'pointer-events':'none'});
        noteG.appendChild(halo);
        noteG.insertAdjacentHTML('beforeend',noteFormNum(forma,cor,10,p.casa,extra,vazado));
        g.appendChild(noteG);
        tabHalos[idx]=halo;
      });

      ligaduras.forEach(idx=>{
        const prox=idx+1;
        const p1=posPorIdx[idx], p2=posPorIdx[prox];
        const cx1=anchors[idx]?anchors[idx].cx:null, cx2=anchors[prox]?anchors[prox].cx:null;
        if(!p1||!p2||cx1==null||cx2==null) return;
        const sist1=Math.floor(events[idx].measure/perLine), sist2=Math.floor(events[prox].measure/perLine);
        if(sist1===line && sist2===line){
          g.insertAdjacentHTML('beforeend', arcoLigadura(cx1,linhaY(p1.corda), cx2,linhaY(p2.corda)));
        }else if(sist1===line){
          g.insertAdjacentHTML('beforeend', arcoLigadura(cx1,linhaY(p1.corda), xFim-6,linhaY(p1.corda)));
        }else if(sist2===line){
          g.insertAdjacentHTML('beforeend', arcoLigadura(xIni+6,linhaY(p2.corda), cx2,linhaY(p2.corda)));
        }
      });

      Object.values(gruposRitmo).forEach(grupo=>{
        if(Math.floor(events[grupo[0]].measure/perLine)!==line) return;
        const xs = grupo.map(idx=>anchors[idx]?anchors[idx].cx:null);
        if(xs.some(x=>x==null)) return;
        const niveis = grupo.map(idx=>nivelFlags(events[idx].code));
        const beamable = grupo.length>1 && niveis.every(n=>n>0);
        const direcaoNota = idx => forcaDirecao.has(pt.t+'_'+idx) ? forcaDirecao.get(pt.t+'_'+idx) : direcaoHaste(posPorIdx[idx].corda);
        if(beamable){
          /* grupo sequencial (não é acorde — cada nota toca em seu instante,
             só dividem 1 beam): direção única decidida pela maioria dos votos
             do grupo (voto = direção forçada por outra trilha simultânea, se
             houver; senão, corda), empate vai pra cima. Todo membro encaixa
             do mesmo lado. */
          const dirsMembros = grupo.map(direcaoNota);
          const cima = dirsMembros.filter(d=>d<0).length;
          const dirGrupo = cima>=dirsMembros.length-cima ? -1 : 1;
          const xsH = xs.map(x=>x+(dirGrupo<0?STEM_DX:-STEM_DX));
          const bases = grupo.map(idx=>linhaY(posPorIdx[idx].corda)+dirGrupo*12);
          const yBeam = dirGrupo<0 ? Math.min(...bases)-STEM_H : Math.max(...bases)+STEM_H;
          grupo.forEach((idx,i)=>g.insertAdjacentHTML('beforeend', desenhaHaste(xsH[i],bases[i],yBeam,0,barraCor)));
          g.insertAdjacentHTML('beforeend', desenhaBeam(xsH[0],xsH[xsH.length-1],yBeam,Math.max(...niveis),barraCor,dirGrupo));
        }else{
          grupo.forEach((idx,i)=>{
            if(events[idx].code==='w') return; // semibreve tradicional: sem haste nenhuma
            const dir = direcaoNota(idx);
            const xH = xs[i]+(dir<0?STEM_DX:-STEM_DX);
            const base = linhaY(posPorIdx[idx].corda)+dir*12;
            g.insertAdjacentHTML('beforeend', desenhaHaste(xH,base,base+dir*STEM_H,niveis[i],barraCor));
          });
        }
      });

      /* pausas: glifo real do VexFlow (zigzag/colchete/bloco), numa linha central
         fixa (entre a 3ª e 4ª corda). Sem haste — diferente de nota, o glifo real
         de pausa já é autossuficiente pra indicar a duração (é o próprio desenho
         que muda por duração, não uma haste com colchete por cima). */
      idxPausas.forEach(idx=>{
        const e=events[idx];
        if(Math.floor(e.measure/perLine)!==line) return;
        const x = restAnchors[idx];
        if(x==null) return;
        const yCentro = linhaY((N_CORDAS-1)/2);
        g.insertAdjacentHTML('beforeend', glifoPausaVexFlow(e.code,x,yCentro,barraCor));
      });
    });
  }

  return {tracksTabHalos: porTrilha.map(pt=>pt.tabHalos), warns};
}
