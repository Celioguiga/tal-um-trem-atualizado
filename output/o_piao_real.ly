\version "2.26.0"

\include "cromus_header.ily"

\header {
  title    = "O Pião"
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
    \clef treble

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
  }
  \layout {
    \context {
      \Score
      \override SpacingSpanner.uniform-stretching = ##t
    }
  }
}
