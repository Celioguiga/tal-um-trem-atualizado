\version "2.26.0"

\include "cromus_header.ily"

\header {
  title    = "Peixe Vivo"
  composer = "Domínio Público"
  tagline  = ##f
}

#(set-global-staff-size 38)

\paper {
  #(set-paper-size "a4")
  ragged-bottom = ##f
  ragged-last   = ##f
  indent        = 1.2\cm
  short-indent  = 0\cm
  top-margin    = 12\mm
  bottom-margin = 12\mm
  left-margin   = 15\mm
  right-margin  = 15\mm
  print-page-number = ##t
  print-first-page-number = ##t
  system-system-spacing.padding = 6\mm
  system-system-spacing.minimum-distance = 4\mm
  page-limit-inter-system-space = ##t
  page-limit-inter-system-space-factor = 1.3
}

\score {
  \new Staff \with {
    \consists #(cromus-engraver-factory "REAL")
  } {
      \stopStaff
      \omit Staff.BarLine
      \omit Staff.Clef
      \omit Staff.TimeSignature
      \omit Staff.KeyCancellation
      \omit Staff.Accidental
      \omit Staff.LedgerLineSpanner
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
    \context {
      \Score
      \override SpacingSpanner.uniform-stretching = ##t
    }
  }
}
