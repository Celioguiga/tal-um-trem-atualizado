/* =====================================================================
   RNG MAPPER — espelho de ~/src/mappers/rng_mapper.ts (paleta canônica v2.1)
   ÚNICA fonte de cores e formas (regra R3). Cores fixas por NOTA;
   formas giram com o GRAU (I=círculo, II=ogiva, III=triângulo,
   IV=quadrado, V=estrela, VI=hexágono, VII=casinha).
===================================================================== */
const RNG_MAPPER = {
  nomes:  {C:"Dó",D:"Ré",E:"Mi",F:"Fá",G:"Sol",A:"Lá",B:"Si"},
  cores:  {C:"#C0001A",D:"#ECD200",E:"#F07300",F:"#00B050",G:"#0066FF",A:"#8B5E00",B:"#9B5FC0"},
  formas: {1:"circulo",2:"ogiva",3:"triangulo",4:"quadrado",5:"estrela",6:"hexagono",7:"casinha"}
};
const LETTERS=["C","D","E","F","G","A","B"];
const SEMI={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const KEYS={C:0,G:1,D:2,A:3,E:4,F:-1,Bb:-2,Eb:-3, Am:0,Em:1,Bm:2,Dm:-1,Gm:-2,Cm:-3};
const SHARP_ORDER="FCGDAEB", FLAT_ORDER="BEADGCF";
function keyInfo(v){const minor=v.endsWith("m");const tonic=minor?v.slice(0,-1):v;
  return {spec:v,sig:KEYS[v],tonicLetter:tonic[0],minor};}
function sigAlter(letter,sig){
  if(sig>0&&SHARP_ORDER.indexOf(letter)<sig)return 1;
  if(sig<0&&FLAT_ORDER.indexOf(letter)<-sig)return -1;
  return 0;}
function degreeToPitch(deg,up,down,key){
  const ti=LETTERS.indexOf(key.tonicLetter);const k=ti+deg-1;
  return {letter:LETTERS[k%7],octave:4+up-down+Math.floor(k/7)};}

/* ---------- Parser Sintaxe Cromus (R7) ---------- */
function parseCromus(src){
  const warns=[];let txt=src;
  txt=txt.replace(/[\u2019\u2018`\u00B4]/g,"'");
  /* tokens ESTRUTURAIS consumidos ANTES de parsear notas — viram sentinelas @X@ que
     sobrevivem ao split por "|" (senão ':' e palavras quebram o array -> hastes órfãs). */
  txt=txt.replace(/\|\|:/g," @RB@ ")               // ||:  repeat-begin
         .replace(/:\|\|/g," @RE@ ")               // :||  repeat-end
         .replace(/\(\s*casa\s*1\s*\)/gi," @V1@ ") // (casa 1) volta BEGIN
         .replace(/\(\s*casa\s*2\s*\)/gi," @V2@ ") // (casa 2) volta END
         .replace(/\bfim\b/gi," @END@ ")           // fim -> barra final |.
         .replace(/\|\|/g,"|");                    // barra dupla restante = separador simples
  const measures=[];let lastM=null,pendRB=false,curVolta=0;
  txt.split("|").forEach(chunk=>{
    chunk.split(/(@RB@|@RE@|@V1@|@V2@|@END@)/).forEach(part=>{
      if(part==="@RB@"){pendRB=true;curVolta=0;}
      else if(part==="@V1@")curVolta=1;
      else if(part==="@V2@")curVolta=2;
      else if(part==="@RE@"){if(lastM)lastM.repeatEnd=true;curVolta=0;}
      else if(part==="@END@"){if(lastM)lastM.endBar=true;curVolta=0;}
      else{
        const content=part.trim();if(!content)return;
        const beats=[];
        content.split(",").forEach((bRaw,bi)=>{const b=parseBeat(bRaw,measures.length+1,bi+1,warns);if(b)beats.push(b);});
        const m={beats,repeatBegin:pendRB,repeatEnd:false,volta:curVolta,endBar:false};
        pendRB=false;measures.push(m);lastM=m;
      }
    });
  });
  return {measures,warns};
}
function parseBeat(s,mN,bN,warns){
  const toks=[];let down=0,i=0;
  s=s.replace(/[()]/g," ");
  while(i<s.length){
    const c=s[i];
    if(c===" "||c==="\t"){i++;continue;}
    if(c==="'"){down++;i++;continue;}
    if(c==="-"||c==="0"){
      const t={rest:true,parcels:0};i++;
      while(i<s.length&&(s[i]==="*"||s[i]==="~")){
        if(s[i]==="*")t.parcels++;
        else warns.push(`Compasso ${mN}, tempo ${bN}: ligadura em pausa ignorada.`);
        i++;}
      down=0;toks.push(t);continue;}
    if(/[1-7]/.test(c)){
      const t={rest:false,deg:+c,down,up:0,acc:0,tie:false,parcels:0};
      down=0;i++;let go=true;
      while(go&&i<s.length){switch(s[i]){
        case "'":t.up++;i++;break;
        case "#":t.acc=1;i++;break;
        case "b":t.acc=-1;i++;break;
        case "~":t.tie=true;i++;break;
        case "*":t.parcels++;i++;break;
        case ".":t.dotted=true;i++;break;
        default:go=false;}}
      toks.push(t);continue;}
    warns.push(`Compasso ${mN}, tempo ${bN}: símbolo "${c}" ignorado.`);i++;
  }
  if(!toks.length)return null;
  // ponto de aumento = açúcar sobre R7: multiplica parcelas por 1,5 (3. -> 3 parcelas = 3/4
  // do tempo = 3***). NÃO é sistema de ritmo paralelo; R7 (parcelas) continua fonte única.
  toks.forEach(t=>{
    if(t.dotted)t.parcels=t.parcels?Math.round(t.parcels*1.5):3;
    else if(!t.parcels)t.parcels=1;
  });
  const total=toks.reduce((a,t)=>a+t.parcels,0);
  return {toks,total,tuplet:(total&(total-1))!==0};
}

/* duração: unidades (semínima=16) → {code, dots} VexFlow */
const DUR={16:["q",0],12:["8",1],8:["8",0],6:["16",1],4:["16",0],3:["32",1],2:["32",0],1:["64",0],14:["8",2]};
function durOf(u,warns,where){
  if(DUR[u])return DUR[u];
  warns.push(`${where}: duração irregular (${u}/16 do tempo) — aproximada.`);
  const ks=Object.keys(DUR).map(Number).sort((a,b)=>b-a);
  for(const k of ks)if(k<=u)return DUR[k];
  return DUR[1];
}

/* ---------- Score: lista sequencial de eventos ---------- */
function buildScore(parsed,tsNum,key,warns){
  const ev=[];let tSeq=0;
  parsed.measures.forEach((m,mi)=>{
    m.beats.forEach((beat,bi)=>{
      const occ=beat.tuplet?Math.pow(2,Math.floor(Math.log2(beat.total))):beat.total;
      const tid=beat.tuplet?++tSeq:0;
      beat.toks.forEach(t=>{
        const u=Math.round(t.parcels*16/occ);
        const [code,dots]=durOf(u,warns,`Compasso ${mi+1}, tempo ${bi+1}`);
        const e={rest:t.rest,deg:t.deg,acc:t.acc||0,
          code,dots,beats:t.parcels/beat.total,tie:!!t.tie,
          measure:mi,beat:bi,tupletId:tid,tupletTotal:beat.total,tupletOcc:occ};
        if(!t.rest){
          const p=degreeToPitch(t.deg,t.up,t.down,key);
          e.letter=p.letter;e.octave=p.octave;
          e.alter=sigAlter(p.letter,key.sig)+e.acc;
          e.midi=12*(p.octave+1)+SEMI[p.letter]+e.alter;
          const accStr={"-2":"bb","-1":"b","0":"","1":"#","2":"##"}[String(e.alter)]||"";
          e.vfKey=p.letter.toLowerCase()+accStr+"/"+p.octave;
        }
        ev.push(e);
      });
    });
    if(m.beats.length!==tsNum)
      warns.push(`Compasso ${mi+1}: ${m.beats.length} tempo(s) — fórmula pede ${tsNum}.`);
  });
  ev.forEach((e,i)=>{
    if(e.tie&&!e.rest){
      const n=ev[i+1];
      if(!n||n.rest){warns.push(`Ligadura no compasso ${e.measure+1} sem nota seguinte — ignorada.`);e.tie=false;}
      else e.sameTie=(n.letter===e.letter&&n.octave===e.octave&&n.alter===e.alter);
    }
  });
  return ev;
}

/* ---------- Desdobramento de repetições (ordem EXECUTADA, p/ playback) ----------
   Percorre os compassos seguindo ||: :|| e casas: corpo do repeat 2x, casa 1 na
   1ª passada, casa 2 na 2ª. Retorna a lista de ÍNDICES de compasso na ordem tocada.
   Nível único (Cromus não aninha repetições); trava anti-loop por segurança. */
function unfoldRepeats(measures){
  const order=[];let i=0,repeatStart=0,pass=1,guard=0;const doneEnds=new Set();
  while(i<measures.length){
    if(++guard>100000)break;                 // trava: nunca laçar infinito
    const m=measures[i];
    if(m.repeatBegin&&i!==repeatStart){repeatStart=i;pass=1;}  // novo ||: (não o revisitado no salto)
    if(m.volta&&m.volta!==pass){             // casa da passada errada → pula o trecho inteiro da casa
      const v=m.volta;while(i<measures.length&&measures[i].volta===v)i++;continue;}
    order.push(i);
    if(m.repeatEnd&&!doneEnds.has(i)){doneEnds.add(i);pass=2;i=repeatStart;continue;} // :|| → salta 1x p/ o ||:
    i++;
  }
  return order;
}

if(typeof module!=="undefined")module.exports={RNG_MAPPER,LETTERS,SEMI,KEYS,keyInfo,sigAlter,degreeToPitch,parseCromus,buildScore,unfoldRepeats};
