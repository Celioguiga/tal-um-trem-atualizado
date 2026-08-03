/* ===================== APP ===================== */
const VF=Vex.Flow;
let lastTracks=[],lastPlayOrder=[],halos=[],tabHalos=[],synth=null;
let layoutAtual=null,autoScrollAtivo=true,scrollProgramatico=false,scrollProgramaticoT=null;
const $=id=>document.getElementById(id);
const getMode=()=>document.querySelector('input[name="modo"]:checked').value;
const KEY_LABEL={C:"Dó maior",G:"Sol maior",D:"Ré maior",A:"Lá maior",E:"Mi maior",F:"Fá maior",
  Bb:"Si♭ maior",Eb:"Mi♭ maior",Am:"Lá menor",Em:"Mi menor",Bm:"Si menor",Dm:"Ré menor",Gm:"Sol menor",Cm:"Dó menor"};
const mkEl=(t,a)=>{const e=document.createElementNS("http://www.w3.org/2000/svg",t);
  for(const k in a)e.setAttribute(k,a[k]);return e;};

/* ---- Real Tablatura: tom -> pitch class da tônica, e leitura do <select> ---- */
function tonicaPc(key){
  return (SEMI[key.tonicLetter] + sigAlter(key.tonicLetter, key.sig) + 12) % 12;
}
function getTabOpts(){
  const v=$("selModoTab").value;
  return v==='proxima' ? {modo:'proxima'} : {modo:'caged', shape:v};
}

(function(){const d=$("markDots");
  for(const L of LETTERS){const i=document.createElement("i");i.style.background=RNG_MAPPER.cores[L];d.appendChild(i);}})();

function buildLegend(){
  const key=keyInfo($("tom").value);
  const box=$("legenda");box.innerHTML="";
  for(let g=1;g<=7;g++){
    const p=degreeToPitch(g,0,0,key);
    const alt=sigAlter(p.letter,key.sig);
    const chip=document.createElement("div");chip.className="chip";
    const svg=mkEl("svg",{width:16,height:16,viewBox:"0 0 16 16"});
    svg.appendChild(shapeSvg(mkEl,g,RNG_MAPPER.cores[p.letter],8,8.4,5.4));
    chip.appendChild(svg);
    const t=document.createElement("span");
    t.textContent=g+" "+RNG_MAPPER.nomes[p.letter]+(alt>0?"♯":alt<0?"♭":"");
    chip.appendChild(t);box.appendChild(chip);
  }
}

function render(){
  stopPlayback();
  buildLegend();
  const av=$("avisos");av.innerHTML="";
  const box=$("score");box.innerHTML="";
  halos=[];tabHalos=[];

  const titulo=$("titulo").value.trim()||"Sem Título";
  const ts=$("compasso").value, [tsNum,tsDen]=ts.split("/").map(Number);
  const bpm=+$("andamento").value||80;
  const key=keyInfo($("tom").value);

  const parsedV=parseVozes($("cromus").value,tsNum,tsDen,key);
  if(parsedV.fatal.length){
    lastTracks=[];lastPlayOrder=[];
    av.innerHTML=parsedV.fatal.map(f=>'<span class="err">'+f+'</span>').join("<br>");
    return;
  }
  lastTracks=parsedV.trilhas;
  lastPlayOrder=unfoldRepeats(lastTracks[0].measures);
  if(!lastTracks.some(tr=>tr.events.length)){av.innerHTML='<span class="err">Nada para renderizar — confira a sintaxe.</span>';return;}

  const armaduraLabel = KEY_LABEL[$("tom").value] + " · " + (key.sig>0 ? key.sig+'♯' : key.sig<0 ? (-key.sig)+'♭' : 'sem alteração');

  const width=Math.max(box.clientWidth||760,560);
  let out;
  try{
    out=renderScore(VF,document,box,lastTracks,{
      nMeasures:lastTracks[0].measures.length,measures:lastTracks[0].measures,tsNum,tsDen,ts,key,mode:getMode(),width,
      title:titulo,subtitle:`${ts} · ♩=${bpm} · ${KEY_LABEL[$("tom").value]} · Synemusic`});
  }catch(err){
    av.innerHTML='<span class="err">Erro na gravura: '+err.message+"</span>";return;
  }
  layoutAtual=out;

  let tabWarns=[];
  try{
    const tabResult=desenhaTabInline(out.svg, mkEl, lastTracks, out.tracks.map(t=>t.anchors), out.tracks.map(t=>t.restAnchors), out.measureBoxes, lastTracks[0].measures, out.perLine, out.rowH, out.TAB_H, out.top, tonicaPc(key), Object.assign({compasso: ts, armadura: armaduraLabel}, getTabOpts()));
    tabHalos=tabResult.tracksTabHalos;
    tabWarns=tabResult.warns;
  }catch(err){
    console.error("Real Tablatura:", err);
    tabHalos=lastTracks.map(()=>[]);
  }

  out.tracks.forEach((trackOut,t)=>{
    halos[t]=[];
    trackOut.anchors.forEach((a,i)=>{
      if(!a)return;
      const h=mkEl("circle",{cx:a.cx,cy:a.cy,r:11,fill:a.cor,opacity:0,"pointer-events":"none"});
      out.svg.insertBefore(h,out.svg.firstChild);
      halos[t][i]=h;
      if(a.g)a.g.addEventListener("click",async()=>{
        await Tone.start();ensureSynth();
        synth.triggerAttackRelease(Tone.Frequency(a.midi,"midi"),0.4);
        h.setAttribute("opacity",".28");setTimeout(()=>h.setAttribute("opacity","0"),350);
      });
    });
  });

  const ws=lastTracks.flatMap(tr=>tr.warns).concat(out.warns).concat(tabWarns);
  if(ws.length)av.innerHTML=ws.map(w=>"⚠ "+w).join("<br>");
}

