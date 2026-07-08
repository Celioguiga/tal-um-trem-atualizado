\version "2.26.0"
\include "cromus_header.ily"

\header {
  title = "Peixe Vivo"
  composer = "Domínio Público"
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
          \line { \fontsize #1.8 \italic "Peixe Vivo" }
          \vspace #2
          \line { \override #'(font-name . "Helvetica") \fontsize #1 \with-color #(rgb-color 0.4 0.4 0.4) "Domínio Público" }
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

  }

  %% ══════════ PAGINA 3 — PARTITURA REAL ══════════
  \bookpart {
    \score {
      \new Staff \with {
        \consists #(cromus-engraver-factory "REAL")
      } {
        \clef treble
        
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

      }
      \layout {
        indent = 1.2\cm
      }
    }
  }

}
