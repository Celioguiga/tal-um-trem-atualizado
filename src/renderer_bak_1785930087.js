/* =====================================================================
   RENDERIZADOR — VexFlow 4 (glifos Bravura, qualidade de gravura)
   Layout: 4 compassos por sistema, última linha ragged (como LilyPond).
   Modos: "real" (formas RNFG coloridas), "forma" (formas pretas),
          "trad" (pauta tradicional).
===================================================================== */
function renderScore(VF, doc, container, trilhas, opts){
  const {nMeasures,tsNum,tsDen,ts,key,mode,width}=opts;
  const warns=[];
  const NSVG="http://www.w3.org/2000/svg";
  const mk=(t,a)=>{const e=doc.createElementNS(NSVG,t);for(const k in a)e.setAttribute(k,a[k]);return e;};

  const perLine=width<620?2:4;
  const lines=Math.ceil(nMeasures/perLine);
  const titleH=opts.title?64:14;
  /* com 2+ vozes simultâneas na mesma pauta, hastes sobem E descem ao mesmo
     tempo (haste por altura real) e ocupam mais altura vertical do que 1 voz
     jamais ocupa — medido empiricamente (~24px a mais com 2 vozes bem
     separadas); 28px por voz extra dá folga sem exagerar. Trilha única
     (trilhas.length===1) mantém exatamente 126, igual sempre foi. */
  const lineH=126+Math.max(0,trilhas.length-1)*28, top=titleH, mX=4;
  const TAB_H=110, rowH=lineH+TAB_H;  // TAB_H: faixa reservada pra Real Tablatura acima de cada sistema
  const H=top+lines*rowH+30;

  const renderer=new VF.Renderer(container,VF.Renderer.Backends.SVG);
  renderer.resize(width,H);
  const ctx=renderer.getContext();
  const svg=container.querySelector("svg");
  if(opts.title){
    const t=mk("text",{x:width/2,y:30,"text-anchor":"middle","font-size":24,
      fill:"#1d1d1b",style:"font-family:Georgia,'Times New Roman',serif;font-weight:600"});
    t.textContent=opts.title;svg.appendChild(t);
    if(opts.subtitle){
      const s=mk("text",{x:width/2,y:48,"text-anchor":"middle","font-size":10.5,
        fill:"#8a8474","letter-spacing":"1.5",style:"font-family:Georgia,serif"});
      s.textContent=opts.subtitle;svg.appendChild(s);
    }
  }

  const hasKeySig=key.sig!==0;
  const nTrilhas=trilhas.length;
  const tracksStaveNotes=trilhas.map(()=>[]); // paralelo a trilhas[t].events (null p/ nada)
  const allTuplets=[], allBeams=[], measureStaves=[];
  const evIdx=trilhas.map(()=>0);
  /* Segno/D.S./Fine/Coda: alguma peça tem CODA sem estarmos ainda no compasso
     do D.S. — pra decidir o texto certo ("D.S." vs "D.S. al Fine" vs "D.S. al
     Coda") olhamos a peça inteira uma vez, não só o compasso atual. */
  const pecaTemCoda = !!(opts.measures && opts.measures.some(m=>m.coda));

  for(let mi=0;mi<nMeasures;mi++){
    const line=Math.floor(mi/perLine), col=mi%perLine;
    const isLastLine=line===lines-1;
    const inLine=isLastLine?Math.min(perLine,nMeasures-line*perLine):perLine;
    // ragged-last: última linha usa a mesma largura por compasso das cheias
    const fullW=(width-2*mX)/perLine;
    const stW=fullW;
    const stave=new VF.Stave(mX+col*stW, top+line*rowH+TAB_H, stW);
    if(col===0){
      stave.addClef("treble");
      if(hasKeySig)stave.addKeySignature(key.spec);
    }
    if(mi===0)stave.addTimeSignature(ts);
    // ---- estrutura vinda do parser (opts.measures, só da trilha principal): ||: :|| casa 1/2 fim ----
    const ms=(opts.measures&&opts.measures[mi])||{};
    if(ms.repeatBegin)stave.setBegBarType(VF.Barline.type.REPEAT_BEGIN);
    if(ms.repeatEnd)stave.setEndBarType(VF.Barline.type.REPEAT_END);
    else if(ms.endBar||mi===nMeasures-1)stave.setEndBarType(VF.Barline.type.END);
    if(ms.volta){ // casa 1/2 podem abranger vários compassos: BEGIN na 1ª, END na última, MID no meio
      const prev=(opts.measures&&opts.measures[mi-1])||{}, next=(opts.measures&&opts.measures[mi+1])||{};
      const first=prev.volta!==ms.volta, last=next.volta!==ms.volta, T=VF.Volta.type;
      const vt=first&&last?T.BEGIN_END:first?T.BEGIN:last?T.END:T.MID;
      stave.setVoltaType(vt, first?ms.volta+".":"", 0); // rótulo só em BEGIN/BEGIN_END (VexFlow só desenha o nº nesses)
    }
    stave.setContext(ctx).draw();
    measureStaves.push(stave);

    // ---- Segno / D.S. / Fine / Coda: texto acima do compasso, mesmo padrão dos
    // rótulos de casa — sem depender de glifo SMuFL, texto simples já comunica.
    if(ms.segno||ms.dalSegno||ms.fine||ms.toCoda||ms.coda){
      const labels=[];
      if(ms.segno)    labels.push("𝄋 Segno");
      if(ms.dalSegno) labels.push(ms.fine?"D.S. al Fine":pecaTemCoda?"D.S. al Coda":"D.S.");
      if(ms.fine)     labels.push("Fine");
      if(ms.toCoda)   labels.push("⊕ To Coda");
      if(ms.coda)     labels.push("⊕ Coda");
      const lx=stave.getX()+4, ly0=stave.getY()-6;
      labels.forEach((txt,li)=>{
        const t=mk("text",{x:lx,y:ly0-li*12,"font-size":11,"font-weight":700,
          fill:"#333",style:"font-family:'IBM Plex Mono',monospace"});
        t.textContent=txt;svg.appendChild(t);
      });
    }

    // eventos do compasso, por trilha (1 cursor local por trilha)
    const mEventsPorTrilha=trilhas.map((tr,t)=>{
      const arr=[];while(evIdx[t]<tr.events.length&&tr.events[evIdx[t]].measure===mi)arr.push(tr.events[evIdx[t]++]);
      return arr;
    });

    /* direção de haste: com 1 trilha só, auto_stem tradicional (zero regressão — igual a
       sempre foi). Com 2+ trilhas simultâneas, a nota mais grave entre as vozes que soam
       no MESMO tempo (mesma chave "beat") recebe haste pra baixo, as outras pra cima —
       comparação por altura REAL a cada instante, não por trilha/corda fixa. */
    const stemDown=new Set(); // chaves "t_li" (trilha, índice local em mEventsPorTrilha[t])
    if(nTrilhas>1){
      const porBeat={};
      mEventsPorTrilha.forEach((evs,t)=>evs.forEach((e,li)=>{
        if(e.rest)return;
        (porBeat[e.beat]=porBeat[e.beat]||[]).push({t,li,midi:e.midi});
      }));
      Object.values(porBeat).forEach(grupo=>{
        const menor=grupo.reduce((a,b)=>b.midi<a.midi?b:a);
        stemDown.add(menor.t+"_"+menor.li);
      });
    }

    const trilhaVoices=[]; // {voice,notes,t} só das trilhas com nota neste compasso
    mEventsPorTrilha.forEach((mEvents,t)=>{
      if(!mEvents.length)return;
      const notes=mEvents.map((e,li)=>{
        let n;
        if(e.rest){
          n=new VF.StaveNote({keys:["b/4"],duration:e.code+"r"});
        }else{
          const struct={keys:[e.vfKey],duration:e.code};
          if(nTrilhas>1)struct.stem_direction=stemDown.has(t+"_"+li)?VF.Stem.DOWN:VF.Stem.UP;
          else struct.auto_stem=true;
          n=new VF.StaveNote(struct);
          if(mode!=="trad")n.setKeyStyle(0,{fillStyle:"none",strokeStyle:"none"});
        }
        if(e.dots)for(let d=0;d<e.dots;d++)VF.Dot.buildAndAttach([n],{all:true});
        n.__ev=e;
        return n;
      });
      const voice=new VF.Voice({num_beats:tsNum,beat_value:tsDen}).setMode(VF.Voice.Mode.SOFT);
      voice.addTickables(notes);
      trilhaVoices.push({voice,notes,t});
    });

    if(trilhaVoices.length){
      const voicesOnly=trilhaVoices.map(v=>v.voice);
      // acidentes automáticos conforme armadura + estado do compasso (pro) — todas as vozes
      // do compasso juntas, pro VexFlow resolver cancelamento/repetição entre elas
      VF.Accidental.applyAccidentals(voicesOnly,key.spec);

      // beams e quiálteras por tempo — cada trilha agrupa só as PRÓPRIAS notas (nunca mistura
      // trilhas no mesmo beam/tuplet, mesmo quando caem no mesmo "beat")
      trilhaVoices.forEach(({notes})=>{
        const byBeat={};
        notes.forEach(n=>{(byBeat[n.__ev.beat]=byBeat[n.__ev.beat]||[]).push(n);});
        Object.values(byBeat).forEach(gr=>{
          const e0=gr[0].__ev;
          if(e0.tupletId&&gr.length>1)
            allTuplets.push(new VF.Tuplet(gr,{num_notes:e0.tupletTotal,notes_occupied:e0.tupletOcc}));
          const beamable=gr.length>1&&gr.every(n=>!n.__ev.rest&&["8","16","32","64"].includes(n.__ev.code));
          if(beamable)allBeams.push(new VF.Beam(gr,true));
        });
      });

      new VF.Formatter().joinVoices(voicesOnly)
        .format(voicesOnly,stave.getNoteEndX()-stave.getNoteStartX()-14);
      trilhaVoices.forEach(({voice})=>voice.draw(ctx,stave));
      trilhaVoices.forEach(({notes,t})=>notes.forEach(n=>tracksStaveNotes[t].push(n)));
    }
  }
  allBeams.forEach(b=>b.setContext(ctx).draw());
  allTuplets.forEach(t=>t.setContext(ctx).draw());

  // ---------- ligaduras (StaveTie; cruzando compasso = meias-ligaduras) — por trilha,
  // sempre sobre eventos/staveNotes DA MESMA trilha (nunca mistura índices entre trilhas)
  trilhas.forEach((tr,t)=>{
    const staveNotes=tracksStaveNotes[t], evs=tr.events;
    for(let i=0;i<evs.length;i++){
      const e=evs[i];
      if(e.tie&&!e.rest&&evs[i+1]&&!evs[i+1].rest){
        const a=staveNotes[i],b=staveNotes[i+1];
        try{
          if(e.measure===evs[i+1].measure){
            new VF.StaveTie({first_note:a,last_note:b,first_indices:[0],last_indices:[0]}).setContext(ctx).draw();
          }else{
            new VF.StaveTie({first_note:a,first_indices:[0]}).setContext(ctx).draw();
            new VF.StaveTie({last_note:b,last_indices:[0]}).setContext(ctx).draw();
          }
        }catch(err){warns.push(`Falha ao desenhar ligadura no compasso ${e.measure+1}: ${err.message}`);}
      }
    }
  });

  // ---------- overlay RNFG (formas por grau, cores por nota) — por trilha
  const tracks=trilhas.map((tr,t)=>{
    const anchors=[]; const restAnchors=[];
    tracksStaveNotes[t].forEach((n,i)=>{
      const e=tr.events[i];
      if(e.rest){
        let rx; try{rx=(n.getNoteHeadBeginX()+n.getNoteHeadEndX())/2;}catch(_){rx=n.getAbsoluteX()+5.5;}
        anchors.push(null); restAnchors.push(rx);
        return;
      }
      let cx,cy;
      try{cx=(n.getNoteHeadBeginX()+n.getNoteHeadEndX())/2;}
      catch(_){cx=n.getAbsoluteX()+5.5;}
      cy=n.getYs()[0];
      const cor=RNG_MAPPER.cores[e.letter];
      let g=null;
      if(mode!=="trad"){
        const vazado = e.code==='h' || e.code==='w';
        g=shapeSvg(mk,e.deg,mode==="real"?cor:"#1d1d1b",cx,cy,5.4,vazado);
        g.setAttribute("class","nt");
        svg.appendChild(g);
      }else{
        g=mk("circle",{cx,cy,r:7,fill:"transparent",class:"nt"});
        svg.appendChild(g);
      }
      anchors.push({cx,cy,cor,midi:e.midi,g});
      restAnchors.push(null);
    });
    return {anchors,restAnchors};
  });

  const measureBoxes=measureStaves.map(st=>({x:st.getX(),y:st.getY(),width:st.getWidth()}));
  return {svg,tracks,warns,height:H,measureBoxes,perLine,rowH,TAB_H,top};
}

