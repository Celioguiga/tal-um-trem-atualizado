p = "/root/pro_studio_deploy/src/rng_tab_module.js"
s = open(p, encoding="utf-8").read()

marker = "function desenhaTab(destino, events, tonicaPc, opts){"
assert marker in s, "função desenhaTab não encontrada"
inicio = s.index(marker)
s = s[:inicio]

s += '''function desenhaTab(destino, events, tonicaPc, opts){
  opts = opts || {};
  const modo = opts.modo || 'proxima';
  const shape = opts.shape || 'E';
  const compasso = opts.compasso || '';       // ex: "2/4"
  const armadura = opts.armadura || '';       // ex: "Sol maior · 1♯"
  const linha='#999', texto='#666', fundo='#ffffff', barra='#333';

  const notas = events.filter(e => !e.rest);
  if(!notas.length){ destino.innerHTML=''; return; }
  const pcs = notas.map(pcDoEvento);
  const posicoes = modo==='caged'
    ? posicionaMelodiaCaged(pcs, tonicaPc, shape)
    : posicionaMelodia(pcs);

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
'''

open(p, "w", encoding="utf-8").write(s)
print("desenhaTab(): cabeçalho com compasso + armadura adicionado.")
