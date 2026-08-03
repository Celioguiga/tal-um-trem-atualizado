# Créditos — amostras de áudio

O Pro Studio usa amostras reais de violão nylon (`src/guitar_samples.js`, tocadas via
`Tone.Sampler`) extraídas do SoundFont **"MS Basic.sf3"** do projeto MuseScore
(`share/sound/MS Basic.sf3` em github.com/musescore/MuseScore), licenciado sob MIT.

A licença original (MIT) exige que os avisos de copyright abaixo sejam mantidos em
qualquer trabalho derivado — por isso este arquivo.

## MuseScore_General.sf2 / MS Basic.sf3

Adaptação por S. Christian Collins, Copyright (c) 2018-19.

## FluidR3Mono

Conversão mono por Michael Cowgill, Copyright (c) 2014-17.

## FluidR3 (original)

Copyright (c) 2000-2002, 2008 Frank Wen <getfrank@gmail.com>

## Licença MIT

```
Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
```

## Como as amostras foram extraídas

21 notas (MIDI 36-96, passo de 3 semitons), programa General MIDI 24 ("Acoustic Guitar
nylon"), renderizadas via `fluidsynth` a partir do `.sf3` acima, cortadas e comprimidas
via `ffmpeg` (mono, 22050Hz, MP3 96kbps) e embutidas em base64 em `src/guitar_samples.js`.
`Tone.Sampler` interpola/pitch-shifta as notas intermediárias a partir destas 21.
