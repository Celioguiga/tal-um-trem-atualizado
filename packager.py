#!/usr/bin/env python3
"""
packager.py — Gera booklet completo (capa + mini-guia + partitura) para cada cantiga
Uso:  python3 packager.py
"""
import os, re, subprocess, shutil, sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT   = os.path.join(BASE_DIR, "output")
LILYPOND = shutil.which("lilypond") or "/opt/homebrew/bin/lilypond"

sys.path.insert(0, BASE_DIR)
import pipeline

# ── MINI-GUIA RNFG (mesmo texto para todas as cantigas) ──────
GUIA = r"""
\markup {
  \override #'(line-width . 72)
  \column {
    \line { \bold \fontsize #2.5 "Como ler esta partitura" }
    \vspace #1

    \line { \bold \fontsize #1.5 "1. Cada nota tem uma cor fixa" }
    \vspace #0.3
    \line { \fontsize #1.2 \with-color #(rgb-color 0.75 0.00 0.10) "Dó = vermelho" \hspace #2
            \with-color #(rgb-color 0.93 0.82 0.00) "Ré = amarelo" \hspace #2
            \with-color #(rgb-color 0.94 0.45 0.00) "Mi = laranja" }
    \line { \fontsize #1.2 \with-color #(rgb-color 0.00 0.69 0.31) "Fá = verde" \hspace #4
            \with-color #(rgb-color 0.00 0.40 1.00) "Sol = azul" \hspace #3
            \with-color #(rgb-color 0.55 0.37 0.00) "Lá = marrom" }
    \line { \fontsize #1.2 \with-color #(rgb-color 0.61 0.37 0.75) "Si = lilás" }
    \vspace #0.8

    \line { \bold \fontsize #1.5 "2. Cada grau tem uma forma fixa" }
    \vspace #0.3
    \line { "I (Dó) = círculo" \hspace #1.5 "II (Ré) = ogiva" \hspace #1.5 "III (Mi) = triângulo" }
    \line { "IV (Fá) = quadrado" \hspace #1 "V (Sol) = estrela" \hspace #1 "VI (Lá) = hexágono" }
    \line { "VII (Si) = casinha" }
    \vspace #0.8

    \line { \bold \fontsize #1.5 "3. A regra de ouro" }
    \vspace #0.3
    \line { \fontsize #1.1 "A cor pertence à NOTA e nunca muda." }
    \line { \fontsize #1.1 "A forma pertence ao GRAU e nunca muda." }
    \line { \fontsize #1.1 "A tonalidade só muda qual forma cada nota recebe." }
    \vspace #0.5
    \line { \fontsize #1 \italic "Exemplo: em Dó maior, Sol = estrela azul (grau V)." }
    \line { \fontsize #1 \italic "Em Sol maior, Sol = círculo azul (grau I)." }
    \vspace #0.8

    \line { \bold \fontsize #1.5 "4. Como usar" }
    \vspace #0.3
    \line { \fontsize #1.1 "• A posição na pauta indica a altura (igual à partitura tradicional)" }
    \line { \fontsize #1.1 "• A cor identifica a nota (Dó, Ré, Mi…)" }
    \line { \fontsize #1.1 "• A forma identifica o grau (I, II, III…)" }
    \line { \fontsize #1.1 "• O ritmo segue a notação musical padrão" }
    \vspace #1.5

    \line { \fontsize #1.2 \italic "synemusic.com — Metodologia Real Nota Forma Grau" }
  }
}
"""

def slug(titulo: str) -> str:
    s = titulo.lower()
    for orig, repl in [("á","a"),("à","a"),("ã","a"),("â","a"),
                       ("é","e"),("ê","e"),("í","i"),
                       ("ó","o"),("ô","o"),("õ","o"),("ú","u"),("ç","c")]:
        s = s.replace(orig, repl)
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_")

