# Cromus Studio

**Motor Cromus v2.1** — Sintaxe Cromus, Notação RNFG (Real Nota Forma Grau), editor de partituras com renderização LilyPond.

Sistema local (macOS) onde o compositor escreve cantigas em **Sintaxe Cromus** e vê a partitura renderizada com cores fixas por nota e formas geométricas fixas por grau.

## Componentes

- `cromus_studio.py` — Servidor local (porta 4242), interface web, tradutor Sintaxe Cromus → LilyPond
- `pipeline.py` — Motor canônico de geração .ly + compilação LilyPond
- `cromus_header.ily` — Stencils das 7 formas geométricas (círculo, ogiva, triângulo, quadrado, estrela, hexágono, casinha)
- `biblia_cromus.md` — Fonte única de verdade: sintaxe, cores, formas, padrões

## Princípio RNFG

- Cada **nota** tem cor fixa (Dó vermelho, Ré amarelo, Mi laranja, Fá verde, Sol azul, Lá marrom, Si roxo)
- Cada **grau** tem forma geométrica fixa (I→VII: círculo→casinha)
- Com a tonalidade, as formas rotacionam e as cores acompanham as notas

## Requisitos

- Python 3.14+
- LilyPond 2.26+
- macOS (Apple Silicon)

## Uso

```bash
python3 cromus_studio.py
```

Abrir `http://localhost:4242` no navegador.
