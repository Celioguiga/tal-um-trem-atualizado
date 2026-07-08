#!/usr/bin/env python3
"""
Real Tablatura — PWA para violão com RNFG
synemusic realtab [--port PORT]

Dependências: rng_common.py, cromus_studio.py (para export PDF)
"""
import argparse, base64, json, os, re, shutil, subprocess, sys, tempfile, threading, webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

sys.path.insert(0, os.path.expanduser("~"))
import rng_common as rng
from synemusic.style import status_ok, status_erro, cabecalho

PORT = 4343
HOME = os.path.expanduser("~")
LILYPOND_CMD = shutil.which("lilypond") or "/opt/homebrew/bin/lilypond"

try:
    from cromus_studio import _sintaxe_para_ly_raw, _gerar_tab_ly, compilar_tab
    LILYPOND_OK = True
except Exception:
    LILYPOND_OK = False
    compilar_tab = None

_GRAU_FORMA_NOME = {
    1: 'Círculo', 2: 'Ogiva', 3: 'Triângulo', 4: 'Quadrado',
    5: 'Estrela', 6: 'Hexágono', 7: 'Casinha',
}

def register(subparsers):
    p = subparsers.add_parser("realtab", help="Real Tablatura — PWA para violão com RNFG")
    p.add_argument("--port", type=int, default=PORT, help=f"Porta (default: {PORT})")

def run(args):
    port = args.port or PORT
    server = HTTPServer(("0.0.0.0", port), RealtabHandler)
    cabecalho()
    print()
    print(status_ok(f"Real Tablatura → http://localhost:{port}"))
    webbrowser.open(f"http://localhost:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.shutdown()

class RealtabHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        routes = {
            "/": self._serve_html,
            "/manifest.json": self._serve_manifest,
            "/service-worker.js": self._serve_sw,
            "/icon.svg": self._serve_icon,
            "/api/exemplos": self._api_exemplos,
        }
        handler = routes.get(self.path)
        if handler:
            handler()
        else:
            self.send_error(404)

    def do_POST(self):
        routes = {
            "/api/parse": self._api_parse,
            "/api/render": self._api_render,
        }
        handler = routes.get(self.path)
        if handler:
            handler()
        else:
            self.send_error(404)

    def _send(self, data, ctype="application/json", status=200):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        if isinstance(data, str):
            self.wfile.write(data.encode("utf-8"))
        else:
            self.wfile.write(data)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(length).decode())

    def _api_parse(self):
        body = self._read_body()
        sintaxe = body.get("sintaxe", "").strip()
        tonalidade = body.get("tonalidade", "C")
        trastes = body.get("trastes", 12)
        if not sintaxe:
            self._send(json.dumps({"ok": False, "erro": "Sintaxe vazia"}))
            return
        notas = rng.sintaxe_para_notas(sintaxe, tonalidade)
        for n in notas:
            oit = min(max(n["oitava"] + 4, 2), 6)
            pos = rng.nota_melhor_posicao(n["nota"], oit, trastes)
            n["posicao"] = pos
            n["forma"] = rng.GRAU_FORMA.get(n["grau"], "circulo")
            n["cor"] = rng.CORES.get(n["grau"], "#888")
            n["nome_rom"] = rng.GRAU_NOME.get(n["grau"], "?")
            n["forma_nome"] = _GRAU_FORMA_NOME.get(n["grau"], "")
        self._send(json.dumps({"ok": True, "notas": notas}, ensure_ascii=False))

    def _api_render(self):
        if not LILYPOND_OK or not compilar_tab:
            self._send(json.dumps({"ok": False, "erro": "LilyPond não disponível"}))
            return
        body = self._read_body()
        sintaxe = body.get("sintaxe", "")
        titulo = body.get("titulo", "Real Tablatura")
        autor = body.get("autor", "Synemusic")
        compasso = body.get("compasso", "4/4")
        try:
            result = compilar_tab(sintaxe, titulo, compasso, compositor=autor)
            self._send(json.dumps(result))
        except Exception as e:
            self._send(json.dumps({"ok": False, "erro": str(e)}))

    def _api_exemplos(self):
        exemplos = [
            {"nome": "O Pião", "sintaxe": "5'',6,7,1 | 2, 2, 3, 4 | 5,5,6'',5 | 4,3,2,1", "compasso": "4/4"},
            {"nome": "Dona Aranha", "sintaxe": "1,2,3,4,5,5,5 | 4,4,4,3,3,3 | 2,2,2,1 | 5,5,5,4,4,4 | 3,3,3,2,2,2 | 1", "compasso": "4/4"},
            {"nome": "Peixe Vivo", "sintaxe": "5,3,4,2 | 3,1,2,7' | 1,2,3,4 | 5,5,5", "compasso": "4/4"},
            {"nome": "Caranguejo", "sintaxe": "5,4,3,2 | 1,1,1,1 | 2,2,2,2 | 3,3,3,3 | 4,4,4,4 | 5,5,5,5", "compasso": "4/4"},
            {"nome": "Cravo", "sintaxe": "55, 6'' | 7\", 1 | 2, 3 | 4\", 5", "compasso": "2/4"},
            {"nome": "Cai cai Balão", "sintaxe": "1,1,1 | 2,2,2 | 3,3,3 | 4,4,4 | 5,5,5 | 5,4,3,2,1", "compasso": "3/4"},
        ]
        self._send(json.dumps({"ok": True, "exemplos": exemplos}))

    def _serve_html(self):
        self._send(PAGE_HTML, "text/html; charset=utf-8")

    def _serve_manifest(self):
        self._send(json.dumps(MANIFEST), "application/json")

    def _serve_sw(self):
        self._send(SW_JS, "application/javascript")

    def _serve_icon(self):
        self._send(ICON_SVG, "image/svg+xml")

    def log_message(self, fmt, *a):
        pass

