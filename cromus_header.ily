%%% ============================================================
%%% CROMUS v2.1 — Motor de Notação Real Nota Forma Grau
%%% Metodologia: Célio Guiga / Synemusic
%%% Compatível: LilyPond 2.24+
%%% Graus: 0=Dó 1=Ré 2=Mi 3=Fá 4=Sol 5=Lá 6=Si
%%% ============================================================

%%% ── PALETA DE CORES CANÔNICAS ─────────────────────────────
#(define CROMUS_COR_DO    (rgb-color 0.75 0.00 0.10))  %%% vermelho escuro
#(define CROMUS_COR_RE    (rgb-color 0.93 0.82 0.00))  %%% amarelo
#(define CROMUS_COR_MI    (rgb-color 0.94 0.45 0.00))  %%% laranja
#(define CROMUS_COR_FA    (rgb-color 0.00 0.69 0.31))  %%% verde
#(define CROMUS_COR_SOL   (rgb-color 0.00 0.40 1.00))  %%% azul
#(define CROMUS_COR_LA    (rgb-color 0.55 0.37 0.00))  %%% dourado
#(define CROMUS_COR_SI    (rgb-color 0.61 0.37 0.75))  %%% lilás
#(define CROMUS_COR_PRETO (rgb-color 0.10 0.10 0.10))

%%% Paleta indexada por grau (0–6 = Dó–Si)
#(define CROMUS_PALETA
  (list
    CROMUS_COR_DO
    CROMUS_COR_RE
    CROMUS_COR_MI
    CROMUS_COR_FA
    CROMUS_COR_SOL
    CROMUS_COR_LA
    CROMUS_COR_SI))

#(define (cromus-cor idx)
  (list-ref CROMUS_PALETA (modulo idx 7)))

%%% ── FORMAS CANÔNICAS ────────────────────────────────────────

%%% Grau 0 — Dó — círculo perfeito
#(define (make-circulo cor)
  (stencil-with-color
    (make-circle-stencil 0.55 0.01 #t)
    cor))

%%% Grau 1 — Ré — ogiva (vesica piscis com pontas agudas, escala 0.75 na pauta)
#(define (make-ogiva cor)
  (stencil-with-color
    (make-path-stencil
      '(moveto -0.75 0.00
        curveto -0.55  0.55  0.55  0.55  0.75 0.00
        curveto  0.55 -0.55 -0.55 -0.55 -0.75 0.00
        closepath)
      0.1 1 1 #t)
    cor))

%%% Grau 2 — Mi — triângulo equilátero (circunraio 0.55, ponta acima)
#(define (make-triangulo cor)
  (stencil-with-color
    (make-path-stencil
      '(moveto  0.00  0.55
        lineto -0.48 -0.28
        lineto  0.48 -0.28
        closepath)
      0.1 1 1 #t)
    cor))

%%% Grau 3 — Fá — quadrado perfeito ±0.46
#(define (make-quadrado cor)
  (stencil-with-color
    (ly:round-filled-box
      (cons -0.46 0.46)
      (cons -0.46 0.46)
      0.0)
    cor))

%%% Grau 4 — Sol — estrela real 5 pontas (R=0.60 externo, r=0.25 interno)
#(define (make-estrela cor)
  (stencil-with-color
    (make-path-stencil
      '(moveto  0.00  0.60
        lineto -0.15  0.20
        lineto -0.57  0.19
        lineto -0.24 -0.08
        lineto -0.35 -0.49
        lineto  0.00 -0.25
        lineto  0.35 -0.49
        lineto  0.24 -0.08
        lineto  0.57  0.19
        lineto  0.15  0.20
        closepath)
      0.1 1 1 #t)
    cor))

%%% Grau 5 — Lá — hexágono regular (R=0.55, vértices no topo e base)
#(define (make-hex cor)
  (stencil-with-color
    (make-path-stencil
      '(moveto -0.75  0.00
        lineto -0.38  0.46
        lineto  0.38  0.46
        lineto  0.75  0.00
        lineto  0.38 -0.46
        lineto -0.38 -0.46
        closepath)
      0.1 1 1 #t)
    cor))

%%% Grau 6 — Si — casinha (polígono único: teto triangular + corpo retangular)
#(define (make-casinha cor)
  (stencil-with-color
    (make-path-stencil
      '(moveto  0.00  0.52
        lineto  0.60  0.04
        lineto  0.46  0.04
        lineto  0.32 -0.51
        lineto -0.32 -0.51
        lineto -0.46  0.04
        lineto -0.60  0.04
        closepath)
      0.1 1 1 #t)
    cor))

%%% ── DISPATCHER ─────────────────────────────────────────────
%%% Dado grau (0–6) e modo ("REAL" ou "FORMA"), retorna o stencil
#(define (get-stencil-cromus nota-idx modo)
  (let ((cor (if (string=? modo "FORMA")
               CROMUS_COR_PRETO
               (cromus-cor nota-idx))))
    (case nota-idx
      ((0) (make-circulo   cor))
      ((1) (make-ogiva     cor))
      ((2) (make-triangulo cor))
      ((3) (make-quadrado  cor))
      ((4) (make-estrela   cor))
      ((5) (make-hex       cor))
      ((6) (make-casinha   cor))
      (else (make-circulo CROMUS_COR_PRETO)))))

%%% ── ENGRAVER FACTORY ────────────────────────────────────────
%%% Uso: \new Staff \with { \consists #(cromus-engraver-factory "REAL") }
%%%      \new Staff \with { \consists #(cromus-engraver-factory "FORMA") }
#(define (cromus-engraver-factory modo)
  (lambda (context)
    (make-engraver
      (acknowledgers
        ((note-head-interface engraver grob source-engraver)
         (let* ((pitch (ly:event-property
                         (ly:grob-property grob 'cause)
                         'pitch))
                (nota-idx (if (ly:pitch? pitch)
                            (modulo (ly:pitch-notename pitch) 7)
                            0)))
           (ly:grob-set-property! grob 'stencil
             (get-stencil-cromus nota-idx modo))))))))

cromusReal  = #(cromus-engraver-factory "REAL")
cromusForma = #(cromus-engraver-factory "FORMA")
