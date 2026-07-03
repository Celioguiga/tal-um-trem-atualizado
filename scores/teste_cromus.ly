\version "2.24.0"

\include "rnfg_header.ily"

melodia = \relative c' {
  \override NoteHead.stencil = #aplicar-forma-por-altura
  c4 d4 e4 f4 | g4 a4 b4 c4
}

\score {
  \new Staff \melodia
  \layout {
    \context {
      \Voice
      \override NoteHead.stencil = #aplicar-forma-por-altura
    }
  }
}