# ═══════════════════════════════════════════════════
# ASSETS ESTÁTICOS
# ═══════════════════════════════════════════════════

ICON_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0066FF"/>
      <stop offset="100%" stop-color="#9B5FC0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#g)"/>
  <g stroke="#fff" stroke-width="18" fill="none" stroke-linecap="round">
    <line x1="100" y1="200" x2="412" y2="200"/>
    <line x1="100" y1="270" x2="412" y2="270"/>
    <line x1="100" y1="340" x2="412" y2="340"/>
  </g>
  <circle cx="180" cy="200" r="30" fill="#C0001A" stroke="none"/>
  <circle cx="260" cy="270" r="30" fill="#0066FF" stroke="none"/>
  <polygon points="340,270 325,310 355,310" fill="#F07300" stroke="none"/>
  <text x="256" y="440" text-anchor="middle" fill="#fff" font-family="sans-serif" font-weight="bold" font-size="52">RT</text>
</svg>'''

MANIFEST = {
    "name": "Real Tablatura",
    "short_name": "R.Tab",
    "description": "Visualizador de tablatura com RNFG para violão",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0d0d1a",
    "theme_color": "#1a1a2e",
    "orientation": "portrait",
    "icons": [{"src": "/icon.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any maskable"}]
}

SW_JS = r'''const CACHE = "realtab-v1";
const URLS = ["/","/icon.svg","/manifest.json"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(URLS)));
  self.skipWaiting();
});
self.addEventListener("activate", e => e.waitUntil(clients.claim()));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.url.includes("/api/")) return;
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).catch(() => new Response("Offline", {status:503})))
  );
});
'''

PAGE_HTML = r'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no,viewport-fit=cover,maximum-scale=1">
<meta name="theme-color" content="#12121a">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="manifest" href="/manifest.json">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<title>Real Tablatura</title>
<style>
:root {
  --bg: #12121a; --surf: #1c1c2a; --surf2: #28283a;
  --text: #e8e8f0; --text2: #8888aa;
  --accent: #0066FF; --accent2: #8B5FC0;
  --btn: #2e2e44; --btn-hover: #3a3a52;
  --err: #ff4455; --ok: #00cc77;
  --radius: 14px; --radius-sm: 10px;
  --font: -apple-system, BlinkMacSystemFont, 'SF Pro', 'Segoe UI', system-ui, sans-serif;
  --mono: 'SF Mono', 'JetBrains Mono', 'Cascadia Code', monospace;
}
body.light{--bg:#eeecf4;--surf:#ffffff;--surf2:#e4e2ec;--text:#1a1a2e;--text2:#7a7a9a;--btn:#e0dcee;--btn-hover:#d0cce2;--err:#d63031;--ok:#00b894}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{font-family:var(--font);background:var(--bg);color:var(--text);font-size:16px;line-height:1.5;padding:0;overflow-x:hidden;min-height:100vh}
header{background:var(--surf);padding:14px 16px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100;border-bottom:1px solid var(--surf2);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px)}
header h1{font-size:18px;font-weight:700;background:linear-gradient(135deg,#0066FF,#9B5FC0);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-0.3px}
.header-actions{display:flex;gap:8px}
.header-actions button{width:36px;height:36px;border:none;border-radius:10px;background:var(--btn);color:var(--text2);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
.header-actions button:active{transform:scale(.88);background:var(--btn-hover)}
section{padding:8px 16px}
.card{background:var(--surf);border-radius:var(--radius);padding:12px;margin-bottom:8px}
.section-label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text2);margin-bottom:8px}
#sintaxe{width:100%;height:68px;background:var(--bg);color:var(--text);border:1.5px solid var(--surf2);border-radius:var(--radius-sm);padding:10px 12px;font-size:14px;font-family:var(--mono);resize:vertical;outline:none;transition:border-color .25s,box-shadow .25s}
#sintaxe:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(0,102,255,.15)}
#sintaxe::placeholder{color:var(--text2);opacity:.5}
.input-row{display:flex;gap:8px;margin-top:8px;align-items:center}
.input-row button{flex:1;padding:11px 16px;border:none;border-radius:var(--radius-sm);font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;touch-action:manipulation}
.input-row button:active{transform:scale(.96)}
.btn-primary{background:linear-gradient(135deg,#0066FF,#8B5FC0);color:#fff}
.btn-primary:disabled{opacity:.5}
.btn-secondary{background:var(--btn);color:var(--text)}
.input-row select{flex:1;padding:11px 12px;border:none;border-radius:var(--radius-sm);background:var(--btn);color:var(--text);font-size:13px;font-weight:500;outline:none;cursor:pointer;-webkit-appearance:none;appearance:none;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238888aa' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;background-size:10px}
.field-row{display:flex;gap:8px}
.field-input{flex:1;padding:10px 12px;border:1.5px solid var(--surf2);border-radius:var(--radius-sm);background:var(--bg);color:var(--text);font-size:14px;font-family:var(--font);outline:none;transition:border-color .2s,box-shadow .2s}
.field-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(0,102,255,.12)}
.pad-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.pad-grid button{aspect-ratio:1;border:none;border-radius:var(--radius-sm);font-size:20px;font-weight:700;cursor:pointer;transition:all .1s;touch-action:manipulation;min-height:50px;background:var(--btn);color:var(--text)}
.pad-grid button:active{transform:scale(.9);filter:brightness(1.4)}
.pad-grid .rest-btn{background:var(--err);color:#fff;font-size:22px}
.pad-tools{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px}
.pad-tools button{padding:10px;border:none;border-radius:var(--radius-sm);font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;touch-action:manipulation;background:var(--btn);color:var(--text2)}
.pad-tools button:active{background:var(--btn-hover);transform:scale(.94)}
.pad-fingers{display:grid;grid-template-columns:repeat(8,1fr);gap:4px;margin-top:6px}
.pad-fingers button{padding:8px 4px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;touch-action:manipulation;background:var(--btn);color:var(--accent2)}
.pad-fingers button.active{background:var(--accent2);color:#fff;box-shadow:0 0 12px rgba(139,95,192,.4)}
#fretboard-card{padding:6px}
#fretboard{width:100%;height:auto;display:block}
#tab-card{padding:6px}
#tabstaff{width:100%;height:auto;display:block}
.status-bar{display:flex;justify-content:space-between;align-items:center;min-height:24px;margin-top:6px;font-size:12px;color:var(--text2)}
.status-bar .spinner{width:14px;height:14px;border:2px solid var(--surf2);border-top-color:var(--accent);border-radius:50%;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
#legend{display:flex;flex-wrap:wrap;gap:4px 12px;padding:4px;font-size:12px;justify-content:center}
.legend-item{display:flex;align-items:center;gap:5px}
.legend-swatch{width:14px;height:14px;border-radius:4px;flex-shrink:0}
.action-row{display:flex;gap:8px}
.action-row button{flex:1;padding:13px;border:none;border-radius:var(--radius-sm);font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;touch-action:manipulation}
.action-row button:active{transform:scale(.97)}
.player-row{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.player-row button{width:42px;height:42px;border:none;border-radius:var(--radius-sm);font-size:18px;cursor:pointer;transition:all .15s;touch-action:manipulation;display:flex;align-items:center;justify-content:center}
.player-row button:active{transform:scale(.9)}
.bpm-group{flex:1;display:flex;align-items:center;gap:6px;margin-left:4px}
.bpm-label{font-size:11px;font-weight:600;color:var(--text2);white-space:nowrap}
.bpm-group input[type=range]{flex:1;height:4px;-webkit-appearance:none;appearance:none;background:var(--surf2);border-radius:2px;outline:none}
.bpm-group input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--accent);cursor:pointer}
.bpm-val{font-size:13px;font-weight:600;color:var(--text);min-width:28px;text-align:center}
#pdf-viewer-card{display:none;padding:0;overflow:hidden}
#pdf-viewer-card.open{display:block;margin-bottom:8px}
#pdf-viewer{width:100%;height:55vh;border:none;border-radius:var(--radius);background:var(--bg)}
.pdf-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px 8px}
.pdf-header h3{font-size:13px;font-weight:600;color:var(--text2)}
.pdf-header button{background:none;border:none;color:var(--text2);font-size:18px;cursor:pointer;padding:4px 8px}
@media(display-mode:standalone){header{padding-top:calc(14px + env(safe-area-inset-top,0))}}
@media(min-width:600px){body{max-width:420px;margin:0 auto;border-left:1px solid var(--surf2);border-right:1px solid var(--surf2);min-height:100vh}}
</style>
</head>
<body>
<header>
  <h1>Real Tablatura</h1>
  <div class="header-actions">
    <button id="themeToggle" aria-label="Alternar tema">🌙</button>
    <button id="installBtn" hidden aria-label="Instalar app">📥</button>
  </div>
</header>
<section>
  <div class="card">
    <div class="section-label">Sintaxe</div>
    <textarea id="sintaxe" placeholder="Ex: 5'',6,7,1 | 2,2,3,4 | 5,5,6'',5 | 4,3,2,1" spellcheck="false">5'',6,7,1 | 2, 2, 3, 4 | 5,5,6'',5 | 4,3,2,1</textarea>
    <div class="input-row">
      <button id="parseBtn" class="btn-primary">Parse</button>
      <select id="exemplosSelect"><option value="">Exemplo</option></select>
    </div>
    <div class="status-bar"><span id="status"></span></div>
  </div>
</section>
<section>
  <div class="card">
    <div class="section-label">Partitura</div>
    <div class="field-row">
      <input id="titleField" class="field-input" placeholder="Título" value="Real Tablatura">
      <input id="authorField" class="field-input" placeholder="Autor / Compositor" value="Synemusic">
    </div>
  </div>
</section>
<section>
  <div class="card">
    <div class="section-label">Notas</div>
    <div class="pad-grid">
      <button class="pad-note" data-note="1">1</button>
      <button class="pad-note" data-note="2">2</button>
      <button class="pad-note" data-note="3">3</button>
      <button class="pad-note" data-note="4">4</button>
      <button class="pad-note" data-note="5">5</button>
      <button class="pad-note" data-note="6">6</button>
      <button class="pad-note" data-note="7">7</button>
      <button class="pad-note rest-btn" data-note="-">⌀</button>
    </div>
    <div class="pad-tools">
      <button data-act="oct-up">8va▲</button>
      <button data-act="oct-down">8vb▼</button>
      <button data-act="sharp">♯</button>
      <button data-act="flat">♭</button>
    </div>
    <div class="pad-fingers">
      <button class="fg-btn" data-fg="1">➀</button>
      <button class="fg-btn" data-fg="2">➁</button>
      <button class="fg-btn" data-fg="3">➂</button>
      <button class="fg-btn" data-fg="4">➃</button>
      <button class="fg-btn" data-fg="p">p</button>
      <button class="fg-btn" data-fg="i">i</button>
      <button class="fg-btn" data-fg="m">m</button>
      <button class="fg-btn" data-fg="a">a</button>
    </div>
  </div>
</section>
<section id="fretboard-section">
  <div class="card" id="fretboard-card">
    <div class="section-label">Braço</div>
    <svg id="fretboard" viewBox="0 0 480 280" preserveAspectRatio="xMidYMid meet"></svg>
  </div>
</section>
<section id="tab-section">
  <div class="card" id="tab-card">
    <div class="section-label">Tab</div>
    <svg id="tabstaff" viewBox="0 0 480 70" preserveAspectRatio="xMidYMid meet"></svg>
  </div>
</section>
<section>
  <div class="card">
    <div class="section-label">Legenda</div>
    <div id="legend"></div>
  </div>
</section>
<section>
  <div class="player-row">
    <button id="playBtn" class="btn-primary" title="Tocar">▶</button>
    <button id="pauseBtn" class="btn-secondary" title="Pausar">⏸</button>
    <button id="stopBtn" class="btn-secondary" title="Parar">⏹</button>
    <div class="bpm-group">
      <span class="bpm-label">BPM</span>
      <input id="bpmSlider" type="range" min="40" max="200" value="80">
      <span id="bpmVal" class="bpm-val">80</span>
    </div>
  </div>
</section>
<section>
  <div class="action-row">
    <button id="exportPdfBtn" class="btn-primary">PDF</button>
    <button id="clearBtn" class="btn-secondary">Limpar</button>
  </div>
</section>
<section id="pdf-section">
  <div class="card" id="pdf-viewer-card">
    <div class="pdf-header"><h3>Partitura</h3><button id="closePdfBtn">✕</button></div>
    <iframe id="pdf-viewer"></iframe>
  </div>
</section>
<script>
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const STRS  = ['E','A','D','G','B','e'];
const STRS_M = [40,45,50,55,59,64];
const FNAMES = ['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII'];
const FDOTS  = {3:1,5:1,7:1,9:1,12:2};
const CORES  = {1:'#C0001A',2:'#ECD200',3:'#F07300',4:'#00B050',5:'#0066FF',6:'#8B5E00',7:'#9B5FC0'};
const FNOME  = {1:'Círculo',2:'Ogiva',3:'Triângulo',4:'Quadrado',5:'Estrela',6:'Hexágono',7:'Casinha'};

let gNotas = [];
let gFinger = '';

// ── Shapes ──
function shp(forma, cx, cy, r){
  const h = r*0.88;
  switch(forma){
    case 'circulo':   return `<circle cx="${cx}" cy="${cy}" r="${r*0.82}" stroke-width="1.8"/>`;
    case 'ogiva':     return `<ellipse cx="${cx}" cy="${cy}" rx="${r*0.65}" ry="${r*0.88}" stroke-width="1.8"/>`;
    case 'triangulo': return `<polygon points="${cx},${cy-h} ${cx-h},${cy+h} ${cx+h},${cy+h}" stroke-width="1.8"/>`;
    case 'quadrado':  return `<rect x="${cx-h}" y="${cy-h}" width="${h*2}" height="${h*2}" rx="2" stroke-width="1.8"/>`;
    case 'estrela': {
      const p=[];
      for(let i=0;i<5;i++){const a=Math.PI/2+i*2*Math.PI/5-Math.PI/2,b=Math.PI/2+(i+.5)*2*Math.PI/5-Math.PI/2;p.push(`${cx+h*Math.cos(a)},${cy-h*Math.sin(a)}`,`${cx+h*.42*Math.cos(b)},${cy-h*.42*Math.sin(b)}`);}
      return `<polygon points="${p.join(' ')}" stroke-width="1.4"/>`;
    }
    case 'hexagono': {
      const p=[];for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3;p.push(`${cx+h*Math.cos(a)},${cy-h*Math.sin(a)}`);}
      return `<polygon points="${p.join(' ')}" stroke-width="1.8"/>`;
    }
    case 'casinha':  return `<polygon points="${cx-h*1.08},${cy+h} ${cx-h*1.08},${cy} ${cx},${cy-h*1.25} ${cx+h*1.08},${cy} ${cx+h*1.08},${cy+h}" stroke-width="1.8"/>`;
    default:          return `<circle cx="${cx}" cy="${cy}" r="${r*0.78}" stroke-width="1.8"/>`;
  }
}

// ── Fretboard ──
function drawFretboard(notas){
  const svg=$('#fretboard');
  const W=480,H=280,ML=48,MR=16,MT=20,MB=18;
  const fw=(W-ML-MR)/12,sh=(H-MT-MB)/5;
  let h='';
  h+=`<rect width="${W}" height="${H}" rx="10" fill="var(--surf)"/>`;
  function s(x){return x.toFixed(1)}
  // fret lines
  for(let f=0;f<=12;f++){
    const x=ML+f*fw;
    h+=`<line x1="${s(x)}" y1="${MT}" x2="${s(x)}" y2="${s(H-MB)}" stroke="var(--text)" stroke-width="${f===0?3:1}" opacity=".5"/>`;
  }
  // strings
  for(let s=0;s<6;s++){
    const y=MT+s*sh;
    h+=`<line x1="${ML}" y1="${s(y)}" x2="${s(W-MR)}" y2="${s(y)}" stroke="var(--text)" stroke-width="${(.8+s*.18).toFixed(2)}" opacity=".6"/>`;
  }
  // fret markers
  for(const [f,n] of Object.entries(FDOTS)){
    if(f>12)break;
    const x=ML+(f-.5)*fw;
    if(n==2){
      h+=`<circle cx="${s(x)}" cy="${s(MT+1.5*sh)}" r="3.5" fill="var(--text2)" opacity=".6"/>`;
      h+=`<circle cx="${s(x)}" cy="${s(MT+3.5*sh)}" r="3.5" fill="var(--text2)" opacity=".6"/>`;
    }else{
      h+=`<circle cx="${s(x)}" cy="${s(MT+2.5*sh)}" r="3.5" fill="var(--text2)" opacity=".6"/>`;
    }
  }
  // fret numbers at bottom
  for(let f=1;f<=12;f++){
    const x=ML+(f-.5)*fw;
    h+=`<text x="${s(x)}" y="${s(H-3)}" text-anchor="middle" font-size="8" fill="var(--text2)" opacity=".7" font-family="serif">${FNAMES[f]}</text>`;
  }
  // string names at left
  for(let s=0;s<6;s++){
    const y=MT+s*sh;
    h+=`<text x="14" y="${s(y+4)}" font-size="11" font-weight="600" fill="var(--text2)" font-family="monospace">${STRS[5-s]}</text>`;
  }
  // nut label
  h+=`<text x="${s(ML-5)}" y="${s(H-3)}" text-anchor="end" font-size="8" fill="var(--text2)" opacity=".7" font-family="serif">0</text>`;
  // notes
  if(notas&&notas.length){
    for(const n of notas){
      const p=n.posicao;if(!p)continue;
      const si=6-p.string,fr=p.fret;if(fr>12)continue;
      const cx=ML+(fr-.5)*fw,cy=MT+si*sh;
      const r=Math.min(fw*.3,sh*.34);
      const cor=n.cor||CORES[n.grau]||'#888';
      const fm=n.forma||'circulo';
      h+=`<circle cx="${s(cx)}" cy="${s(cy)}" r="${s(r+2)}" fill="var(--bg)" opacity=".6"/>`;
      h+=`<g fill="${cor}" stroke="${cor}" opacity=".92">${shp(fm,cx,cy,r)}</g>`;
      h+=`<text x="${s(cx)}" y="${s(cy+3.5)}" text-anchor="middle" font-size="${s(Math.round(r*.75))}" fill="#fff" font-weight="bold">${n.grau}</text>`;
      h+=`<title>${n.nota} — grau ${n.grau} — ${n.forma_nome||fm} — corda ${p.string} casa ${FNAMES[fr]||fr}</title>`;
    }
  }else{
    h+=`<text x="${W/2}" y="${H/2}" text-anchor="middle" font-size="13" fill="var(--text2)" opacity=".6">Digite uma sintaxe e clique Parse</text>`;
  }
  svg.innerHTML=h;
}

// ── Tab staff with RNFG shapes ──
function drawTabStaff(notas){
  const svg=$('#tabstaff');
  const W=480,H=70,ML=26,MR=16,MT=5;
  const ls=(H-MT-5)/5;
  let h='';
  const s=(x)=>x.toFixed(1);
  h+=`<rect width="${W}" height="${H}" rx="8" fill="var(--surf)"/>`;
  // 6 lines
  for(let i=0;i<6;i++){
    const y=MT+i*ls;
    h+=`<line x1="${ML}" y1="${s(y)}" x2="${s(W-MR)}" y2="${s(y)}" stroke="var(--text)" stroke-width="${s(.7+i*.15)}" opacity=".35"/>`;
  }
  // string names
  for(let i=0;i<6;i++){
    const y=MT+i*ls;
    h+=`<text x="7" y="${s(y+3)}" font-size="9" font-weight="600" fill="var(--text2)" font-family="monospace">${STRS[5-i]}</text>`;
  }
  // shapes
  if(notas&&notas.length){
    const sp=(W-ML-MR)/Math.max(notas.length,1);
    for(let idx=0;idx<notas.length;idx++){
      const n=notas[idx];
      const p=n.posicao;if(!p)continue;
      const si=6-p.string;
      const x=ML+sp*(idx+.5);
      const y=MT+si*ls;
      const r=Math.min(sp*.3,ls*.32);
      const cor=n.cor||CORES[n.grau]||'#888';
      const fm=n.forma||'circulo';
      h+=`<circle cx="${s(x)}" cy="${s(y)}" r="${s(r+1.5)}" fill="var(--bg)" opacity=".55"/>`;
      h+=`<g fill="${cor}" stroke="${cor}" opacity=".9">${shp(fm,x,y,r)}</g>`;
      h+=`<text x="${s(x)}" y="${s(y+3)}" text-anchor="middle" font-size="${s(Math.round(r*.7))}" fill="#fff" font-weight="bold">${n.grau}</text>`;
    }
    // bar lines (rough: every ~4 notes)
    const barW=sp*4;
    for(let i=0;i<=Math.ceil(notas.length/4);i++){
      const x=ML+i*barW;
      h+=`<line x1="${s(x)}" y1="${MT}" x2="${s(x)}" y2="${s(MT+5*ls)}" stroke="var(--text)" stroke-width=".7" opacity=".2"/>`;
    }
  }
  svg.innerHTML=h;
}

// ── Legend ──
function drawLegend(notas){
  const div=$('#legend');
  if(!notas||!notas.length){div.innerHTML='<span style="opacity:.4">Nenhuma nota</span>';return;}
  const seen=new Set();
  div.innerHTML=notas.map(n=>{
    if(seen.has(n.grau))return '';
    seen.add(n.grau);
    const c=n.cor||CORES[n.grau]||'#888';
    return `<span class="legend-item"><span class="legend-swatch" style="background:${c};box-shadow:0 0 6px ${c}44"></span>${n.nome_rom} – ${n.forma_nome||n.forma}</span>`;
  }).filter(Boolean).join('');
}

// ── Touch pad ──
function ins(t){
  const ta=$('#sintaxe');
  ta.value = ta.value + t;
  ta.dispatchEvent(new Event('input',{bubbles:true}));
  ta.scrollTop = ta.scrollHeight;
}
$$('.pad-note').forEach(b=>b.addEventListener('click',(e)=>{
  e.preventDefault();
  const n=b.dataset.note;
  if(n==='-'){ins('-');return;}
  let x=n;
  if(gFinger){x+='{'+gFinger+'}';gFinger='';updateFG();}
  ins(x);
}));
$$('[data-act]').forEach(b=>b.addEventListener('click',(e)=>{
  e.preventDefault();
  const a=b.dataset.act;
  if(a==='oct-up')ins("'");
  else if(a==='oct-down')ins('`');
  else if(a==='sharp')ins('#');
  else if(a==='flat')ins('b');
}));
$$('.fg-btn').forEach(b=>b.addEventListener('click',(e)=>{
  e.preventDefault();
  gFinger=gFinger===b.dataset.fg?'':b.dataset.fg;
  updateFG();
}));
function updateFG(){$$('.fg-btn').forEach(b=>b.classList.toggle('active',b.dataset.fg===gFinger))}

// ── Examples ──
(async()=>{
  try{
    const r=await fetch('/api/exemplos');
    const d=await r.json();
    if(!d.ok||!d.exemplos)return;
    const sel=$('#exemplosSelect');
    d.exemplos.forEach(ex=>{
      const o=document.createElement('option');
      o.value=ex.sintaxe;o.textContent=ex.nome;
      sel.appendChild(o);
    });
    sel.addEventListener('change',function(){if(this.value){$('#sintaxe').value=this.value;this.value='';parse();}});
  }catch(e){}
})();

// ── Parse ──
let pt;
$('#sintaxe').addEventListener('input',()=>{clearTimeout(pt);pt=setTimeout(parse,500)});
$('#parseBtn').addEventListener('click',parse);

async function parse(){
  const s=$('#sintaxe').value.trim();
  const st=$('#status');
  if(!s){st.textContent='';drawFretboard([]);drawTabStaff([]);drawLegend([]);return;}
  st.innerHTML='<span class="spinner"></span>';
  $('#parseBtn').disabled=true;
  try{
    const r=await fetch('/api/parse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sintaxe:s,tonalidade:'C'})});
    const d=await r.json();
    if(!d.ok){st.textContent='✗ '+d.erro;return;}
    gNotas=d.notas||[];
    drawFretboard(gNotas);
    drawTabStaff(gNotas);
    drawLegend(gNotas);
    const comNotas=gNotas.filter(n=>n.posicao).length;
    st.textContent=`${gNotas.length} notas · ${comNotas} no braço`;
  }catch(e){st.textContent='✗ Erro de conexão';}
  finally{$('#parseBtn').disabled=false;}
}

// ── Clear ──
$('#clearBtn').addEventListener('click',()=>{
  if($('#sintaxe').value&&!confirm('Limpar?'))return;
  $('#sintaxe').value='';gNotas=[];
  drawFretboard([]);drawTabStaff([]);drawLegend([]);
  $('#status').textContent='';
  $('#sintaxe').focus();
});

// ── PDF ──
$('#exportPdfBtn').addEventListener('click',async function(){
  const s=$('#sintaxe').value.trim();
  if(!s){alert('Digite uma sintaxe');return;}
  const titulo=$('#titleField').value.trim()||'Real Tablatura';
  const autor=$('#authorField').value.trim()||'Synemusic';
  this.textContent='Gerando…';this.disabled=true;
  try{
    const r=await fetch('/api/render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sintaxe:s,titulo,autor,compasso:'4/4'})});
    const d=await r.json();
    if(!d.ok){alert('Erro: '+(d.erro||d.log||'?'));return;}
    if(d.pdf){
      const bin=Uint8Array.from(atob(d.pdf),c=>c.charCodeAt(0));
      const blob=new Blob([bin],{type:'application/pdf'});
      const url=URL.createObjectURL(blob);
      const viewer=$('#pdf-viewer');
      viewer.src=url;
      $('#pdf-viewer-card').classList.add('open');
      viewer.onload=()=>URL.revokeObjectURL(url);
      const a=document.createElement('a');
      a.href=url;a.download='realtabula.pdf';a.click();
    }else{alert('PDF sem dados');}
  }catch(e){alert('Erro: '+e.message);}
  finally{this.textContent='PDF';this.disabled=false;}
});
$('#closePdfBtn').addEventListener('click',()=>{$('#pdf-viewer-card').classList.remove('open');$('#pdf-viewer').src='';});

// ── Audio Player ──
let audioCtx=null,osc=null,gain=null,playing=false,paused=false;
let audioTimer=null,audioIdx=0,audioNotes=[];
const FRQ=[261.63,293.66,329.63,349.23,392.00,440.00,493.88]; // C D E F G A B

$('#bpmSlider').addEventListener('input',function(){$('#bpmVal').textContent=this.value});

function noteFreq(notaNome,oitava){
  const map={'C':0,'C#':1,'Db':1,'D':2,'D#':3,'Eb':3,'E':4,'F':5,'F#':6,'Gb':6,'G':7,'G#':8,'Ab':8,'A':9,'A#':10,'Bb':10,'B':11,'Cb':11,'B#':0};
  const semi=map[notaNome]||0;
  const midi=60+semi+(oitava-4)*12;
  return 440*Math.pow(2,(midi-69)/12);
}

function playNote(freq,duration){
  if(!audioCtx)return;
  const o=audioCtx.createOscillator();
  const g=audioCtx.createGain();
  o.type='sine';o.frequency.value=freq;
  g.gain.setValueAtTime(0.35,audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+duration);
  o.connect(g);g.connect(audioCtx.destination);
  o.start(audioCtx.currentTime);
  o.stop(audioCtx.currentTime+duration);
}

function audioStop(){
  clearTimeout(audioTimer);audioTimer=null;
  playing=false;paused=false;
  audioIdx=0;
  if(audioCtx){audioCtx.close().catch(()=>{});audioCtx=null;}
  $('#playBtn').textContent='▶';
}

$('#stopBtn').addEventListener('click',audioStop);

$('#playBtn').addEventListener('click',async function(){
  if(paused){
    audioCtx.resume();
    paused=false;
    this.textContent='▶';
    scheduleNext();
    return;
  }
  if(playing){audioStop();return;}
  const s=$('#sintaxe').value.trim();
  if(!s){alert('Digite uma sintaxe');return;}
  // fetch parse to get note positions
  try{
    const r=await fetch('/api/parse',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sintaxe:s,tonalidade:'C'})});
    const d=await r.json();
    if(!d.ok||!d.notas||!d.notas.length){alert('Sem notas para tocar');return;}
    audioNotes=d.notas.filter(n=>n.posicao);
    if(!audioNotes.length){alert('Nenhuma nota posicionada no braço');return;}
  }catch(e){alert('Erro: '+e.message);return;}

  audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  const bpm=parseInt($('#bpmSlider').value)||80;
  const beatDur=60/bpm;
  playing=true;paused=false;audioIdx=0;
  this.textContent='⏹';
  scheduleNext(beatDur);
});

function scheduleNext(beatDur){
  if(!playing||paused||audioIdx>=audioNotes.length){
    if(audioIdx>=audioNotes.length)audioStop();
    return;
  }
  const n=audioNotes[audioIdx];
  const freq=noteFreq(n.nota, n.oitava+4);
  const dur=beatDur*0.9;
  playNote(freq,dur);
  audioIdx++;
  const bpm=parseInt($('#bpmSlider').value)||80;
  audioTimer=setTimeout(()=>scheduleNext(60/bpm),beatDur*1000*0.95);
}

$('#pauseBtn').addEventListener('click',()=>{
  if(audioCtx&&!paused){
    audioCtx.suspend();
    paused=true;
    $('#playBtn').textContent='▶';
  }
});

// ── Theme ──
$('#themeToggle').addEventListener('click',()=>{
  document.body.classList.toggle('light');
  const is=document.body.classList.contains('light');
  $('#themeToggle').textContent=is?'☀️':'🌙';
  localStorage.setItem('rt-theme',is?'light':'dark');
});
if(localStorage.getItem('rt-theme')==='light'){
  document.body.classList.add('light');
  $('#themeToggle').textContent='☀️';
}

// ── PWA ──
let ip=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();ip=e;$('#installBtn').hidden=false;$('#installBtn').onclick=()=>{ip.prompt();ip.userChoice.then(()=>{$('#installBtn').hidden=true;ip=null});};});
window.addEventListener('appinstalled',()=>{$('#installBtn').hidden=true;});
if('serviceWorker'in navigator)navigator.serviceWorker.register('/service-worker.js').catch(()=>{});

// ── Init ──
parse();
</script>
</body>
</html>'''

if __name__ == "__main__":
    run(argparse.Namespace(port=PORT))
