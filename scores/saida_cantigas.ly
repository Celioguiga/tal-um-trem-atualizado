\version "2.26.0"

\header { title = "Método Real Nota Forma Grau - Edição de Entrada" }

#(define (desenhar-forma-rnfg grob)
   (let* ((note-event (ly:grob-property grob 'cause)))
     (if (ly:stream-event? note-event)
         (let ((pitch (ly:event-property note-event 'pitch)))
           (if (ly:pitch? pitch)
               (let ((grau (ly:pitch-notename pitch)))
                 (cond
                  ((= grau 0) (ly:grob-set-property! grob 'color (rgb-color 0 0 0)) (make-circle-stencil 0.5 0.09 #t))
                  ((= grau 1) (ly:grob-set-property! grob 'color (rgb-color 0 0 0)) (make-path-stencil '(moveto -0.65 0.0 curveto -0.35 0.45 0.35 0.45 0.65 0.0 curveto 0.35 -0.45 -0.35 -0.45 -0.65 0.0 closepath) 0.09 1 1 #t))
                  ((= grau 2) (ly:grob-set-property! grob 'color (rgb-color 0 0 0)) (make-path-stencil '(moveto 0.0 0.55 lineto 0.55 -0.45 lineto -0.55 -0.45 closepath) 0.09 1 1 #t))
                  ((= grau 3) (ly:grob-set-property! grob 'color (rgb-color 0 0 0)) (make-path-stencil '(moveto -0.45 -0.45 lineto 0.45 -0.45 lineto 0.45 0.45 lineto -0.45 0.45 closepath) 0.09 1 1 #t))
                  ((= grau 4) (ly:grob-set-property! grob 'color (rgb-color 0 0 0)) (make-path-stencil '(moveto 0.0 -0.55 lineto 0.149 -0.205 lineto 0.570 -0.195 lineto 0.241 0.083 lineto 0.353 0.485 lineto 0.000 0.250 lineto -0.353 0.485 lineto -0.241 0.083 lineto -0.570 -0.195 lineto -0.149 -0.205 closepath) 0.09 1 1 #t))
                  ((= grau 5) (ly:grob-set-property! grob 'color (rgb-color 0 0 0)) (make-path-stencil '(moveto 0.5 0.0 lineto 0.25 0.45 lineto -0.25 0.45 lineto -0.5 0.0 lineto -0.25 -0.45 lineto 0.25 -0.45 closepath) 0.09 1 1 #t))
                  ((= grau 6) (ly:grob-set-property! grob 'color (rgb-color 0 0 0)) (make-path-stencil '(moveto 0.0 0.55 lineto 0.5 0.05 lineto 0.4 0.05 lineto 0.4 -0.4 lineto -0.4 -0.4 lineto -0.4 0.05 lineto -0.5 0.05 closepath) 0.09 1 1 #t))
                  (else (ly:note-head::print grob))))
               (ly:note-head::print grob)))
         (ly:note-head::print grob))))


\paper {
  #(set-paper-size "a4")
  top-margin = 20\mm
  bottom-margin = 20\mm
  left-margin = 20\mm
  right-margin = 20\mm
}

\score {
  \header { piece = "A DONA ARANHA" }
  \new Staff {
    \override Staff.NoteHead.stencil = #desenhar-forma-rnfg
    {
      \clef treble
      \key c \major
      \time 2/4
      
      % Linha 1: Compassos 1 a 4 (Oitava central)
      c'4 c'8 d'8 | e'4 e'8 e'8 | d'8 c'8 d'8 e'8 | c'4 c'4 | \break
      
      % Linha 2: Compassos 5 a 8
      c'8 c'8 c'8 d'8 | e'4 e'4 | d'8 c'8 d'8 e'8 | c'4 r4 | \break
      
      % Linha 3: Compassos 9 a 12 REESCRITOS UMA OITAVA ABAIXO (Ajustado para a' e g')
      a'8 a'8 a'8 a'8 | g'4 e'8 c'8 | a'8 a'8 a'8 a'8 | g'4 e'4 | \break
      
      % Linha 4: Compassos 13 a 17 (Seção de repetição e Casas 1 e 2)
      c'8 c'8 c'8 d'8 | e'4 e'8 e'8 |
      \repeat volta 2 {
        d'8 c'8 d'8 e'8
      }
      \alternative {
        { c'4 r4 }   % (CASA 1)
        { c'4 c'4 }   % (CASA 2)
      } \break
      
      % Linha 5: Compassos Finais pós-repetição
      c'8 c'8 c'8 d'8 | e'4 e'8 e'8 | d'8 c'8 d'8 e'8 | c'4 r4 | \break
      
      \bar "|."
      \mark \markup { \italic "FIM" }
    }
  }
  \layout{
    \context {
      \Score
      \override NonMusicalPaperColumn.line-break-permission = ##f
    }
  }
}

