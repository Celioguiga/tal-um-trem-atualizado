\version "2.26.0"

\include "cromus_header.ily"

\header {
  title    = "Caranguejo"
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
  }
  \layout {
    \context {
      \Score
      \override SpacingSpanner.uniform-stretching = ##t
    }
  }
}
