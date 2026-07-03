\version "2.26.0"

% =====================================================================
% MOTOR GRÁFICO INTEGRADO REAL NOTA FORMA GRAU (SINTAXE ATUALIZADA)
% =====================================================================

#(define (desenhar-forma-rnfg grob)
   (let* ((pitch (ly:event-property (ly:grob-property grob 'cause) 'pitch)))
     (if (ly:pitch? pitch)
         (let ((grau (ly:pitch-notename pitch)))
           (cond
            ;; DÓ - Círculo Vermelho
            ((= grau 0) (ly:grob-set-property! grob 'color (rgb-color 0.9 0.2 0.2))
                        (make-circle-stencil 0.5 0.09 #t))
            ;; RÉ - Ogiva/Elipse Amarela
            ((= grau 1) (ly:grob-set-property! grob 'color (rgb-color 0.95 0.65 0.15))
                        (make-ellipse-stencil 0.65 0.45 0.09 #t))
            ;; MI - Triângulo Laranja
            ((= grau 2) (ly:grob-set-property! grob 'color (rgb-color 0.9 0.4 0.0))
                        (make-path-stencil '(moveto 0.0 0.55 lineto 0.55 -0.45 lineto -0.55 -0.45 closepath) 0.09 1 1 #t))
            ;; FÁ - Quadrado Verde
            ((= grau 3) (ly:grob-set-property! grob 'color (rgb-color 0.15 0.5 0.2))
                        (make-path-stencil '(moveto -0.45 -0.45 lineto 0.45 -0.45 lineto 0.45 0.45 lineto -0.45 0.45 closepath) 0.09 1 1 #t))
            ;; SOL - Estrela Azul
            ((= grau 4) (ly:grob-set-property! grob 'color (rgb-color 0.08 0.4 0.75))
                        (make-path-stencil '(moveto 0.0 -0.55 lineto 0.15 -0.2 lineto 0.55 -0.2 lineto 0.25 0.1 lineto 0.35 0.5 lineto 0.0 0.25 lineto -0.35 0.5 lineto -0.25 0.1 lineto -0.55 -0.2 lineto -0.15 -0.2 closepath) 0.09 1 1 #t))
            ;; LÁ - Hexágono Amarelo-Ouro
            ((= grau 5) (ly:grob-set-property! grob 'color (rgb-color 0.8 0.6 0.05))
                        (make-path-stencil '(moveto 0.5 0.0 lineto 0.25 0.45 lineto -0.25 0.45 lineto -0.5 0.0 lineto -0.25 -0.45 lineto 0.25 -0.45 closepath) 0.09 1 1 #t))
            ;; SI - Forma Roxa (Filha do Tônico, Irmã do Dominante)
            ((= grau 6) (ly:grob-set-property! grob 'color (rgb-color 0.5 0.1 0.65))
                        (make-path-stencil '(moveto 0.0 0.55 lineto 0.5 0.05 lineto 0.4 0.05 lineto 0.4 -0.4 lineto -0.4 -0.4 lineto -0.4 0.05 lineto -0.5 0.05 closepath) 0.09 1 1 #t))
            (else (ly:note-head::print grob))))
         (ly:note-head::print grob))))

% =====================================================================
% REPOSITÓRIO MUSICAL DE VALIDAÇÃO
% =====================================================================

melodia = \relative c' {
  c4 d4 e4 f4 | g4 a4 b4 c4
}

\score {
  \new Staff {
    \override Staff.NoteHead.stencil = #desenhar-forma-rnfg
    \melodia
  }
  \layout { }
}
