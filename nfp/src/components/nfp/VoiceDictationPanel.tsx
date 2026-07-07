import { useState, useRef, useCallback, useEffect } from "react";

const CORES: Record<number, string> = {
  1: "#C0001A", 2: "#ECD200", 3: "#F07300",
  4: "#00B050", 5: "#0066FF", 6: "#8B5E00", 7: "#9B5FC0",
};

type Mods = { octUp: boolean; octDown: boolean; sharp: boolean; flat: boolean; tie: boolean; stars: number };
type Token =
  | { t: "note"; grau: number; mods: Mods }
  | { t: "rest"; mods: { stars: number } }
  | { t: "sep" }
  | { t: "bar" }
  | { t: "open_rep" }
  | { t: "close_rep" }
  | { t: "casa"; n: number }
  | { t: "fim" };

const DICT_DEFAULT: Record<string, string> = {
  "um":"NOTE:1","1":"NOTE:1","dó":"NOTE:1","do":"NOTE:1",
  "dois":"NOTE:2","2":"NOTE:2","ré":"NOTE:2","re":"NOTE:2",
  "três":"NOTE:3","tres":"NOTE:3","3":"NOTE:3","mi":"NOTE:3",
  "quatro":"NOTE:4","4":"NOTE:4","fá":"NOTE:4","fa":"NOTE:4",
  "cinco":"NOTE:5","5":"NOTE:5","sol":"NOTE:5",
  "seis":"NOTE:6","6":"NOTE:6","lá":"NOTE:6","la":"NOTE:6",
  "sete":"NOTE:7","7":"NOTE:7","si":"NOTE:7",
  "batida":"SEP","vírgula":"SEP","virgula":"SEP",",":"SEP",
  "pausa":"REST","nada":"REST",
  "barra":"BAR","|":"BAR",
  "agudo":"OCT_UP","grave":"OCT_DOWN",
  "sustenido":"SHARP","bemol":"FLAT",
  "liga":"TIE","lida":"TIE","ligadura":"TIE",
  "asterisco":"STAR","parcela":"STAR",
  "abre repetição":"OPEN_REP","abre repeticao":"OPEN_REP",
  "fecha repetição":"CLOSE_REP","fecha repeticao":"CLOSE_REP",
  "casa um":"CASA:1","casa 1":"CASA:1",
  "casa dois":"CASA:2","casa 2":"CASA:2",
  "fim":"FIM",
  "apaga":"DELETE","corrige":"DELETE",
  "e":"IGNORE","a":"IGNORE","o":"IGNORE",
};

const LEGENDA: { grau: number; nome: string; cor: string }[] = [
  { grau: 1, nome: "Dó", cor: "#C0001A" },
  { grau: 2, nome: "Ré", cor: "#ECD200" },
  { grau: 3, nome: "Mi", cor: "#F07300" },
  { grau: 4, nome: "Fá", cor: "#00B050" },
  { grau: 5, nome: "Sol", cor: "#0066FF" },
  { grau: 6, nome: "Lá", cor: "#8B5E00" },
  { grau: 7, nome: "Si", cor: "#9B5FC0" },
];

function normalize(s: string): string {
  return s.toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/([,|])/g, " $1 ")
    .replace(/[.!?;]/g, " ")
    .replace(/\s+/g, " ").trim();
}

