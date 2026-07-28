/* =====================================================================
   RNG_TAB_MODULE — lógica de Real Tablatura.
   Cola LOGO APÓS o bloco RNG_MAPPER no core.js (usa RNG_MAPPER, SEMI
   e LETTERS que já existem ali — NÃO redefine cor/forma, R3 respeitada).
===================================================================== */

/* ---------- violão: afinação padrão, cordas 6ª→1ª, em pitch class ---------- */
const CORDAS = [SEMI.E ?? 4, SEMI.A ?? 9, SEMI.D ?? 2, SEMI.G ?? 7, SEMI.B ?? 11, SEMI.E ?? 4];
/* mesma afinação, em MIDI absoluto (E2 A2 D3 G3 B3 E4) — usada pra bater a oitava exata */
const CORDAS_MIDI = [40, 45, 50, 55, 59, 64];
const NCASAS = 12;
const midiDoCorda = (corda,casa) => CORDAS_MIDI[corda] + casa;

/* pitch class de um evento da pauta (e.letter + e.acc, já vêm do buildScore) */
function pcDoEvento(e){ return ((SEMI[e.letter] ?? 0) + (e.acc||0) + 12) % 12; }

/* ---------- posições possíveis de um pc no braço ---------- */
function posicoesPossiveis(pc, maxCasa){
  maxCasa = maxCasa ?? NCASAS;
  const opcoes = [];
  for(let c=0;c<6;c++) for(let f=0; f<=maxCasa; f++)
    if((CORDAS[c]+f)%12 === pc) opcoes.push({corda:c, casa:f});
  return opcoes;
}
/* escolhe 1 posição dentre as opções, priorizando MIDI exato da nota (oitava
   certa) sobre o menor deslocamento — o deslocamento só desempata entre
   posições que já batem o MIDI exato. Se nenhuma bater, tenta o braço
   inteiro; se ainda assim nenhuma bater, cai pro pc mais próximo (oitava
   possivelmente errada) e marca fora=true. */
function escolherPosicao(pc, alvoMidi, opcoesPreferidas, atual){
  /* violão é transpositor: soa 1 oitava abaixo do escrito na pauta — a busca de
     posição mira no MIDI real do braço, não no MIDI escrito (e.midi) */
  const alvoReal = alvoMidi - 12;
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
  let atual = {corda: 2, casa: casaInicial ?? 0};
  return pcs.map((pc,k)=>{
    const p = escolherPosicao(pc, midis[k], posicoesPossiveis(pc), atual);
    atual = p;
    return p;
  });
}

/* ---------- CAGED: 5 caixas fixas, ancoradas na corda que dá nome ao desenho ----------
   ⚠ Limites aproximados (didática CAGED padrão) — confira 1 desenho contra
   referência antes de validar com aluno. */
