#!/usr/bin/env python3
import os
import re
import subprocess

# ─────────────────────────────────────────────────────────────
# CATÁLOGO DE CANTIGAS
# ─────────────────────────────────────────────────────────────
_DONA_ARANHA = {
    "titulo": "A Dona Aranha",
    "compositor": "Domínio Público",
    "notas_ly_raw": r"""
  \time 2/4
  \tempo 4 = 96
  \key c \major

  c'4 c'8 d'8
  e'4 e'8 e'8
  d'8 c'8 d'8 e'8
  c'4 c'4
  \break
  c'8 c'8 c'8 d'8
  e'4 e'4
  d'8 c'8 d'8 e'8
  c'4 r4
  \break
  a'8 a'8 a'8 a'8
  g'4 e'8 c'8
  a'8 a'8 a'8 a'8
  g'4 e'4
  \break
  \set Score.repeatCommands = #'(start-repeat)
  c'8 c'8 c'8 d'8
  e'4 e'8 e'8
  d'8 c'8 d'8 e'8
  \set Score.repeatCommands = #'((volta "1"))
  c'4 r4
  \set Score.repeatCommands = #'((volta #f) end-repeat (volta "2"))
  c'4 c'4
  \set Score.repeatCommands = #'((volta #f))
  c'8 c'8 c'8 d'8
  e'4 e'8 e'8
  d'8 c'8 d'8 e'8
  c'4 r4_ \markup { \bold "Fim" } \bar "|."
""",
}

_PEIXE_VIVO = {
    "titulo": "Peixe Vivo",
    "compositor": "Domínio Público",
    "notas_ly_raw": r"""
  \time 2/4
  \tempo 4 = 100
  \key c \major

  r4 e'8 g'8
  g'8 f'8 f'8 a'8
  a'8 g'8 e'8 g'8
  g'8 f'8 d'8 f'8
  \break
  f'8 e'8 e'8 g'8
  g'8 f'8 f'8 a'8
  a'8 g'8 e'8 g'8
  g'8 f'8 d'8 e'8
  \break
  c'4 r16 r16 c'16 c'16
  a'8. b'16 c''8. b'16
  a'8 g'8~ g'8 c'16 c'16
  a'8. b'16 c''8. b'16
  \break
  a'8 g'8 e'8 g'8
  g'8 f'8 f'8 a'8
  a'8 g'8 e'8 g'8
  g'4 f'4
  \break
  d'8 f'8 f'8 e'8
  e'8 g'8 g'8 f'8
  f'8 a'8 a'8 g'8
  e'8 g'8 g'8 f'8
  d'8 e'8 c'4_ \markup { \bold "Fim" } \bar "|."
""",
}

_CARANGUEJO = {
    "titulo": "Caranguejo",
    "compositor": "Domínio Público",
    "notas_ly_raw": r"""
  \time 2/4
  \tempo 4 = 100
  \key c \major

  r4 r16 r16 e'16 f'16
  g'8 g'8 f'8 e'8
  a'8 a'8 r16 r16 d'16 e'16
  f'8 f'8 e'8 d'8
  \break
  g'4 r16 r16 e'16 f'16
  g'8 g'8 f'8 e'8
  a'8 c''8 b'8 a'8
  g'8 f'8 e'8 d'8
  \break
  c'4 r16 r16 e'16 f'16
  g'8 g'8 f'8 e'8
  a'8 a'8 r16 r16 d'16 e'16
  f'8 f'8 e'8 d'8
  \break
  g'4 r16 r16 e'16 f'16
  g'8 g'8 f'8 e'8
  a'8 c''8 b'8 a'8
  g'8 f'8 e'8 d'8
  c'4 r4_ \markup { \bold "Fim" } \bar "|."
""",
}