/* ---------- playback ---------- */
function pintarHalo(t,idx,op){
  const h=halos[t]&&halos[t][idx];if(h)h.setAttribute("opacity",op);
  const th=tabHalos[t]&&tabHalos[t][idx];if(th)th.setAttribute("opacity",op);
}
/* rola #score pra manter a nota atual visível — só mexe se o alvo já não
   estiver dentro da área visível (modo "página", não segue nota a nota).
   Só a trilha principal (t=0) governa o scroll — decisão fechada: com N
   trilhas tocando, seguir onsets de vozes diferentes geraria scroll instável;
   trilhas extras continuam acendendo halo normalmente, só não disparam scroll. */
function acompanharScroll(idx){
  if(!autoScrollAtivo||!layoutAtual)return;
  const a=layoutAtual.tracks[0].anchors[idx];if(!a)return;
  const box=$("score");
  const line=Math.floor(lastTracks[0].events[idx].measure/layoutAtual.perLine);
  const yTop=layoutAtual.top+line*layoutAtual.rowH, yBottom=yTop+layoutAtual.rowH;
  let novoTop=box.scrollTop, novoLeft=box.scrollLeft, precisa=false;
  if(yTop<box.scrollTop||yBottom>box.scrollTop+box.clientHeight){novoTop=yTop;precisa=true;}
  if(a.cx<box.scrollLeft||a.cx>box.scrollLeft+box.clientWidth){novoLeft=Math.max(0,a.cx-40);precisa=true;}
  if(!precisa)return;
  scrollProgramatico=true;
  box.scrollTo({top:novoTop,left:novoLeft,behavior:"smooth"});
  clearTimeout(scrollProgramaticoT);
  scrollProgramaticoT=setTimeout(()=>{scrollProgramatico=false;},1000);
}
/* PolySynth (não Synth simples) — precisa sobrepor ataques quando 2+ trilhas
   soam ao mesmo tempo; mesma assinatura de triggerAttackRelease, sem mudar
   nenhum outro call site. Ver também o segundo ponto em exportWav(). */
function ensureSynth(){if(!synth)synth=new Tone.PolySynth(Tone.Synth,{oscillator:{type:"triangle"},
  envelope:{attack:0.01,decay:0.12,sustain:0.55,release:0.25}}).toDestination();}
/* sequência de OCORRÊNCIAS pra tocar, de UMA trilha: cada compasso de
   lastPlayOrder (ordem executada — repete corpo, pula casa da passada errada,
   sempre calculada só a partir da trilha principal) vira a lista de índices
   de lastTracks[t].events que pertencem a ele, na ordem escrita. */
function sequenciaExecutada(t){
  const events=lastTracks[t].events;
  const porCompasso={};
  events.forEach((e,i)=>{(porCompasso[e.measure]=porCompasso[e.measure]||[]).push(i);});
  const seq=[];
  (lastPlayOrder&&lastPlayOrder.length?lastPlayOrder:Object.keys(porCompasso).map(Number))
    .forEach(mi=>{(porCompasso[mi]||[]).forEach(idx=>seq.push(idx));});
  return seq;
}
/* 1 cursor de tempo LOCAL por trilha (tocam em paralelo, não em série) —
   mesclados numa lista única de onsets ordenada por tempo absoluto. total da
   peça = a trilha mais longa (Math.max), não a soma. */