const CAGED_SHAPES = {
  C: { nome:'Dó (C)',  corda:1, offsetMin:-3, offsetMax:1 },
  A: { nome:'Lá (A)',  corda:1, offsetMin:-1, offsetMax:3 },
  G: { nome:'Sol (G)', corda:0, offsetMin:-2, offsetMax:2 },
  E: { nome:'Mi (E)',  corda:0, offsetMin:0,  offsetMax:4 },
  D: { nome:'Ré (D)',  corda:2, offsetMin:-2, offsetMax:2 },
};
function casaFundamental(pc, corda){
  for(let f=0; f<=NCASAS; f++) if((CORDAS[corda]+f)%12 === pc) return f;
  return 0;
}
function janelaCaged(tonicaPc, shapeKey){
  const sh = CAGED_SHAPES[shapeKey];
  const base = casaFundamental(tonicaPc, sh.corda);
  return { min: Math.max(0, base+sh.offsetMin), max: Math.min(NCASAS, base+sh.offsetMax) };
}
function posicionaMelodiaCaged(pcs, midis, tonicaPc, shapeKey){
  const jan = janelaCaged(tonicaPc, shapeKey);
  let atual = {corda: CAGED_SHAPES[shapeKey].corda, casa: jan.min};
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
function noteForm(forma, cor, r, extra){
  if(forma==='circulo') return `<circle r="${r}" fill="${cor}" ${extra||''}/>`;
  return `<path d="${pathForma(forma,r)}" fill="${cor}" ${extra||''}/>`;
}
function tintaContraste(hex){
  const h=hex.replace('#',''); const R=parseInt(h.substr(0,2),16),G=parseInt(h.substr(2,2),16),B=parseInt(h.substr(4,2),16);
  return (R*299+G*587+B*114)/1000 > 150 ? '#111' : '#fff';
}
function noteFormNum(forma, cor, r, casa, extra){
  const tinta = tintaContraste(cor);
  const dy = forma==='triangulo' ? r*0.30 : forma==='casinha' ? r*0.34 : 0;
  const fs = (r*1.25).toFixed(1);
  return `${noteForm(forma,cor,r,extra)}<text x="0" y="${(dy+parseFloat(fs)*0.35).toFixed(1)}" font-family="IBM Plex Mono, monospace" font-weight="600" font-size="${fs}" fill="${tinta}" text-anchor="middle">${casa}</text>`;
}
/* arco de ligadura de prolongamento entre 2 posições (mesma linha do braço) */
function arcoLigadura(x1,y1,x2,y2){
  const bulge = Math.max(4, Math.min(10, Math.abs(x2-x1)*0.25));
  const midX = (x1+x2)/2, midY = (y1+y2)/2 - bulge;
  return `<path d="M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}" fill="none" stroke="#999" stroke-width="1.3"/>`;
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

  if(modo==='caged') s += `<text x="${X0-30}" y="${Y0-22}" fill="${texto}" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="600">Desenho ${CAGED_SHAPES[shape].nome}</text>`;

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
function desenhaTabInline(svg, mk, events, anchors, measureBoxes, perLine, rowH, TAB_H, topY, tonicaPc, opts){
  opts = opts || {};
  const modo = opts.modo || 'proxima';
  const shape = opts.shape || 'E';
  const compasso = opts.compasso || '';
  const armadura = opts.armadura || '';
  const texto='#666', linhaCor='#999', barraCor='#333';

  const idxNotas=[]; events.forEach((e,i)=>{ if(!e.rest) idxNotas.push(i); });
  if(!idxNotas.length || !measureBoxes.length) return {tabHalos:[]};
  const pcs = idxNotas.map(i=>pcDoEvento(events[i]));
  const midis = idxNotas.map(i=>events[i].midi);
  const posicoes = modo==='caged'
    ? posicionaMelodiaCaged(pcs, midis, tonicaPc, shape)
    : posicionaMelodia(pcs, midis);
  const tabHalos = new Array(events.length).fill(null);

  /* ligaduras de prolongamento (~ com mesma nota): a 2ª nota some da tela (sem
     glifo, sem halo) e vira só o destino de um arco saindo da 1ª — não duplica
     o ataque, igual ao skip set de schedule() em app.js */
  const ligaduras = idxNotas.filter(idx=>events[idx].tie && events[idx].sameTie);
  const suprimidos = new Set(ligaduras.map(idx=>idx+1));
  const posPorIdx = {}; idxNotas.forEach((idx,k)=>{ posPorIdx[idx]=posicoes[k]; });

  const ALT=15, PAD=22;
  const nomesCordas=['Mi','Lá','Ré','Sol','Si','Mi'];
  const nLines = Math.ceil(measureBoxes.length/perLine);

  for(let line=0; line<nLines; line++){
    const lineTop = topY + line*rowH;
    const linhaY = corda => lineTop + PAD + (5-corda)*ALT;

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
      if(modo==='caged') frag += `<text x="${xFim-120}" y="${lineTop-4}" font-size="11" fill="${texto}" font-family="IBM Plex Mono, monospace" font-weight="600">Desenho ${CAGED_SHAPES[shape].nome}</text>`;
    }

    for(let c=0;c<6;c++){
      const y=linhaY(c);
      frag += `<line x1="${xIni}" y1="${y}" x2="${xFim}" y2="${y}" stroke="${linhaCor}" stroke-width="${1.4-c*0.12}"/>`;
      frag += `<text x="${xIni-24}" y="${y+4}" font-size="10" fill="${texto}" font-family="IBM Plex Mono, monospace" font-weight="600">${nomesCordas[c]}</text>`;
    }
    for(let mi=mStart; mi<=mEnd; mi++){
      const box=measureBoxes[mi];
      frag += `<line x1="${box.x}" y1="${linhaY(5)-7}" x2="${box.x}" y2="${linhaY(0)+7}" stroke="${barraCor}" stroke-width="1.2"/>`;
    }
    frag += `<line x1="${xFim}" y1="${linhaY(5)-7}" x2="${xFim}" y2="${linhaY(0)+7}" stroke="${barraCor}" stroke-width="2"/>`;

    const g=mk('g',{class:'real-tab-line'});
    g.innerHTML=frag;
    svg.appendChild(g);

    idxNotas.forEach((idx,k)=>{
      const e=events[idx];
      if(Math.floor(e.measure/perLine)!==line) return;
      if(suprimidos.has(idx)) return;
      const p=posicoes[k];
      const cor=RNG_MAPPER.cores[e.letter], forma=RNG_MAPPER.formas[e.deg];
      const cx=anchors[idx] ? anchors[idx].cx : null;
      if(cx==null) return;
      const extra=p.fora?`stroke="#c33" stroke-width="1.4" stroke-dasharray="2,2"`:'';
      const noteG=mk('g',{transform:`translate(${cx},${linhaY(p.corda)})`,'data-idx':idx});
      const halo=mk('circle',{r:14,fill:cor,opacity:0,'pointer-events':'none'});
      noteG.appendChild(halo);
      noteG.insertAdjacentHTML('beforeend',noteFormNum(forma,cor,10,p.casa,extra));
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
  }

  return {tabHalos};
}