_O_CRAVO = {
    "titulo": "O Cravo Brigou com a Rosa",
    "compositor": "Domínio Público",
    "notas_ly_raw": r"""
  \time 3/4
  \tempo 4 = 100
  \key c \major
  \partial 4 g'4

  \set Score.repeatCommands = #'(start-repeat)
  g'4 e'8 c''8 b'8 a'8
  g'4 f'4 a'4
  a'4 f'8 c''8 b'8 a'8
  a'4~ a'4 a'4
  \break
  c'4 c''8 c''8 d'8 c'8
  b'4 a'4 a'4
  g'4 b'8 a'8 f'8 d'8
  \set Score.repeatCommands = #'((volta "1"))
  c'4~ c'4 c'4
  \set Score.repeatCommands = #'((volta #f) end-repeat (volta "2"))
  c'4~ c'2
  \set Score.repeatCommands = #'((volta #f))
  \bar "|."_ \markup { \bold "Fim" }
""",
}

CANTIGAS = [
    _DONA_ARANHA,
    _PEIXE_VIVO,
    _CARANGUEJO,
    # _O_CRAVO,       # ← reativar quando necessário
    {
        "titulo": "O Pião",
        "compositor": "Domínio Público",
        "notas_ly_raw": r"""
  \time 2/4
  \tempo 4 = 100
  \key c \major
  \partial 4 r16 r16 g'16 g'16

  c''8 c''16 b'8 c''8
  c''16 b'8 a'16 g'8 g'16 g'16
  c''8 c''16 b'8 c''8
  c''16 b'8 a'16 g'4
  \break
  c''16 g'8 e'16 d'8 g'8
  f'16 e'8 d'16 c'4
  c''16 g'8 e'16 d'8 g'8
  f'16 e'8 d'16 c'8 g'16 g'16
  \break
  \set Score.repeatCommands = #'(start-repeat)
  c''8 c''8 c''8 b'8
  d'4 r8 b'16 c''16
  d''16 b'8 c''16 d''8 b'8
  \set Score.repeatCommands = #'((volta "1"))
  g'4 r8 g'16 g'16
  \set Score.repeatCommands = #'((volta #f) end-repeat (volta "2"))
  g'4 r8 g'8
  \set Score.repeatCommands = #'((volta #f))
  \break
  e'8 g'8 e'8 g'8
  c''4 r16 r16 g'16 g'16
  g'16 g'8 g'16 a'8 g'8
  d'4 r8 g'8
  \break
  e'8 g'8 e'8 g'8
  c'4 r8 g'8
  a'16 g'8 g'16 a'8 b'8
  c''4 r4 \bar "|."_ \markup { \bold "Fim" }
""",
    }
]

# ─────────────────────────────────────────────────────────────
# CONVERSOR DE NOTAS  (grau + duração → LilyPond)
#   1-7 = grau da escala em Dó maior
#   m = mínima (2), s = semínima (4), c = colcheia (8)
# ─────────────────────────────────────────────────────────────
_PITCH = {1: "c'", 2: "d'", 3: "e'", 4: "f'", 5: "g'", 6: "a'", 7: "b'"}
_DUR   = {"m": ("2", 2.0), "s": ("4", 1.0), "c": ("8", 0.5)}

# ─────────────────────────────────────────────────────────────
# INSTRUMENTOS DE CORDA / TABLATURA
#   Ver biblia_cromus.md §9 — especificação validada com LilyPond real.
#   Ativado por cantiga: adicione "instrumento": "ukulele" (e opcionalmente
#   "afinacao": "sol_agudo" | "sol_grave") ao dicionário da cantiga.
#   Sem essas chaves, gerar_ly() se comporta exatamente como antes.
# ─────────────────────────────────────────────────────────────
INSTRUMENTOS = {
    "ukulele": {
        "cordas": 4,
        "afinacoes": {
            "sol_agudo": {  # reentrante — padrão soprano/concerto
                "label": "Sol agudo, Dó, Mi, Lá (reentrante — padrão)",
                "lilypond": "#ukulele-tuning",
            },
            "sol_grave": {  # linear — comum no tenor
                "label": "Sol grave, Dó, Mi, Lá (linear)",
                "lilypond": r"\stringTuning <g c' e' a'>",
            },
        },
        "afinacao_default": "sol_agudo",
    },
}


