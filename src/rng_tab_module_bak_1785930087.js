/* =====================================================================
   RNG_TAB_MODULE — lógica de Real Tablatura.
   Cola LOGO APÓS o bloco RNG_MAPPER no core.js (usa RNG_MAPPER, SEMI
   e LETTERS que já existem ali — NÃO redefine cor/forma, R3 respeitada).
===================================================================== */

/* ---------- violão: afinação padrão, cordas 6ª→1ª, em pitch class ---------- */
const CORDAS = [SEMI.E ?? 4, SEMI.A ?? 9, SEMI.D ?? 2, SEMI.G ?? 7, SEMI.B ?? 11, SEMI.E ?? 4];
const NCASAS = 12;

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
/* modo "mais próxima": minimiza salto de casa/corda nota-a-nota */
function posicionaMelodia(pcs, casaInicial){
  let atual = {corda: 2, casa: casaInicial ?? 0};
  return pcs.map(pc=>{
    const opcoes = posicoesPossiveis(pc);
    let melhor = opcoes[0], custo = Infinity;
    opcoes.forEach(o=>{
      const c = Math.abs(o.casa-atual.casa)*2 + Math.abs(o.corda-atual.corda);
      if(c<custo){custo=c; melhor=o;}
    });
    atual = melhor;
    return {corda:melhor.corda, casa:melhor.casa, pc};
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
function posicionaMelodiaCaged(pcs, tonicaPc, shapeKey){
  const jan = janelaCaged(tonicaPc, shapeKey);
  let atual = {corda: CAGED_SHAPES[shapeKey].corda, casa: jan.min};
  return pcs.map(pc=>{
    let opcoes = posicoesPossiveis(pc).filter(o=>o.casa>=jan.min && o.casa<=jan.max);
    let fora = false;
    if(!opcoes.length){ opcoes = posicoesPossiveis(pc); fora = true; }
    let melhor = opcoes[0], custo = Infinity;
    opcoes.forEach(o=>{
      const c = Math.abs(o.casa-atual.casa)*2 + Math.abs(o.corda-atual.corda);
      if(c<custo){custo=c; melhor=o;}
    });
    atual = melhor;
    return {corda:melhor.corda, casa:melhor.casa, pc, fora};
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
  const claro = !!opts.claro;

  const notas = events.filter(e => !e.rest); // tab não desenha pausa (padrão de tab tradicional)
  const pcs = notas.map(pcDoEvento);
  const posicoes = modo==='caged'
    ? posicionaMelodiaCaged(pcs, tonicaPc, shape)
    : posicionaMelodia(pcs);

  const N = notas.length;
  const X0=70, PASSO=46, X1=X0+(N-1)*PASSO+40;
  const Y0=30, ALT=30, Y1=Y0+5*ALT;
  const linha=claro?'#c9c9c9':'#33363F', texto=claro?'#666':'#9BA0AC', madeira=claro?'#fbfbfb':'#2A2C33';
  const nomesCordas=['Mi','Lá','Ré','Sol','Si','Mi'];
  const linhaY = c => Y0 + (5-c)*ALT;

  let s = `<rect x="${X0-40}" y="${Y0-16}" width="${X1-X0+60}" height="${Y1-Y0+32}" fill="${madeira}" rx="3"/>`;
  if(modo==='caged') s += `<text x="${X0-30}" y="${Y0-22}" fill="${texto}" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="600">Desenho ${CAGED_SHAPES[shape].nome}</text>`;

  for(let c=0;c<6;c++){
    const y = linhaY(c);
    s += `<line x1="${X0-20}" y1="${y}" x2="${X1}" y2="${y}" stroke="${linha}" stroke-width="${1.6-c*0.15}"/>`;
    s += `<text x="${X0-44}" y="${y+5}" fill="${texto}" font-family="IBM Plex Mono, monospace" font-size="14" font-weight="600">${nomesCordas[c]}</text>`;
  }
  posicoes.forEach((p,i)=>{
    const x = X0 + i*PASSO, y = linhaY(p.corda);
    const e = notas[i];
    const cor = RNG_MAPPER.cores[e.letter];
    const forma = RNG_MAPPER.formas[e.deg];
    const extra = p.fora ? `stroke="${claro?'#c33':'#f66'}" stroke-width="1.5" stroke-dasharray="2,2"` : '';
    s += `<g transform="translate(${x},${y})">${noteFormNum(forma, cor, 13, p.casa, extra)}</g>`;
  });

  destino.setAttribute('viewBox', `0 0 ${X1+20} ${Y1+40}`);
  destino.innerHTML = s;
}
