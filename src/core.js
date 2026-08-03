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
function parseCromus(src,tsNum,tsDen){
  const compound=tsDen===8&&tsNum%3===0;
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
        content.split(",").forEach((bRaw,bi)=>{const b=parseBeat(bRaw,measures.length+1,bi+1,warns,compound);if(b)beats.push(b);});
        const m={beats,repeatBegin:pendRB,repeatEnd:false,volta:curVolta,endBar:false};
        pendRB=false;measures.push(m);lastM=m;
      }
    });
  });
  return {measures,warns};
}
function parseBeat(s,mN,bN,warns,compound){
  const toks=[];let down=0,i=0;
  s=s.replace(/[()]/g," ");
  while(i<s.length){
    const c=s[i];
    if(c===" "||c==="\t"){i++;continue;}
    if(c==="'"){down++;i++;continue;}
    if(c==="-"||c==="0"){
      const t={rest:true,parcels:0,plus:false};i++;
      while(i<s.length&&(s[i]==="*"||s[i]==="~"||s[i]==="+")){
        if(s[i]==="*")t.parcels++;
        else if(s[i]==="+")t.plus=true;
        else warns.push(`Compasso ${mN}, tempo ${bN}: ligadura em pausa ignorada.`);
        i++;}
      down=0;toks.push(t);continue;}
    if(/[1-7]/.test(c)){
      const t={rest:false,deg:+c,down,up:0,acc:0,tie:false,plus:false,parcels:0};
      down=0;i++;let go=true;
      while(go&&i<s.length){switch(s[i]){
        case "'":t.up++;i++;break;
        case "#":t.acc=1;i++;break;
        case "b":t.acc=-1;i++;break;
        case "~":t.tie=true;i++;break;
        case "+":t.plus=true;i++;break;
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
    if(t.plus&&(t.parcels>0||t.dotted)){
      warns.push(`Compasso ${mN}, tempo ${bN}: "+" não combina com subdivisão (* ou .) — ignorado.`);
      t.plus=false;
    }
    if(t.dotted)t.parcels=t.parcels?Math.round(t.parcels*1.5):3;
    else if(!t.parcels)t.parcels=1;
  });
  const total=toks.reduce((a,t)=>a+t.parcels,0);
  // divisão natural do tempo: em composto o tempo já é ternário (grupo=3), em simples é binário
  // (grupo=1) — só o que sobra fora dessa base binária conta como quiáltera de verdade.
  const grupo=compound?3:1;
  const q=total/grupo;
  const potenciaOk=Number.isInteger(q)&&q>0&&(q&(q-1))===0;
  return {toks,total,tuplet:!potenciaOk};
}

/* duração: unidades (64avos; semínima=16) → {code, dots} VexFlow. 24=semínima
   pontuada (tempo composto inteiro), 32/48/64=mínima/mínima pontuada/semibreve
   — mesma régua absoluta serve compasso simples e composto, sem tabela paralela. */
const DUR={64:["w",0],48:["h",1],32:["h",0],24:["q",1],16:["q",0],12:["8",1],8:["8",0],6:["16",1],4:["16",0],3:["32",1],2:["32",0],1:["64",0],14:["8",2]};
function durOf(u,warns,where){
  if(DUR[u])return DUR[u];
  warns.push(`${where}: duração irregular (${u}/16 do tempo) — aproximada.`);
  const ks=Object.keys(DUR).map(Number).sort((a,b)=>b-a);
  for(const k of ks)if(k<=u)return DUR[k];
  return DUR[1];
}

/* ---------- Score: lista sequencial de eventos ---------- */
function buildScore(parsed,tsNum,tsDen,key,warns){
  /* compasso composto (6/8, 9/8, 12/8): 1 tempo R7 (1 vírgula) = o tempo
     composto (semínima pontuada), não a colcheia — é assim que se conta
     musicalmente (6/8 sente-se em 2, não em 6). tempoRef = 64avos que valem
     1 tempo; temposEsperados = nº de vírgulas por compasso (6/8→2, não 6). */
  const compound = tsDen===8 && tsNum%3===0;
  const tempoRef = compound ? 24 : 16;
  const temposEsperados = compound ? tsNum/3 : tsNum;
  const ev=[];let tSeq=0;
  parsed.measures.forEach((m,mi)=>{
    m.beats.forEach((beat,bi)=>{
      const occ=beat.tuplet?Math.pow(2,Math.floor(Math.log2(beat.total))):beat.total;
      const tid=beat.tuplet?++tSeq:0;
      beat.toks.forEach(t=>{
        const u=Math.round(t.parcels*tempoRef/occ);
        const [code,dots]=durOf(u,warns,`Compasso ${mi+1}, tempo ${bi+1}`);
        const e={rest:t.rest,deg:t.deg,acc:t.acc||0,
          code,dots,beats:t.parcels/beat.total,tie:!!t.tie,plus:!!t.plus,
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
    if(m.beats.length!==temposEsperados)
      warns.push(`Compasso ${mi+1}: ${m.beats.length} tempo(s) — fórmula pede ${temposEsperados}.`);
  });

  /* + : soma de tempos inteiros iguais (mínima/semibreve/pausa longa) — funde
     em 1 evento só (diferente de ~, que mantém eventos separados e só liga
     visualmente). Exige cada elo sozinho no tempo (beats===1) e mesma altura
     (ou pausa->pausa); soma final precisa bater com figura tradicional única —
     senão, erro e nada é fundido. Reaproveita a mesma DUR (régua absoluta de
     64avos) em vez de manter uma tabela paralela: total*tempoRef já dá a
     unidade certa pra simples OU composto (2 tempos compostos = mínima
     pontuada, automaticamente, sem caso especial). */
  { let i=0;
    while(i<ev.length){
      const e=ev[i];
      if(!e.plus){ i++; continue; }
      let j=i, total=e.beats, okChain=true;
      while(ev[j]&&ev[j].plus){
        const cur=ev[j], nxt=ev[j+1];
        const linkOk = cur.beats===1 && nxt && nxt.beats===1 &&
          (cur.rest ? nxt.rest : (!nxt.rest && nxt.letter===cur.letter && nxt.octave===cur.octave && nxt.alter===cur.alter));
        if(!linkOk){ okChain=false; break; }
        total+=nxt.beats; j++;
      }
      const figura=DUR[total*tempoRef];
      if(!okChain||!figura){
        warns.push(`Compasso ${e.measure+1}: "+" inválido ou soma de ${total} tempo(s) sem figura tradicional única — ignorado.`);
        for(let k=i;k<=j;k++) if(ev[k]) ev[k].plus=false;
        i++; continue;
      }
      e.beats=total; e.code=figura[0]; e.dots=figura[1];
      ev.splice(i+1, j-i);
      i++;
    }
  }

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

/* ---------- Multivoz: segmenta o texto em trilhas por corda (@corda1:..@corda6:) ----------
   A trilha SEM marcador continua sendo exatamente a sintaxe de hoje (retrocompatível — 0
   marcadores no texto = 1 trilha só, idêntica ao buildScore(parseCromus(texto,...)) direto).
   Vozes extras são opt-in: cada "@cordaN:" (sozinho na linha ou com corpo já na mesma linha)
   abre uma trilha nova; tudo até a próxima marca ou o fim do texto pertence a ela. Numeração
   de violonista (1=corda mais aguda...6=mais grave) — CORDAS/CORDAS_MIDI em
   rng_tab_module.js são indexados 6ª→1ª, daí a inversão. */
function cordaLabelToIndex(n){ return 6-n; }
function parseVozes(fullSrc,tsNum,tsDen,key){
  const partes=fullSrc.split(/^@corda([1-6]):[ \t]*/m);
  const fatal=[];
  const principalParsed=parseCromus(partes[0],tsNum,tsDen);
  const trilhas=[{corda:null,warns:principalParsed.warns,measures:principalParsed.measures,
    events:buildScore(principalParsed,tsNum,tsDen,key,principalParsed.warns)}];
  if(!partes[0].trim())
    fatal.push("É necessário ter uma trilha principal (sem marcador @cordaN:) — peça só com vozes marcadas não é suportada nesta versão.");

  for(let i=1;i<partes.length;i+=2){
    const n=+partes[i], corpo=partes[i+1]||"";
    const p=parseCromus(corpo,tsNum,tsDen);
    if(p.measures.some(m=>m.repeatBegin||m.repeatEnd||m.volta))
      p.warns.push("estrutura de repetição em trilha secundária é ignorada — use a trilha principal.");
    /* buildScore empurra avisos novos em p.warns durante a execução (contagem de
       tempos, "+" inválido, ligadura sem próxima nota...) — só prefixamos com
       "@cordaN:" DEPOIS que ele já terminou, senão os avisos gerados aqui dentro
       ficariam sem o prefixo. */
    const events=buildScore(p,tsNum,tsDen,key,p.warns);
    const warns=p.warns.map(w=>`@corda${n}: ${w}`);
    trilhas.push({corda:n,warns,measures:p.measures,events});
  }

  if(partes[0].trim()){
    const nCompassos=trilhas[0].measures.length;
    trilhas.slice(1).forEach(tr=>{
      if(tr.measures.length!==nCompassos)
        fatal.push(`@corda${tr.corda}: tem ${tr.measures.length} compasso(s), a trilha principal tem ${nCompassos} — todas as trilhas precisam do mesmo número de compassos.`);
    });
  }
  return {trilhas,fatal};
}

if(typeof module!=="undefined")module.exports={RNG_MAPPER,LETTERS,SEMI,KEYS,keyInfo,sigAlter,degreeToPitch,parseCromus,buildScore,unfoldRepeats,parseVozes,cordaLabelToIndex};