def _slug(titulo: str) -> str:
    s = titulo.lower()
    for orig, repl in [
        ("á","a"),("à","a"),("ã","a"),("â","a"),
        ("é","e"),("ê","e"),("í","i"),
        ("ó","o"),("ô","o"),("õ","o"),("ú","u"),("ç","c"),
    ]:
        s = s.replace(orig, repl)
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")


def _converter_notas(notas_str: str, compasso: str, compassos_por_linha: int) -> str:
    num, denom = compasso.split("/")
    beats_max = int(num) * 4.0 / int(denom)
    tokens = notas_str.split()
    partes: list = []
    beat, idx = 0.0, 0
    for t in tokens:
        grau, dur_ch = int(t[:-1]), t[-1]
        lily_dur, beats = _DUR[dur_ch]
        partes.append(_PITCH[grau] + lily_dur)
        beat += beats
        if beat >= beats_max - 1e-9:
            idx += 1
            beat = 0.0
            partes.append("|")
            if idx % compassos_por_linha == 0:
                partes.append(r"\break")
    return " ".join(partes)


# ─────────────────────────────────────────────────────────────
# GERADOR DE ARQUIVO LILYPOND
# ─────────────────────────────────────────────────────────────

def gerar_ly(cantiga: dict, saida_ly: str, modo: str = "REAL") -> None:
    titulo     = cantiga["titulo"]
    compositor = cantiga.get("compositor", "")
    instrumento_nome = cantiga.get("instrumento")

    # ── MODO TABLATURA (instrumentos de corda) ──────────────────────
    # Só ativa quando a cantiga define "instrumento" explicitamente.
    # Pauta RNFG (colorida) em cima + tablatura embaixo, sincronizadas —
    # a mesma música é usada nas duas. A tab mostra ritmo (\tabFullNotation)
    # e os números de casa ganham a cor/forma do grau atrás (mesmo motor
    # do cromus_header.ily, via cromus-tab-engraver-factory). Ver biblia §9.4.
    if instrumento_nome:
        if instrumento_nome not in INSTRUMENTOS:
            raise ValueError(
                f"Instrumento '{instrumento_nome}' não especificado em INSTRUMENTOS. "
                f"Disponíveis: {', '.join(INSTRUMENTOS)}."
            )
        perfil = INSTRUMENTOS[instrumento_nome]
        afinacao_nome = cantiga.get("afinacao", perfil["afinacao_default"])
        if afinacao_nome not in perfil["afinacoes"]:
            raise ValueError(
                f"Afinação '{afinacao_nome}' não existe para '{instrumento_nome}'. "
                f"Disponíveis: {', '.join(perfil['afinacoes'])}."
            )
        tuning_ly = perfil["afinacoes"][afinacao_nome]["lilypond"]

        if "notas_ly_raw" in cantiga:
            corpo_notas = cantiga["notas_ly_raw"]
        else:
            compasso    = cantiga["compasso"]
            andamento   = cantiga.get("andamento", 80)
            c_por_linha = cantiga.get("compassos_por_linha", 4)
            notas_lily  = _converter_notas(cantiga["vozes"][0]["notas"], compasso, c_por_linha)
            corpo_notas = (
                f'\\time {compasso}\n'
                f'\\tempo 4 = {andamento}\n\n'
                f'{notas_lily}\n'
            )

        conteudo = (
            '\\version "2.26.0"\n\n'
            '\\include "cromus_header.ily"\n\n'
            '\\header {\n'
            f'  title    = "{titulo}"\n'
            f'  composer = "{compositor}"\n'
            '  tagline  = ##f\n'
            '}\n\n'
            '#(set-global-staff-size 32)\n\n'
            f'musicaTab = {{\n{corpo_notas}\n}}\n\n'
            '\\score {\n'
            '  <<\n'
            '    \\new Staff \\with {\n'
            f'      \\consists #(cromus-engraver-factory "{modo}")\n'
            '    } { \\clef treble \\musicaTab }\n'
            '    \\new TabStaff \\with {\n'
            f'      \\consists #(cromus-tab-engraver-factory "{modo}")\n'
            '    } {\n'
            f'      \\set TabStaff.stringTunings = {tuning_ly}\n'
            '      \\tabFullNotation\n'
            '      \\musicaTab\n'
            '      \\bar "|."\n'
            '    }\n'
            '  >>\n'
            '  \\layout { }\n'
            '}\n'
        )
        os.makedirs(os.path.dirname(saida_ly), exist_ok=True)
        with open(saida_ly, "w", encoding="utf-8") as f:
            f.write(conteudo)
        return

    # ── MODO PARTITURA RNFG (comportamento original — inalterado) ───
    usando_raw = "notas_ly_raw" in cantiga
    tem_letra  = usando_raw and "letra_ly" in cantiga

    _modo_engraver = "REAL" if modo == "STAFFLESS" else modo

    if usando_raw:
        bloco_layout = (
            '  \\layout {\n'
            '    \\context {\n'
            '      \\Score\n'
            '      \\override SpacingSpanner.uniform-stretching = ##t\n'
            '    }\n'
            '  }\n'
        )
        if modo == "STAFFLESS":
            bloco_staffless_overrides = (
                '      \\stopStaff\n'
                '      \\omit Staff.BarLine\n'
                '      \\omit Staff.Clef\n'
                '      \\omit Staff.TimeSignature\n'
                '      \\omit Staff.KeyCancellation\n'
                '      \\omit Staff.Accidental\n'
                '      \\omit Staff.LedgerLineSpanner\n'
            )
        else:
            bloco_staffless_overrides = ''
        if tem_letra:
            bloco_staff = (
                '    \\new Voice = "melodia" {\n'
                + bloco_staffless_overrides
                + '      \\clef treble\n'
                + cantiga["notas_ly_raw"] +
                '    }\n'
                '    \\new Lyrics \\lyricsto "melodia" {\n'
                + cantiga["letra_ly"] +
                '    }\n'
            )
        else:
            bloco_staff = (
                bloco_staffless_overrides
                + '    \\clef treble\n'
                + cantiga["notas_ly_raw"]
            )
    else:
        compasso    = cantiga["compasso"]
        andamento   = cantiga.get("andamento", 80)
        c_por_linha = cantiga.get("compassos_por_linha", 4)
        tonalidade  = cantiga["tonalidade"]
        notas_lily  = _converter_notas(cantiga["vozes"][0]["notas"], compasso, c_por_linha)
        if modo == "STAFFLESS":
            bloco_staff = (
                '    {\n'
                '      \\stopStaff\n'
                '      \\omit Staff.BarLine\n'
                '      \\omit Staff.Clef\n'
                '      \\omit Staff.TimeSignature\n'
                '      \\omit Staff.KeyCancellation\n'
                '      \\omit Staff.Accidental\n'
                '      \\omit Staff.LedgerLineSpanner\n'
                '      \\clef treble\n'
                f'      \\key {tonalidade}\n'
                f'      \\time {compasso}\n'
                f'      \\tempo 4 = {andamento}\n\n'
                f'      {notas_lily}\n'
                '      \\bar "|."\n'
                '    }\n'
            )
        else:
            bloco_staff = (
                '    {\n'
                '      \\clef treble\n'
                f'      \\key {tonalidade}\n'
                f'      \\time {compasso}\n'
                f'      \\tempo 4 = {andamento}\n\n'
                f'      {notas_lily}\n'
                '      \\bar "|."\n'
                '    }\n'
            )
        bloco_layout = (
            '  \\layout {\n'
            '    \\context {\n'
            '      \\Score\n'
            '      \\override NonMusicalPaperColumn.line-break-permission = ##f\n'
            '    }\n'
            '  }\n'
        )

    _body_open  = '<<' if tem_letra else '{'
    _body_close = '>>' if tem_letra else '}'
    staff_open  = (
        f'  \\new Staff \\with {{\n'
        f'    \\consists #(cromus-engraver-factory "{_modo_engraver}")\n'
        f'  }} {_body_open}\n'
    )
    staff_close = f'  {_body_close}\n'

    conteudo = (
        '\\version "2.26.0"\n\n'
        '\\include "cromus_header.ily"\n\n'
        '\\header {\n'
        f'  title    = "{titulo}"\n'
        f'  composer = "{compositor}"\n'
        '  tagline  = ##f\n'
        '}\n\n'
        '#(set-global-staff-size 38)\n'
        '\n\\paper {\n'
        '  #(set-paper-size "a4")\n'
        '  ragged-bottom = ##f\n'
        '  ragged-last   = ##f\n'
        '  indent        = 1.2\\cm\n'
        '  short-indent  = 0\\cm\n'
        '  top-margin    = 12\\mm\n'
        '  bottom-margin = 12\\mm\n'
        '  left-margin   = 15\\mm\n'
        '  right-margin  = 15\\mm\n'
        '  print-page-number = ##t\n'
        '  print-first-page-number = ##t\n'
        '  system-system-spacing.padding = 6\\mm\n'
        '  system-system-spacing.minimum-distance = 4\\mm\n'
        '  page-limit-inter-system-space = ##t\n'
        '  page-limit-inter-system-space-factor = 1.3\n'
        '}\n\n'
        '\\score {\n'
        + staff_open
        + bloco_staff
        + staff_close
        + bloco_layout
        + '}\n'
    )

    os.makedirs(os.path.dirname(saida_ly), exist_ok=True)
    with open(saida_ly, "w", encoding="utf-8") as f:
        f.write(conteudo)


