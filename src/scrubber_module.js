/* =====================================================================
   SCRUBBER_MODULE — modo de rolagem contínua (estilo Synthesia).
   Cola no build.py junto dos outros módulos (depois de core.js/
   rng_tab_module.js/renderer.js — usa renderScore, desenhaTabInline e
   RNG_MAPPER que já existem ali).

   Reaproveita renderScore()/desenhaTabInline() como já estão — não altera
   nenhum dos dois (só um campo novo e opcional em renderScore.js,
   perLineOverride, que não muda nada quando ausente). Modo paginado
   continua 100% como está.

   IDEIA: em vez de desenhar os compassos como ESCRITOS (com símbolo de
   repetição/D.S.), desenrola a peça pra ordem REAL de playback
   (unfoldRepeats) — uma seção repetida vira 2 cópias de compassos lado a
   lado, numa linha só, bem larga. O container rola sozinho durante o play,
   sempre mantendo a nota atual visível.
===================================================================== */

/* clona 1 trilha, remapeando measure/events pra ordem de playback.
   ordem = array de índices de compasso ORIGINAL, na sequência tocada
   (saída de unfoldRepeats). Repetição/casa/D.S. perdem sentido já
   desenrolados — removidos (repeatBegin/repeatEnd/volta); Segno/D.S./
   Fine/To Coda/Coda continuam como rótulo informativo onde caírem. */
function desenrolarTrilha(tr, ordem){
  const porCompasso = {};
  tr.events.forEach(e=>{ (porCompasso[e.measure]=porCompasso[e.measure]||[]).push(e); });
  const eventsNovos = [];
  const measuresNovos = ordem.map((origMi, novoMi)=>{
    const origM = tr.measures[origMi] || {beats:[]};
    (porCompasso[origMi]||[]).forEach(e=>{
      eventsNovos.push(Object.assign({}, e, {measure:novoMi}));
    });
    return {
      beats: origM.beats,
      repeatBegin:false, repeatEnd:false, volta:0,
      endBar: novoMi===ordem.length-1,
      segno: !!origM.segno, dalSegno: !!origM.dalSegno,
      fine: !!origM.fine, toCoda: !!origM.toCoda, coda: !!origM.coda,
    };
  });
  return { corda: tr.corda, measures: measuresNovos, events: eventsNovos, warns: [] };
}

/* largura por compasso na linha única — arbitrário, dá espaço suficiente
   pra 4 semicolcheias com haste sem espremer. Ajustável se ficar apertado
   com peças de ritmo muito denso. */
const SCRUB_MEASURE_W = 170;

/* monta o SVG do modo scrubber dentro de `container`. Espelha o que
   render() já faz no modo paginado, só que com a sequência desenrolada
   numa linha só e width calculado pra caber tudo (gera scroll horizontal).

   trilhas    — lastTracks (formato de sempre, ordem ESCRITA)
   ordem      — lastPlayOrder (saída de unfoldRepeats sobre a trilha principal)
   opts       — { title, subtitle, tsNum, tsDen, ts, key, mode, tonicaPc,
                  compasso, armadura, tabOpts }
   Retorna: { out, trilhasDesenroladas, tracksTabHalos, tabWarns }
   (out = mesmo retorno de renderScore: svg, tracks/anchors, measureBoxes...) */
function renderScrubber(VF, doc, mk, container, trilhas, ordem, opts){
  const trilhasDesenroladas = trilhas.map(tr=>desenrolarTrilha(tr, ordem));
  const nMeasures = ordem.length;
  const width = Math.max(nMeasures*SCRUB_MEASURE_W, container.clientWidth||760);

  const out = renderScore(VF, doc, container, trilhasDesenroladas, Object.assign({}, opts, {
    nMeasures,
    measures: trilhasDesenroladas[0].measures,
    width,
    perLineOverride: nMeasures,
  }));

  let tabWarns=[], tracksTabHalos=trilhasDesenroladas.map(()=>[]);
  try{
    const tabResult = desenhaTabInline(
      out.svg, mk, trilhasDesenroladas,
      out.tracks.map(t=>t.anchors), out.tracks.map(t=>t.restAnchors),
      out.measureBoxes, trilhasDesenroladas[0].measures,
      out.perLine, out.rowH, out.TAB_H, out.top,
      opts.tonicaPc, Object.assign({compasso:opts.compasso, armadura:opts.armadura}, opts.tabOpts)
    );
    tracksTabHalos = tabResult.tracksTabHalos;
    tabWarns = tabResult.warns;
  }catch(err){
    console.error("Real Tablatura (scrubber):", err);
  }

  return { out, trilhasDesenroladas, tracksTabHalos, tabWarns };
}

/* schedule específico do modo scrubber: mais simples que o schedule()
   original (app.js) porque a trilha desenrolada JÁ está na ordem física
   de execução — não precisa reconstituir via lastPlayOrder/sequenciaExecutada,
   só percorrer events na ordem em que estão. Mesma lógica de ligadura
   (~ com mesma nota = funde ataque, não retoca) que o schedule original. */
function scheduleDesenrolado(trilhasDesenroladas, bpm){
  const spb = 60/(bpm||80);
  const out = []; const totais = [];
  trilhasDesenroladas.forEach((tr,t)=>{
    const ev = tr.events;
    let time=0.06; const skip=new Set();
    for(let k=0;k<ev.length;k++){
      if(skip.has(k)){ continue; }
      const e=ev[k];
      if(!e.rest){
        let dur=e.beats, j=k;
        while(ev[j]&&ev[j].tie&&ev[j].sameTie&&j+1<ev.length){
          dur+=ev[j+1].beats; skip.add(j+1); j++;
        }
        out.push({time, midi:e.midi, dur:dur*spb, idx:k, track:t});
      }
      time += e.beats*spb;
    }
    totais.push(time);
  });
  out.sort((a,b)=>a.time-b.time);
  return {sched:out, total: totais.length?Math.max(...totais):0};
}

/* rola `container` horizontalmente pra manter `cx` (posição X da nota
   atual) numa faixa fixa perto da borda esquerda (ANCORA_FRAC da largura
   visível) — sensação de "a música anda, você fica parado olhando",
   igual Synthesia/piano-roll. Só rola se precisar (evita jitter de rolar
   a cada nota quando já está visível na posição certa). */
const SCRUB_ANCORA_FRAC = 0.18;
function acompanharScrubber(container, cx, suave){
  const alvo = Math.max(0, cx - container.clientWidth*SCRUB_ANCORA_FRAC);
  if(Math.abs(container.scrollLeft-alvo) < 4) return false;
  container.scrollTo({left:alvo, behavior: suave?'smooth':'auto'});
  return true;
}

if(typeof module!=="undefined")
  module.exports = { desenrolarTrilha, renderScrubber, scheduleDesenrolado, acompanharScrubber, SCRUB_MEASURE_W };
