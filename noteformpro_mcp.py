#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Note Form Pro — Servidor MCP
=============================
Expõe o motor Cromus como ferramentas para o Claude (Desktop/Code).

Ferramentas:
  1. render_cantiga(sintaxe, titulo, compasso, modo) — compila e salva PDF/PNG
  2. validar_sintaxe(sintaxe, compasso)               — checa erros sem compilar
  3. consultar_biblia(secao)                          — lê regras da bíblia
  4. sintaxe_para_lilypond(sintaxe, compasso)         — só a conversão
  5. status_studio()                                  — verifica servidor/arquivos

Instalação no Claude Desktop/Code: ver noteformpro_mcp_config.json
"""

import os
import re
import sys
import tempfile
import subprocess
import shutil
from pathlib import Path

from mcp.server.fastmcp import FastMCP

# ─── Localização dos arquivos (home do usuário) ───
HOME        = Path.home()
PIPELINE    = HOME / "pipeline.py"
HEADER      = HOME / "cromus_header.ily"
BIBLIA      = HOME / "biblia_cromus.md"
STUDIO      = HOME / "cromus_studio.py"
OUTPUT_DIR  = HOME / "output"
LILYPOND    = shutil.which("lilypond") or "/opt/homebrew/bin/lilypond"

mcp = FastMCP("Note Form Pro")

# ─── Importa o conversor do cromus_studio.py (reusa a lógica canônica) ───
def _carregar_conversor():
    """Importa _sintaxe_para_ly_raw e gerar_arquivo_ly do cromus_studio.py."""
    sys.path.insert(0, str(HOME))
    import importlib.util
    spec = importlib.util.spec_from_file_location("cromus_studio", STUDIO)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

# ════════════════════════════════════════════════════════════
#  FERRAMENTA 1 — Renderizar cantiga
# ════════════════════════════════════════════════════════════
@mcp.tool()
def render_cantiga(sintaxe: str, titulo: str = "Sem título",
                   compasso: str = "2/4", modo: str = "REAL") -> str:
    """Renderiza uma cantiga em Sintaxe Cromus, gerando PDF e PNG.

    Args:
        sintaxe: A Sintaxe Cromus (ex: '1, 1 2, 3, 3 3'). Vírgula = tempo.
        titulo: Título da cantiga (aparece no cabeçalho).
        compasso: Métrica (ex: '2/4', '3/4', '4/4').
        modo: 'REAL' (cores RNFG) ou 'FORMA' (preto).

    Returns:
        Caminho do PDF gerado, ou mensagem de erro com o log do LilyPond.
    """
    try:
        mod = _carregar_conversor()
        conteudo_ly = mod.gerar_arquivo_ly(sintaxe, modo, titulo, compasso)
    except Exception as e:
        return f"ERRO ao converter: {e}"

    OUTPUT_DIR.mkdir(exist_ok=True)
    slug = re.sub(r'[^a-z0-9]+', '_', titulo.lower()).strip('_') or 'cantiga'
    work = tempfile.mkdtemp(prefix="nfp_")
    ly_path = Path(work) / f"{slug}.ly"
    ly_path.write_text(conteudo_ly, encoding="utf-8")
    if HEADER.exists():
        shutil.copy(HEADER, Path(work) / HEADER.name)

    proc = subprocess.run(
        [LILYPOND, "-dno-point-and-click", "--formats=pdf,png",
         "-dresolution=170", "-o", slug, f"{slug}.ly"],
        capture_output=True, text=True, cwd=work, timeout=120)

    pdf_tmp = Path(work) / f"{slug}.pdf"
    if not pdf_tmp.exists():
        return (f"ERRO de compilação LilyPond:\n"
                f"{(proc.stdout or '')}\n{(proc.stderr or '')}")

    destino = OUTPUT_DIR / f"{slug}_{modo}.pdf"
    shutil.copy(pdf_tmp, destino)
    return (f"✅ Cantiga '{titulo}' renderizada com sucesso.\n"
            f"PDF salvo em: {destino}\n"
            f"Modo: {modo} | Compasso: {compasso}")

# ════════════════════════════════════════════════════════════
#  FERRAMENTA 2 — Validar sintaxe
# ════════════════════════════════════════════════════════════
@mcp.tool()
def validar_sintaxe(sintaxe: str, compasso: str = "2/4") -> str:
    """Valida a Sintaxe Cromus sem compilar — detecta erros e checa a métrica.

    Args:
        sintaxe: A Sintaxe Cromus a validar.
        compasso: Métrica para checar o preenchimento dos compassos.

    Returns:
        Relatório de validação: tokens, compassos, avisos de métrica.
    """
    avisos = []
    grupos = [g.strip() for g in sintaxe.split(',') if g.strip()]
    if not grupos:
        return "ERRO: sintaxe vazia."

    # valida cada token
    PAD = re.compile(r"^\(*'?[0-7-](?:[#b])?'?\**\)*$")
    tokens_invalidos = []
    total_tokens = 0
    for g in grupos:
        # remove parênteses de quiáltera para validar tokens internos
        limpo = g.strip('()')
        for tok in re.split(r'[\s*]+', limpo):
            tok = tok.strip()
            if not tok:
                continue
            total_tokens += 1
            base = tok.rstrip('*').strip("'")
            if not re.match(r"^'?[0-7-](?:[#b])?'?$", tok.replace('*','')):
                # checa só o núcleo
                nucleo = re.sub(r"['*#b()]", "", tok)
                if nucleo and not re.match(r'^[0-7-]$', nucleo):
                    tokens_invalidos.append(tok)

    num = compasso.split('/')[0]
    try:
        tempos_por_compasso = int(num)
    except:
        tempos_por_compasso = 4

    n_compassos = len(grupos) / tempos_por_compasso
    rel = [
        f"📋 Validação da Sintaxe Cromus",
        f"   Tempos (grupos por vírgula): {len(grupos)}",
        f"   Tokens totais: {total_tokens}",
        f"   Compasso: {compasso} ({tempos_por_compasso} tempos/compasso)",
        f"   Compassos completos: {n_compassos:.2f}",
    ]
    if tokens_invalidos:
        rel.append(f"   ⚠️ Tokens suspeitos: {', '.join(tokens_invalidos[:10])}")
    if len(grupos) % tempos_por_compasso != 0:
        rel.append(f"   ⚠️ Nº de tempos ({len(grupos)}) não é múltiplo de {tempos_por_compasso} — último compasso incompleto.")
    if not tokens_invalidos and len(grupos) % tempos_por_compasso == 0:
        rel.append("   ✅ Sintaxe válida e métrica fechada.")
    return "\n".join(rel)

# ════════════════════════════════════════════════════════════
#  FERRAMENTA 3 — Consultar a Bíblia
# ════════════════════════════════════════════════════════════
@mcp.tool()
def consultar_biblia(secao: str = "") -> str:
    """Consulta a bíblia_cromus.md (fonte da verdade do sistema).

    Args:
        secao: Termo ou número de seção para buscar (ex: 'quiáltera',
               'durações', 'cores', '3'). Vazio retorna o índice.

    Returns:
        O trecho relevante da bíblia, ou o índice de seções.
    """
    if not BIBLIA.exists():
        return f"ERRO: {BIBLIA} não encontrada."
    texto = BIBLIA.read_text(encoding="utf-8")

    if not secao:
        # retorna só os títulos de seção (índice)
        titulos = re.findall(r'^#{1,3}\s+.+$', texto, re.M)
        return "📕 Índice da Bíblia Cromus:\n" + "\n".join(titulos)

    # busca por seção/termo
    termo = secao.lower()
    blocos = re.split(r'(?=^#{1,3}\s)', texto, flags=re.M)
    achados = [b for b in blocos if termo in b.lower()]
    if achados:
        return "\n\n".join(achados[:3])[:4000]
    # busca por linha
    linhas = [l for l in texto.splitlines() if termo in l.lower()]
    if linhas:
        return "Linhas com '{}':\n".format(secao) + "\n".join(linhas[:20])
    return f"Nada encontrado para '{secao}'. Use consultar_biblia() sem argumento para ver o índice."

# ════════════════════════════════════════════════════════════
#  FERRAMENTA 4 — Só converter (sem compilar)
# ════════════════════════════════════════════════════════════
@mcp.tool()
def sintaxe_para_lilypond(sintaxe: str, compasso: str = "2/4") -> str:
    """Converte Sintaxe Cromus em código LilyPond, sem compilar.

    Args:
        sintaxe: A Sintaxe Cromus.
        compasso: Métrica.

    Returns:
        O bloco LilyPond gerado (notas_ly_raw).
    """
    try:
        mod = _carregar_conversor()
        raw = mod._sintaxe_para_ly_raw(sintaxe, compasso)
        return f"LilyPond gerado:\n{raw}"
    except Exception as e:
        return f"ERRO: {e}"

# ════════════════════════════════════════════════════════════
#  FERRAMENTA 5 — Status do sistema
# ════════════════════════════════════════════════════════════
@mcp.tool()
def status_studio() -> str:
    """Verifica o estado do sistema Note Form Pro (arquivos e LilyPond)."""
    checks = []
    for nome, p in [("pipeline.py", PIPELINE), ("cromus_header.ily", HEADER),
                    ("biblia_cromus.md", BIBLIA), ("cromus_studio.py", STUDIO)]:
        checks.append(f"   {'✅' if p.exists() else '❌'} {nome}")
    ly = "✅" if Path(LILYPOND).exists() or shutil.which("lilypond") else "❌"
    checks.append(f"   {ly} LilyPond ({LILYPOND})")
    n_pdfs = len(list(OUTPUT_DIR.glob('*.pdf'))) if OUTPUT_DIR.exists() else 0
    checks.append(f"   📄 PDFs em output/: {n_pdfs}")
    return "🎼 Note Form Pro — Status do sistema:\n" + "\n".join(checks)


if __name__ == "__main__":
    mcp.run()