/* formas RNFG em SVG. vazado=true: só contorno (mínima/semibreve — mesmo
   princípio da cabeça aberta tradicional, espelhando o que a tab já faz). */
function shapeSvg(mk,deg,cor,cx,cy,s,vazado){
  const st = vazado
    ? {fill:"none",stroke:cor,"stroke-width":"1.8"}
    : {fill:cor,stroke:"rgba(0,0,0,.32)","stroke-width":"0.8"};
  const star=(cx,cy,ro,ri)=>{let d="";for(let i=0;i<10;i++){const r=i%2?ri:ro,a=-Math.PI/2+i*Math.PI/5;
    d+=(i?"L":"M")+(cx+r*Math.cos(a)).toFixed(2)+","+(cy+r*Math.sin(a)).toFixed(2);}return d+"Z";};
  const hex=(cx,cy,r)=>{let d="";for(let i=0;i<6;i++){const a=-Math.PI/2+i*Math.PI/3;
    d+=(i?"L":"M")+(cx+r*Math.cos(a)).toFixed(2)+","+(cy+r*Math.sin(a)).toFixed(2);}return d+"Z";};
  switch(RNG_MAPPER.formas[deg]){
    case "circulo":  return mk("circle",{cx,cy,r:s*0.98,...st});
    case "ogiva":{   // ogiva dupla horizontal: dois arcos, pontas agudas nas laterais
      const w=s*1.38,h=s*0.95;
      return mk("path",{d:`M ${cx-w},${cy} Q ${cx},${cy-2*h} ${cx+w},${cy} Q ${cx},${cy+2*h} ${cx-w},${cy} Z`,...st});}
    case "triangulo":return mk("path",{d:`M ${cx},${cy-s*1.14} L ${cx+s*1.06},${cy+s*0.84} L ${cx-s*1.06},${cy+s*0.84} Z`,...st});
    case "quadrado": return mk("rect",{x:cx-s*0.88,y:cy-s*0.88,width:s*1.76,height:s*1.76,...st});
    case "estrela":  return mk("path",{d:star(cx,cy,s*1.26,s*0.52),...st});
    case "hexagono":{ // hexágono deitado (vértices nas laterais), mesma dimensão da ogiva
      const w=s*1.38,h=s*0.92;
      return mk("path",{d:`M ${cx-w},${cy} L ${cx-w/2},${cy-h} L ${cx+w/2},${cy-h} L ${cx+w},${cy} L ${cx+w/2},${cy+h} L ${cx-w/2},${cy+h} Z`,...st});}
    case "casinha":{ // casinha com beiral: corpo largo, telhado baixo, abas evidentes
      const bw=s*0.84,ew=s*1.46,ey=cy-s*0.34,bh=cy+s*0.98,ap=cy-s*1.12;
      return mk("path",{d:`M ${cx-bw},${bh} L ${cx-bw},${ey} L ${cx-ew},${ey} L ${cx},${ap} L ${cx+ew},${ey} L ${cx+bw},${ey} L ${cx+bw},${bh} Z`,...st});}
  }
}

if(typeof module!=="undefined")module.exports={renderScore,shapeSvg};