def gerar_booklet(cantiga: dict) -> bool:
    titulo  = cantiga["titulo"]
    autor   = cantiga.get("compositor", "Domínio Público")
    raw     = cantiga["notas_ly_raw"]
    s       = slug(titulo)

    TEMPLATE = r"""\version "2.26.0"
\include "cromus_header.ily"

\header {
  title = "__TITULO__"
  composer = "__AUTOR__"
  tagline = ##f
}

#(set-global-staff-size 30)

\paper {
  #(set-paper-size "a4")
  indent = 0\mm
  ragged-bottom = ##f
  ragged-last = ##f
  top-margin = 14\mm
  bottom-margin = 14\mm
  left-margin = 16\mm
  right-margin = 16\mm
  print-page-number = ##f
}

\book {

  %% ══════════ PAGINA 1 — CAPA ══════════
  \bookpart {
    \paper { indent = 0\mm }
    \markup {
      \vspace #14
      \fill-line {
        \vcenter {
          \fontsize #8 \bold "Cantigas do Folclore"
          \vspace #0.3
          \fontsize #8 \bold "Infantil Brasileiro"
          \vspace #2
          \line { \fontsize #3.5 "Real Nota Forma Pro" }
          \vspace #0.6
          \line { \fontsize #1.8 \italic "__TITULO__" }
          \vspace #2
          \line { \override #'(font-name . "Helvetica") \fontsize #1 \with-color #(rgb-color 0.4 0.4 0.4) "__AUTOR__" }
        }
      }
    }
    \markup { \vspace #10 }
    %% escala cromatica com as 7 formas e cores
    \score {
      \new Staff \with {
        \consists #(cromus-engraver-factory "REAL")
        \override Staff.StaffSymbol.line-count = 0
        \omit Staff.Clef
        \omit Staff.TimeSignature
        \omit Staff.BarLine
        \override Score.BarNumber.transparent = ##t
      } {
        c'1 d'1 e'1 f'1 g'1 a'1 b'1
      }
      \layout {
        indent = 0\mm
        ragged-right = ##t
        \context {
          \Staff
          \remove "Clef_engraver"
          \remove "Bar_engraver"
          \remove "Time_signature_engraver"
        }
      }
    }
    \markup {
      \vspace #1
      \fill-line {
        \fontsize #1.2 "Metodologia Synemusic"
      }
    }
  }

  %% ══════════ PAGINA 2 — GUIA ══════════
  \bookpart {
    \paper { indent = 0\mm }
    __GUIA__
  }

  %% ══════════ PAGINA 3 — PARTITURA REAL ══════════
  \bookpart {
    \score {
      \new Staff \with {
        \consists #(cromus-engraver-factory "REAL")
      } {
        \clef treble
        __RAW__
      }
      \layout {
        indent = 1.2\cm
      }
    }
  }

  %% ══════════ PAGINA 4 — PARTITURA FORMA ══════════
  \bookpart {
    \score {
      \new Staff \with {
        \consists #(cromus-engraver-factory "FORMA")
      } {
        \clef treble
        __RAW__
      }
      \layout {
        indent = 1.2\cm
      }
    }
  }

}
"""

    ly = (TEMPLATE
          .replace("__TITULO__", titulo)
          .replace("__AUTOR__", autor)
          .replace("__GUIA__", GUIA)
          .replace("__RAW__", raw))

    os.makedirs(OUTPUT, exist_ok=True)
    ly_path = os.path.join(OUTPUT, f"{s}_booklet.ly")
    with open(ly_path, "w", encoding="utf-8") as f:
        f.write(ly)

    print(f"  Compilando booklet: {titulo}…", end=" ", flush=True)
    resultado = subprocess.run(
        [LILYPOND, "-I", BASE_DIR, "-o", os.path.join(OUTPUT, s), ly_path],
        capture_output=True, text=True, timeout=120
    )
    if resultado.returncode == 0:
        pdf_path = os.path.join(OUTPUT, f"{s}.pdf")
        print(f"✅ {pdf_path}")
        return True
    else:
        print(f"❌")
        if resultado.stderr:
            print(f"    {resultado.stderr[:500]}")
        return False

def main():
    CANTIGAS_LEAD = [
        pipeline._DONA_ARANHA,
        pipeline._PEIXE_VIVO,
        pipeline._CARANGUEJO,
    ]
    print("=" * 56)
    print("  PACKAGER — Booklets RNFG (capa + guia + partitura)")
    print("=" * 56)
    ok = 0
    for c in CANTIGAS_LEAD:
        if gerar_booklet(c):
            ok += 1
    print(f"\n{ok}/{len(CANTIGAS_LEAD)} booklets gerados em output/")
    if ok == len(CANTIGAS_LEAD):
        print("Pronto para lead magnet + Hotmart.")
    else:
        print("Verifique os erros acima.")

if __name__ == "__main__":
    main()
