\version "2.26.0"

\include "cromus_header.ily"

\header {
  title    = "A Dona Aranha"
  composer = "Domínio Público"
  tagline  = ##f
}

#(set-global-staff-size 32)

musicaTab = {

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

\score {
  <<
    \new Staff \with {
      \consists #(cromus-engraver-factory "REAL")
    } { \clef treble \musicaTab }
    \new TabStaff \with {
      \consists #(cromus-tab-engraver-factory "REAL")
    } {
      \set TabStaff.stringTunings = #ukulele-tuning
      \tabFullNotation
      \musicaTab
      \bar "|."
    }
  >>
  \layout { }
}
