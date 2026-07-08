#!/usr/bin/env python3
"""Note Form Pro API — Backend de gerenciamento de campanhas multicanal"""
import os, json, subprocess, glob
from datetime import datetime
from flask import Flask, jsonify, send_file, request

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUTPUT = os.path.join(BASE, "output")
CAMPANHAS = os.path.join(BASE, "campanhas")
REFERENCES = os.path.join(BASE, "references")
PACKAGER = os.path.join(BASE, "packager.py")

app = Flask(__name__)


# ── utils ──

def read_file(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return None

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def list_md(dirpath):
    if not os.path.isdir(dirpath): return []
    files = []
    for f in sorted(os.listdir(dirpath)):
        if f.endswith(".md"):
            fp = os.path.join(dirpath, f)
            files.append({
                "name": f, "path": fp,
                "size": os.path.getsize(fp),
                "mtime": os.path.getmtime(fp),
            })
    return files

def load_angles():
    """Read angulos_rnfg.md and return list of angle entries with their check status."""
    content = read_file(os.path.join(REFERENCES, "angulos_rnfg.md"))
    if not content: return []
    angles = []
    for line in content.split("\n"):
        line = line.rstrip()
        if line.startswith("- [") and "] " in line:
            used = "[x]" in line.lower()
            text = line.split("] ", 1)[1] if "] " in line else line
            angles.append({"text": text, "used": used, "raw": line})
    return angles


# ── STATS ──

@app.route("/api/stats")
def stats():
    booklets = [f for f in os.listdir(OUTPUT) if f.endswith(".pdf") and not any(x in f for x in ["_real", "_forma", "_staffless", "_page", "_p1", "_p2", "_p3", "_p4", "teste", "o_pi_o"])]
    cantigas = [f.replace(".pdf", "") for f in booklets]
    camp_count = len(list_md(CAMPANHAS))
    angles = load_angles()
    used = sum(1 for a in angles if a["used"])
    return jsonify({
        "booklets": len(booklets),
        "cantigas": cantigas,
        "campanhas": camp_count,
        "angles_total": len(angles),
        "angles_used": used,
        "pdf_total": sum(os.path.getsize(os.path.join(OUTPUT, f)) for f in booklets if os.path.isfile(os.path.join(OUTPUT, f))),
    })


# ── BOOKLETS ──

@app.route("/api/booklets")
def list_booklets():
    items = []
    for f in sorted(os.listdir(OUTPUT)):
        if f.endswith(".pdf") and not any(x in f for x in ["_real", "_forma", "_staffless", "_page", "_p1", "_p2", "_p3", "_p4", "teste", "o_pi_o"]):
            fp = os.path.join(OUTPUT, f)
            name = f.replace(".pdf", "").replace("_", " ").title()
            items.append({
                "slug": f.replace(".pdf", ""), "name": name, "filename": f,
                "size": os.path.getsize(fp), "mtime": os.path.getmtime(fp),
                "free": "aranha" in f.lower(),
                "price": "Grátis" if "aranha" in f.lower() else "R$ 17",
            })
    return jsonify(items)

@app.route("/api/booklets/regenerate", methods=["POST"])
def regenerate_booklets():
    try:
        result = subprocess.run(["python3", PACKAGER], capture_output=True, text=True, timeout=120)
        return jsonify({"success": result.returncode == 0, "stdout": result.stdout[-1000:], "stderr": result.stderr[-1000:]})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/pdfs/<path:filename>")
def serve_pdf(filename):
    path = os.path.join(OUTPUT, filename)
    if not os.path.isfile(path): return jsonify({"error": "not found"}), 404
    return send_file(path, mimetype="application/pdf")


# ── CAMPANHAS ──

@app.route("/api/campanhas", methods=["GET"])
def list_campanhas():
    return jsonify(list_md(CAMPANHAS))

@app.route("/api/campanhas/<name>", methods=["GET"])
def get_campanha(name):
    if not name.endswith(".md"): name += ".md"
    content = read_file(os.path.join(CAMPANHAS, name))
    if content is None: return jsonify({"error": "not found"}), 404
    return jsonify({"name": name, "content": content})

@app.route("/api/campanhas", methods=["POST"])
def create_campanha():
    data = request.get_json()
    name = data.get("name", "").strip()
    content = data.get("content", "")
    if not name: return jsonify({"error": "name required"}), 400
    if not name.endswith(".md"): name += ".md"
    path = os.path.join(CAMPANHAS, name)
    write_file(path, content)
    return jsonify({"name": name, "saved": True})

@app.route("/api/campanhas/<name>", methods=["PUT"])
def update_campanha(name):
    if not name.endswith(".md"): name += ".md"
    data = request.get_json()
    content = data.get("content", "")
    path = os.path.join(CAMPANHAS, name)
    write_file(path, content)
    return jsonify({"name": name, "saved": True})

@app.route("/api/campanhas/<name>", methods=["DELETE"])
def delete_campanha(name):
    if not name.endswith(".md"): name += ".md"
    path = os.path.join(CAMPANHAS, name)
    if os.path.isfile(path):
        os.remove(path)
        return jsonify({"deleted": True})
    return jsonify({"error": "not found"}), 404


@app.route("/api/campanhas/generate", methods=["POST"])
def generate_campanha():
    """Generate campaign structure from theme + pillar using templates."""
    data = request.get_json()
    theme = data.get("theme", "")
    pillar = data.get("pillar", "O Que É RNFG")
    target_lead = data.get("target", "A Dona Aranha (grátis)")

    if not theme:
        return jsonify({"error": "theme required"}), 400

    slug = theme.lower().replace(" ", "_")[:40]
    hoje = datetime.now().strftime("%Y-%m-%d")

    content = f"""# {theme} — Campanha Funil Synemusic
**Pilar**: {pillar} · **Data**: {hoje} · **Lead**: {target_lead}

---

## 1. Base (Blog/Newsletter) — [título editorial]

**Título SEO**: {theme} — Metodologia RNFG

**Meta-descrição**: [150 caracteres]

**Gancho (primeira linha)**:
[abertura que prende]

**Corpo**:
[1200-2000 palavras, voz Synemusic: autoridade acessível, prova real quando possível]

**CTA para lead**:
📥 Baixe a partitura grátis: [link lead magnet]

---

## 2. YouTube

**Título**: {theme} — RNFG Explicado

**Descrição**:
```
[texto SEO com links]
▸ 0:00 Gancho
▸ 0:30 Desenvolvimento
▸ [min] CTA
```

**Gancho de abertura (15s)**:
[obrigatório: mostrar a virada visual na tela]

---

## 3. Facebook

**Imagem**: [descrição da imagem]

**Texto do post**:
```
[3-5 linhas, gancho na primeira]
CTA: Comenta qual [pergunta de engajamento]
```

---

## 4. Instagram

**Legenda**:
```
[gancho nos primeiros 150 caracteres]
.
.
.
[CTA: Salva + link na bio]
```

**Carrossel (6 cards)**:
| Card | Conteúdo |
|------|----------|
| 1 | [gancho visual] |
| 2 | [conceito] |
| 3 | [exemplo] |
| 4 | [demonstração] |
| 5 | [prova/produto] |
| 6 | [CTA] |

**Reels (20-25s)**: [roteiro quadro a quadro]

**Stories (3)**: [enquete/pergunta/CTA]

---

## Checklist de Produção
- [ ] Takes visuais capturados
- [ ] Legenda/roteiro aprovado
- [ ] Links configurados
- [ ] Agendado para publicação
"""

    filename = f"{slug}.md"
    path = os.path.join(CAMPANHAS, filename)
    write_file(path, content)

    return jsonify({"name": filename, "saved": True})


# ── NFP RENDER (proxy para Cromus Studio) ──

@app.route("/api/nfp/render", methods=["POST"])
def nfp_render():
    data = request.get_json()
    try:
        proc = subprocess.run(
            ["curl", "-s", "--max-time", "180",
             "-X", "POST", "http://localhost:4242/render",
             "-H", "Content-Type: application/json",
             "-d", json.dumps(data)],
            capture_output=True, text=True, timeout=190)
        if proc.returncode == 0 and proc.stdout:
            return jsonify(json.loads(proc.stdout))
        return jsonify({"ok": False, "log": proc.stderr or "Resposta vazia"})
    except subprocess.TimeoutExpired:
        return jsonify({"ok": False, "log": "Timeout ao compilar partitura"}), 504
    except Exception as e:
        return jsonify({"ok": False, "log": str(e)}), 500


# ── NFP NORMALIZAR (voz → sintaxe Cromus, conversor local, sem API) ──

NOTA_PARA_GRAU = {
    "do": "1", "dó": "1", "doh": "1",
    "re": "2", "ré": "2", "rey": "2",
    "mi": "3", "mih": "3",
    "fa": "4", "fá": "4", "fah": "4",
    "sol": "5", "sól": "5", "sohl": "5",
    "la": "6", "lá": "6", "lah": "6",
    "si": "7", "sih": "7",
}

ACIDENTES = {
    "sustenido": "#", "sustentido": "#", "sharp": "#",
    "bemol": "b", "bemól": "b", "flat": "b",
    "meio tom acima": "#", "meio tom abaixo": "b",
}

PALAVRAS_DESCARTE = {
    "o", "a", "os", "as", "um", "uma", "de", "da", "do", "das", "dos",
    "em", "no", "na", "nos", "nas", "com", "pra", "para", "e", "mas",
    "que", "tem", "tô", "estou", "eu", "vou", "nota", "grau",
}

OITAVA_MAP = {
    "oitava acima": "'", "oitava abaixo": ",",
    "agudo": "'", "grave": ",",
    "prima": "", "segunda": "2", "terça": "3",
    "quarta": "4", "quinta": "5", "sexta": "6", "sétima": "7",
}


def _aplicar_acento(palavra):
    """Remove acentos para matching."""
    import unicodedata
    return "".join(
        c for c in unicodedata.normalize("NFD", palavra)
        if unicodedata.category(c) != "Mn"
    )


def texto_para_sintaxe(texto: str) -> str:
    tokens = texto.lower().split()
    saida = []
    i = 0
    while i < len(tokens):
        t = tokens[i]
        t_clean = _aplicar_acento(t).strip(",.!?;:")
        t_raw = t.strip(",.!?;:")

        if t_raw in ("-", "pausa", "pausa."):
            saida.append("-")
            i += 1
            continue

        if t_raw in ("fim", "final"):
            saida.append("FIM")
            i += 1
            continue

        if t_raw in NOTA_PARA_GRAU:
            grau = NOTA_PARA_GRAU[t_raw]
            i += 1
            if i < len(tokens):
                prox = _aplicar_acento(tokens[i]).strip(",.!?;:")
                if prox in ACIDENTES:
                    grau += ACIDENTES[prox]
                    i += 1
            saida.append(grau)
            continue

        if t_clean.isdigit() and 1 <= int(t_clean) <= 7:
            grau = t_clean
            i += 1
            if i < len(tokens):
                prox = _aplicar_acento(tokens[i]).strip(",.!?;:")
                if prox in ACIDENTES:
                    grau += ACIDENTES[prox]
                    i += 1
            saida.append(grau)
            continue

        if t_raw not in PALAVRAS_DESCARTE and t_raw not in OITAVA_MAP:
            saida.append(t_raw)

        i += 1

    return " ".join(saida)


@app.route("/api/nfp/normalizar", methods=["POST"])
def nfp_normalizar():
    """Recebe texto transcrito por voz e converte para sintaxe Cromus (local, sem API)."""
    data = request.get_json()
    texto = (data.get("texto") or "").strip()
    if not texto:
        return jsonify({"ok": False, "erro": "Texto vazio"}), 400
    sintaxe = texto_para_sintaxe(texto)
    return jsonify({"ok": True, "sintaxe": sintaxe, "texto_original": texto})


# ── REFERÊNCIAS ──

@app.route("/api/references")
def list_references():
    return jsonify(list_md(REFERENCES))

@app.route("/api/references/<name>")
def get_reference(name):
    if not name.endswith(".md"): name += ".md"
    content = read_file(os.path.join(REFERENCES, name))
    if content is None: return jsonify({"error": "not found"}), 404
    return jsonify({"name": name, "content": content})

@app.route("/api/references/<name>", methods=["PUT"])
def update_reference(name):
    if not name.endswith(".md"): name += ".md"
    data = request.get_json()
    content = data.get("content", "")
    write_file(os.path.join(REFERENCES, name), content)
    return jsonify({"name": name, "saved": True})


@app.route("/api/angles")
def list_angles():
    return jsonify(load_angles())

@app.route("/api/angles/toggle", methods=["POST"])
def toggle_angle():
    data = request.get_json()
    idx = data.get("index", -1)
    used = data.get("used", True)
    angles = load_angles()
    if idx < 0 or idx >= len(angles):
        return jsonify({"error": "invalid index"}), 400
    content = read_file(os.path.join(REFERENCES, "angulos_rnfg.md"))
    if not content: return jsonify({"error": "file not found"}), 404
    lines = content.split("\n")
    count = 0
    for i, line in enumerate(lines):
        if line.startswith("- [") and "] " in line:
            if count == idx:
                lines[i] = f"- [{'x' if used else ' '}] {angles[idx]['text']}"
                break
            count += 1
    write_file(os.path.join(REFERENCES, "angulos_rnfg.md"), "\n".join(lines))
    return jsonify({"toggled": True, "index": idx, "used": used})


if __name__ == "__main__":
    print(" Note Form Pro API — http://localhost:4243")
    app.run(host="0.0.0.0", port=4243, debug=False)
