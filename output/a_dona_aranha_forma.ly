\version "2.26.0"

\include "cromus_header.ily"

\header {
  title    = "A Dona Aranha"
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
    \consists #(cromus-engraver-factory "FORMA")
  } {
    \clef treble

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
  }
  \layout {
    \context {
      \Score
      \override SpacingSpanner.uniform-stretching = ##t
    }
  }
}