function parse(text: string, dict: Record<string, string>): Token[] {
  const words = normalize(text).split(" ").filter(Boolean);
  const out: Token[] = [];
  let i = 0;
  const last = (): Token | null => (out.length ? out[out.length - 1] : null);
  const lastNote = (): Token | null => {
    for (let k = out.length - 1; k >= 0; k--)
      if (out[k].t === "note" || out[k].t === "rest") return out[k];
    return null;
  };

  while (i < words.length) {
    let action: string | undefined;
    let step = 1;
    if (i + 1 < words.length && dict[words[i] + " " + words[i + 1]] !== undefined) {
      action = dict[words[i] + " " + words[i + 1]];
      step = 2;
    } else if (dict[words[i]] !== undefined) {
      action = dict[words[i]];
    } else {
      const m = words[i].match(/^('?)([1-7])('?)([#b]?)(\*+)?(~?)$/);
      if (m) {
        out.push({ t: "note", grau: +m[2], mods: { octDown: !!m[1], octUp: !!m[3], sharp: m[4] === "#", flat: m[4] === "b", stars: (m[5] || "").length, tie: !!m[6] } });
        i++; continue;
      }
      i++; continue;
    }
    i += step;

    if (action === "IGNORE") continue;
    if (action.startsWith("NOTE:")) {
      out.push({ t: "note", grau: +action.split(":")[1], mods: { octUp: false, octDown: false, sharp: false, flat: false, tie: false, stars: 0 } });
    } else if (action === "SEP") { const l = last(); if (l && l.t !== "sep" && l.t !== "bar") out.push({ t: "sep" }); }
    else if (action === "BAR") { const l = last(); if (l && l.t === "sep") out.pop(); out.push({ t: "bar" }); }
    else if (action === "REST") out.push({ t: "rest", mods: { stars: 0 } });
    else if (action === "OCT_UP") { const n = lastNote(); if (n && n.t === "note") (n as any).mods.octUp = true; }
    else if (action === "OCT_DOWN") { const n = lastNote(); if (n && n.t === "note") (n as any).mods.octDown = true; }
    else if (action === "SHARP") { const n = lastNote(); if (n && n.t === "note") (n as any).mods.sharp = true; }
    else if (action === "FLAT") { const n = lastNote(); if (n && n.t === "note") (n as any).mods.flat = true; }
    else if (action === "TIE") { const n = lastNote(); if (n && n.t === "note") (n as any).mods.tie = true; }
    else if (action === "STAR") {
      const n = lastNote();
      if (n && n.t === "note") (n as any).mods.stars = ((n as any).mods.stars || 0) + 1;
      else if (n && n.t === "rest") (n as any).mods.stars = ((n as any).mods.stars || 0) + 1;
    }
    else if (action === "OPEN_REP") out.push({ t: "open_rep" });
    else if (action === "CLOSE_REP") { if (last() && (last() as Token).t === "sep") out.pop(); out.push({ t: "close_rep" }); }
    else if (action.startsWith("CASA:")) out.push({ t: "casa", n: +action.split(":")[1] });
    else if (action === "FIM") { if (last() && (last() as Token).t === "sep") out.pop(); out.push({ t: "fim" }); }
    else if (action === "DELETE") {
      while (out.length && (out[out.length - 1] as Token).t === "sep") out.pop();
      out.pop();
    }
  }
  return out;
}

function tokenStr(tok: Token): string {
  if (tok.t === "note") {
    let s = (tok.mods.octDown ? "'" : "") + tok.grau + (tok.mods.octUp ? "'" : "");
    if (tok.mods.sharp) s += "#"; if (tok.mods.flat) s += "b";
    s += "*".repeat(tok.mods.stars || 0);
    if (tok.mods.tie) s += "~";
    return s;
  }
  if (tok.t === "rest") return "-" + "*".repeat(tok.mods.stars || 0);
  if (tok.t === "sep") return ",";
  if (tok.t === "bar") return "|";
  if (tok.t === "open_rep") return "||:";
  if (tok.t === "close_rep") return ":||";
  if (tok.t === "casa") return `(CASA ${tok.n})`;
  if (tok.t === "fim") return "FIM";
  return "";
}

function toSyntax(toks: Token[]): string {
  let s = "";
  toks.forEach((tok) => {
    const str = tokenStr(tok);
    if (tok.t === "sep") { s = s.trimEnd() + ", "; }
    else if (tok.t === "bar") { s = s.trimEnd() + " | "; }
    else { s += str + " "; }
  });
  return s.replace(/\s+/g, " ").replace(/\s,/g, ",").trim();
}

function formatDict(dict: Record<string, string>): string {
  return JSON.stringify(dict, null, 2);
}

type Props = {
  onInsert: (syntax: string) => void;
  onClose: () => void;
  vars: Record<string, string>;
};

export function VoiceDictationPanel({ onInsert, onClose, vars }: Props) {
  const [dict, setDict] = useState<Record<string, string>>(DICT_DEFAULT);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [showDict, setShowDict] = useState(false);
  const [dictText, setDictText] = useState("");
  const [status, setStatus] = useState("Pronto — clique no microfone e dite");
  const recRef = useRef<any>(null);

  const syntax = toSyntax(tokens);

  const reparse = useCallback((txt: string) => {
    setTranscript(txt);
    const toks = parse(txt, dict);
    setTokens(toks);
  }, [dict]);

  const toggleListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setStatus("Web Speech API indisponível — use Chrome"); return; }

    if (listening) {
      recRef.current?.stop();
      setListening(false);
      setStatus("Pronto — clique no microfone e dite");
      setInterim("");
      return;
    }

    const rec = new SR() as any;
    rec.lang = "pt-BR";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interimTxt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          setTranscript((prev) => {
            const next = (prev + " " + t).trim();
            reparse(next);
            return next;
          });
        } else {
          interimTxt += t;
        }
      }
      setInterim(interimTxt);
    };

    rec.onend = () => { if (listening) rec.start(); };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed") {
        rec.stop();
        setListening(false);
        setStatus("Permissão de microfone negada");
      }
    };

    recRef.current = rec;
    rec.start();
    setListening(true);
    setStatus("● Gravando — dite a cantiga");
  }, [listening, reparse]);

  useEffect(() => {
    return () => { if (recRef.current) recRef.current.stop(); };
  }, []);

  const openDict = () => {
    setDictText(formatDict(dict));
    setShowDict(true);
  };

  const saveDict = () => {
    try {
      const parsed = JSON.parse(dictText);
      setDict(parsed);
      reparse(transcript);
      setShowDict(false);
    } catch { setStatus("JSON inválido"); }
  };

  const resetDict = () => {
    setDict(DICT_DEFAULT);
    setDictText(formatDict(DICT_DEFAULT));
    reparse(transcript);
  };

  const handleInsert = () => {
    if (syntax) {
      onInsert(syntax);
      onClose();
    }
  };

  return (
    <div style={{
      background: vars["--surface"],
      border: `1px solid ${vars["--border"]}`,
      borderRadius: 12,
      margin: 8,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px",
        borderBottom: `1px solid ${vars["--border"]}`,
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: vars["--text"] }}>
          Ditador Cromus <span style={{ color: vars["--accent"] }}>🎙</span>
        </span>
        <span style={{ fontSize: 11, color: vars["--textMuted"] }}>
          voz → Sintaxe Cromus
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={openDict}
          style={{
            background: "none", border: `1px solid ${vars["--border"]}`,
            color: vars["--textDim"], borderRadius: 6, padding: "4px 10px",
            fontSize: 11, cursor: "pointer",
          }}
        >⚙ Dicionário</button>
        <button onClick={onClose}
          style={{
            background: "none", border: "none",
            color: vars["--textDim"], fontSize: 18, cursor: "pointer",
          }}
        >✕</button>
      </div>

      {/* Microphone bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
        <button onClick={toggleListening}
          style={{
            width: 56, height: 56, borderRadius: "50%",
            border: `2px solid ${listening ? "#e04040" : vars["--accent"]}`,
            background: listening ? "#e0404015" : vars["--bg"],
            color: listening ? "#e04040" : vars["--accent"],
            fontSize: 24, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
            animation: listening ? "pulse 1.2s infinite" : "none",
          }}
          title="Iniciar / parar ditado"
        >🎙</button>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 11, fontFamily: "monospace",
            color: listening ? "#e04040" : vars["--textMuted"],
            letterSpacing: 1, textTransform: "uppercase",
          }}>
            {status}
          </div>
          {interim && (
            <div style={{
              fontSize: 13, color: vars["--textMuted"],
              fontStyle: "italic", marginTop: 2, minHeight: 18,
            }}>
              {interim}
            </div>
          )}
        </div>
      </div>

      {/* Transcript */}
      <div style={{ padding: "0 14px 8px" }}>
        <textarea value={transcript}
          onChange={(e) => reparse(e.target.value)}
          placeholder="ex.: cinco batida tres liga batida barra"
          style={{
            width: "100%", minHeight: 60, resize: "vertical",
            background: vars["--bg"], border: `1px solid ${vars["--border"]}`,
            color: vars["--text"], borderRadius: 8, padding: 10,
            fontSize: 13, fontFamily: "sans-serif", outline: "none",
          }}
        />
      </div>

      {/* Visual tokens */}
      <div style={{
        padding: "10px 14px", minHeight: 48,
        display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
        borderTop: `1px solid ${vars["--border"]}`,
      }}>
        {tokens.length === 0 ? (
          <span style={{ color: vars["--textMuted"], fontSize: 13, fontStyle: "italic" }}>
            os graus aparecem aqui, nas cores RNFG…
          </span>
        ) : tokens.map((tok, i) => {
          const str = tokenStr(tok);
          let style: React.CSSProperties = {
            fontFamily: "monospace", fontSize: 14, fontWeight: 600,
            padding: "4px 9px", borderRadius: 7,
            cursor: "pointer", userSelect: "none",
          };
          if (tok.t === "note") {
            style.background = CORES[tok.grau];
            style.color = "#fff";
            style.border = "none";
          } else if (tok.t === "sep") {
            style.background = "transparent";
            style.border = "none";
            style.color = vars["--textDim"];
            style.padding = "4px 2px";
            style.fontSize = 16;
          } else if (tok.t === "bar") {
            style.background = "transparent";
            style.border = "none";
            style.color = vars["--accent"];
            style.fontSize = 18;
            style.padding = "4px 3px";
          } else if (tok.t === "rest") {
            style.background = "#4a4438";
            style.color = vars["--text"];
            style.border = `1px dashed ${vars["--textDim"]}`;
          } else {
            style.background = vars["--accent"] + "80";
            style.color = "#fff";
            style.border = "none";
          }
          return (
            <span key={i} style={style}
              onClick={() => {
                const toks = [...tokens];
                toks.splice(i, 1);
                setTokens(toks);
                setTranscript(toSyntax(toks));
              }}
              title="clique para remover"
            >{str}</span>
          );
        })}
      </div>

      {/* Output syntax + actions */}
      <div style={{ padding: "0 14px 10px" }}>
        <textarea readOnly value={syntax}
          placeholder="sintaxe Cromus pronta para inserir…"
          style={{
            width: "100%", minHeight: 44, resize: "vertical",
            background: vars["--bg"], border: `1px solid ${vars["--border"]}`,
            color: vars["--text"], borderRadius: 8, padding: 10,
            fontSize: 13, fontFamily: "monospace", outline: "none",
          }}
        />
      </div>

      {/* Actions */}
      <div style={{
        display: "flex", gap: 8, padding: "6px 14px 10px",
        borderTop: `1px solid ${vars["--border"]}`,
      }}>
        <button onClick={handleInsert} disabled={!syntax}
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 8,
            background: vars["--accent"], color: "#fff",
            border: "none", fontWeight: 600, fontSize: 13,
            cursor: syntax ? "pointer" : "default", opacity: syntax ? 1 : 0.4,
          }}
        >Inserir no editor</button>
        <button onClick={() => { setTranscript(""); setTokens([]); }}
          style={{
            padding: "8px 12px", borderRadius: 8,
            background: vars["--surface2"], color: vars["--textDim"],
            border: `1px solid ${vars["--border"]}`, fontSize: 13,
            cursor: "pointer",
          }}
        >Limpar</button>
        <button onClick={() => {
          const last = [...tokens]; last.pop();
          setTokens(last);
          setTranscript(toSyntax(last));
        }}
          style={{
            padding: "8px 12px", borderRadius: 8,
            background: vars["--surface2"], color: vars["--textDim"],
            border: `1px solid ${vars["--border"]}`, fontSize: 13,
            cursor: "pointer",
          }}
        >↩ Desfazer</button>
      </div>

      {/* Legenda */}
      <div style={{
        display: "flex", gap: 4, flexWrap: "wrap",
        padding: "6px 14px 10px",
      }}>
        {LEGENDA.map((g) => (
          <span key={g.grau} style={{
            fontFamily: "monospace", fontSize: 10,
            padding: "2px 7px", borderRadius: 5, color: "#fff",
            background: g.cor,
          }}>{g.grau} {g.nome}</span>
        ))}
      </div>

      {/* Dictionary editor */}
      {showDict && (
        <div style={{
          borderTop: `1px solid ${vars["--border"]}`,
          padding: 10,
        }}>
          <textarea value={dictText}
            onChange={(e) => setDictText(e.target.value)}
            spellCheck={false}
            style={{
              width: "100%", minHeight: 200, resize: "vertical",
              background: vars["--bg"], border: `1px solid ${vars["--border"]}`,
              color: vars["--text"], borderRadius: 8, padding: 10,
              fontSize: 12, fontFamily: "monospace", outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={saveDict}
              style={{
                padding: "6px 12px", borderRadius: 6,
                background: vars["--accent"], color: "#fff",
                border: "none", fontWeight: 600, fontSize: 12, cursor: "pointer",
              }}
            >Salvar dicionário</button>
            <button onClick={resetDict}
              style={{
                padding: "6px 12px", borderRadius: 6,
                background: vars["--surface2"], color: vars["--textDim"],
                border: `1px solid ${vars["--border"]}`, fontSize: 12, cursor: "pointer",
              }}
            >Restaurar padrão</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(224,64,64,.45); }
          50% { box-shadow: 0 0 0 12px rgba(224,64,64,0); }
        }
      `}</style>
    </div>
  );
}
