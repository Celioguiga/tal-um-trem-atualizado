\version "2.26.0"

\header {
  title    = "Caranguejo"
  composer = "Domínio Público"
  tagline  = ##f
}

#(define (desenhar-forma-rnfg grob)
   (let* ((note-event (ly:grob-property grob 'cause)))
     (if (ly:stream-event? note-event)
         (let ((pitch (ly:event-property note-event 'pitch)))
           (if (ly:pitch? pitch)
               (let ((grau (ly:pitch-notename pitch)))
                 (cond
                  ((= grau 0)
                   (ly:grob-set-property! grob 'color (rgb-color 0 0 0))
                   (make-circle-stencil 0.5 0.09 #t))
                  ((= grau 1)
                   (ly:grob-set-property! grob 'color (rgb-color 0 0 0))
                   (make-path-stencil
                    '(moveto -0.65 0.0 curveto -0.35 0.45 0.35 0.45 0.65 0.0
                             curveto 0.35 -0.45 -0.35 -0.45 -0.65 0.0 closepath)
                    0.09 1 1 #t))
                  ((= grau 2)
                   (ly:grob-set-property! grob 'color (rgb-color 0 0 0))
                   (make-path-stencil
                    '(moveto 0.0 0.55 lineto 0.55 -0.45 lineto -0.55 -0.45 closepath)
                    0.09 1 1 #t))
                  ((= grau 3)
                   (ly:grob-set-property! grob 'color (rgb-color 0 0 0))
                   (make-path-stencil
                    '(moveto -0.45 -0.45 lineto 0.45 -0.45 lineto 0.45 0.45
                             lineto -0.45 0.45 closepath)
                    0.09 1 1 #t))
                  ((= grau 4)
                   (ly:grob-set-property! grob 'color (rgb-color 0 0 0))
                   (make-path-stencil
                    '(moveto 0.0 -0.55 lineto 0.149 -0.205 lineto 0.570 -0.195
                             lineto 0.241 0.083 lineto 0.353 0.485 lineto 0.000 0.250
                             lineto -0.353 0.485 lineto -0.241 0.083 lineto -0.570 -0.195
                             lineto -0.149 -0.205 closepath)
                    0.09 1 1 #t))
                  ((= grau 5)
                   (ly:grob-set-property! grob 'color (rgb-color 0 0 0))
                   (make-path-stencil
                    '(moveto 0.5 0.0 lineto 0.25 0.45 lineto -0.25 0.45
                             lineto -0.5 0.0 lineto -0.25 -0.45 lineto 0.25 -0.45 closepath)
                    0.09 1 1 #t))
                  ((= grau 6)
                   (ly:grob-set-property! grob 'color (rgb-color 0 0 0))
                   (make-path-stencil
                    '(moveto 0.0 0.55 lineto 0.5 0.05 lineto 0.4 0.05
                             lineto 0.4 -0.4 lineto -0.4 -0.4 lineto -0.4 0.05 lineto -0.5 0.05 closepath)
                    0.09 1 1 #t))
                  (else (ly:note-head::print grob))))
               (ly:note-head::print grob)))
         (ly:note-head::print grob))))

#(set-global-staff-size 38)

\paper {
  #(set-paper-size "a4")
  ragged-last   = ##f
  indent        = 1.2\cm
  short-indent  = 0\cm
  top-margin    = 20\mm
  bottom-margin = 20\mm
  left-margin   = 20\mm
  right-margin  = 20\mm
}

\score {
  \new Staff {
    \override Staff.NoteHead.stencil = #desenhar-forma-rnfg
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