def compilar_lily(saida_ly: str, saida_base: str, base_dir: str) -> bool:
    resultado = subprocess.run(
        ["lilypond", "-I", base_dir, "-o", saida_base, saida_ly],
        capture_output=True, text=True
    )
    if resultado.stdout:
        print(resultado.stdout)
    if resultado.stderr:
        print(resultado.stderr)
    return resultado.returncode == 0


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────

def main():
    print("=" * 52)
    print("  CROMUS — Pipeline de Cantigas RNFG")
    print("=" * 52)

    base_dir   = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(base_dir, "output")
    os.makedirs(output_dir, exist_ok=True)

    erros = 0
    for cantiga in CANTIGAS:
        slug = _slug(cantiga["titulo"])
        print(f"\n► {cantiga['titulo']}")
        for modo in ["REAL", "FORMA", "STAFFLESS"]:
            nome_base  = f"{slug}_{modo.lower()}"
            saida_ly   = os.path.join(output_dir, f"{nome_base}.ly")
            saida_pdf  = os.path.join(output_dir, f"{nome_base}.pdf")
            saida_base = os.path.join(output_dir, nome_base)

            print(f"  [{modo}] Escrevendo: {saida_ly}")
            gerar_ly(cantiga, saida_ly, modo)
            print(f"  [{modo}] Compilando...")
            ok = compilar_lily(saida_ly, saida_base, base_dir)
            if ok:
                print(f"         ✅ {saida_pdf}")
            else:
                print(f"         ❌ Falha: {saida_ly}")
                erros += 1

    print()
    if erros == 0:
        print("✅ Pipeline concluído com sucesso!")
    else:
        print(f"❌ Pipeline concluído com {erros} erro(s).")


if __name__ == "__main__":
    main()