function schedule(){
  const bpm=+$("andamento").value||80, spb=60/bpm;
  const out=[]; const totais=[];
  lastTracks.forEach((tr,t)=>{
    const seq=sequenciaExecutada(t);
    let time=0.06; const skip=new Set();
    for(let k=0;k<seq.length;k++){
      const idx=seq[k], e=tr.events[idx];
      if(!e.rest&&!skip.has(k)){
        let dur=e.beats,j=k;
        while(tr.events[seq[j]].tie&&tr.events[seq[j]].sameTie&&j+1<seq.length){
          dur+=tr.events[seq[j+1]].beats;skip.add(j+1);j++;}
        out.push({time,midi:e.midi,dur:dur*spb,idx,track:t});
      }
      time+=e.beats*spb;
    }
    totais.push(time);
  });
  out.sort((a,b)=>a.time-b.time);
  return {sched:out,total:totais.length?Math.max(...totais):0};
}
function stopPlayback(){
  try{Tone.Transport.stop();Tone.Transport.cancel();}catch(_){}
  lastTracks.forEach((tr,t)=>{for(let i=0;i<tr.events.length;i++)pintarHalo(t,i,"0");});
}
async function play(){
  if(!lastTracks.length||!lastTracks.some(tr=>tr.events.length))return;
  await Tone.start();stopPlayback();ensureSynth();
  autoScrollAtivo=true;
  const {sched,total}=schedule();
  sched.forEach(s=>{
    Tone.Transport.scheduleOnce(time=>{
      synth.triggerAttackRelease(Tone.Frequency(s.midi,"midi"),s.dur*0.92,time);
      Tone.Draw.schedule(()=>{pintarHalo(s.track,s.idx,".26");if(s.track===0)acompanharScroll(s.idx);},time);
      Tone.Draw.schedule(()=>pintarHalo(s.track,s.idx,"0"),time+s.dur*0.9);
    },s.time);
  });
  Tone.Transport.scheduleOnce(()=>stopPlayback(),total+0.4);
  Tone.Transport.start();
}

/* ---------- código da cantiga ---------- */
function toCode(){
  return `@titulo: ${$("titulo").value}\n@compasso: ${$("compasso").value}\n@tom: ${$("tom").value}\n@andamento: ${$("andamento").value}\n\n${$("cromus").value}`;
}
function fromCode(code){
  /* cabeçalho (@titulo/@compasso/@tom/@andamento) só é reconhecido ANTES da 1ª linha em
     branco — depois disso tudo é corpo Cromus verbatim, mesmo que alguma linha comece com
     "@algo:" (ex.: um futuro marcador de voz "@corda6:" dentro da sintaxe). Sem essa trava,
     uma linha assim no corpo seria capturada como metadado desconhecido e desaparecia. */
  const lines=code.split("\n");const body=[];let emCabecalho=true;
  const compassosValidos=[...document.querySelectorAll("#compasso option")].map(o=>o.value);
  for(const ln of lines){
    if(emCabecalho&&ln.trim()===""){emCabecalho=false;body.push(ln);continue;}
    const m=emCabecalho&&ln.match(/^@(\w+):\s*(.+)$/);
    if(m){const k=m[1],v=m[2].trim();
      if(k==="titulo")$("titulo").value=v;
      else if(k==="compasso"&&compassosValidos.includes(v))$("compasso").value=v;
      else if(k==="tom"&&KEYS[v]!==undefined)$("tom").value=v;
      else if(k==="andamento")$("andamento").value=parseInt(v)||80;
    }else body.push(ln);
  }
  const cr=body.join("\n").trim();
  if(cr)$("cromus").value=cr;
  render();
}
function download(name,blob){
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
const slug=()=>($("titulo").value.trim()||"cantiga").toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");

/* ---------- WAV (render offline) ---------- */
async function exportWav(){
  if(!lastTracks.length||!lastTracks.some(tr=>tr.events.length))return;
  const btn=$("btnWav");btn.disabled=true;btn.textContent="Gerando…";
  try{
    const {sched,total}=schedule();
    const buf=await Tone.Offline(()=>{
      /* mesmo PolySynth de ensureSynth() — se só um dos dois pontos trocar,
         o playback ao vivo fica polifônico mas o WAV sai truncado/monofônico
         em silêncio, sem erro nenhum. */
      const s=new Tone.PolySynth(Tone.Synth,{oscillator:{type:"triangle"},
        envelope:{attack:0.01,decay:0.12,sustain:0.55,release:0.25}}).toDestination();
      sched.forEach(e=>s.triggerAttackRelease(Tone.Frequency(e.midi,"midi"),e.dur*0.92,e.time));
    },total+0.8);
    download(slug()+".wav",new Blob([toWav(buf.get())],{type:"audio/wav"}));
  }catch(err){$("avisos").innerHTML='<span class="err">Falha ao gerar WAV: '+err.message+"</span>";}
  btn.disabled=false;btn.textContent="WAV";
}
function toWav(ab){
  const ch=Math.min(ab.numberOfChannels,2),sr=ab.sampleRate,len=ab.length;
  const data=new DataView(new ArrayBuffer(44+len*ch*2));
  const ws=(o,s)=>{for(let i=0;i<s.length;i++)data.setUint8(o+i,s.charCodeAt(i));};
  ws(0,"RIFF");data.setUint32(4,36+len*ch*2,true);ws(8,"WAVE");ws(12,"fmt ");
  data.setUint32(16,16,true);data.setUint16(20,1,true);data.setUint16(22,ch,true);
  data.setUint32(24,sr,true);data.setUint32(28,sr*ch*2,true);
  data.setUint16(32,ch*2,true);data.setUint16(34,16,true);ws(36,"data");
  data.setUint32(40,len*ch*2,true);
  let o=44;
  for(let i=0;i<len;i++)for(let c=0;c<ch;c++){
    let v=Math.max(-1,Math.min(1,ab.getChannelData(c)[i]));
    data.setInt16(o,v<0?v*0x8000:v*0x7FFF,true);o+=2;}
  return data.buffer;
}

/* ---------- eventos de UI ---------- */
$("btnRender").addEventListener("click",render);
$("btnPlay").addEventListener("click",play);
$("btnStop").addEventListener("click",stopPlayback);
$("btnPdf").addEventListener("click",()=>window.print());
$("btnSvg").addEventListener("click",()=>{
  const s=$("score").querySelector("svg");if(!s)return;
  download(slug()+".svg",new Blob([new XMLSerializer().serializeToString(s)],{type:"image/svg+xml"}));
});
$("btnSalvar").addEventListener("click",()=>download(slug()+".cromus.txt",new Blob([toCode()],{type:"text/plain"})));
$("btnAbrir").addEventListener("click",()=>$("fileInput").click());
$("fileInput").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>fromCode(r.result);r.readAsText(f);e.target.value="";
});
$("btnWav").addEventListener("click",exportWav);
$("btnCodigo").addEventListener("click",()=>{$("txtCodigo").value=toCode();$("dlgCodigo").showModal();});
$("btnFechar").addEventListener("click",()=>$("dlgCodigo").close());
$("btnCopiar").addEventListener("click",async()=>{
  try{await navigator.clipboard.writeText($("txtCodigo").value);
    $("btnCopiar").textContent="Copiado ✓";setTimeout(()=>$("btnCopiar").textContent="Copiar",1500);}catch(_){}
});
$("btnImportar").addEventListener("click",()=>{fromCode($("txtCodigo").value);$("dlgCodigo").close();});

["compasso","tom","andamento","titulo"].forEach(id=>$(id).addEventListener("change",render));
document.querySelectorAll('input[name="modo"]').forEach(r=>r.addEventListener("change",render));
let deb;$("cromus").addEventListener("input",()=>{clearTimeout(deb);deb=setTimeout(render,600);});
$("cromus").addEventListener("keydown",e=>{if((e.metaKey||e.ctrlKey)&&e.key==="Enter"){e.preventDefault();render();}});
let rsz;window.addEventListener("resize",()=>{clearTimeout(rsz);rsz=setTimeout(render,250);});
window.addEventListener("load",render);


/* listener do seletor de tablatura (Real Tablatura) */
document.getElementById("selModoTab").addEventListener("change", render);

/* auto-scroll: se o usuário rolar #score manualmente durante o playback
   (scroll não disparado por acompanharScroll), desliga o auto-scroll até
   o próximo play() reativar do zero */
$("score").addEventListener("scroll",()=>{ if(!scrollProgramatico) autoScrollAtivo=false; });
