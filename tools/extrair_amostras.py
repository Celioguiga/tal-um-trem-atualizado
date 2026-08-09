#!/usr/bin/env python3
"""
Extrai um conjunto de amostras de um SoundFont e gera o src/<nome>_samples.js
no mesmo formato de guitar_samples.js / ukulele_samples.js.

Mesma cadeia que produziu as amostras de violão nylon (ver CREDITS.md):
MIDI mínimo montado byte a byte -> fluidsynth -> ffmpeg (mono/22050/MP3) ->
base64 embutido num data: URI.

Precisa de fluidsynth e ffmpeg no PATH (os dois via Homebrew no Mac do Guiga)
e do SoundFont. Rodar da raiz do projeto:

    python3 tools/extrair_amostras.py \
        --sf2 "/caminho/MS Basic.sf3" \
        --programa 32 --de 28 --ate 55 --passo 3 \
        --const BASS_SAMPLES_ACOUSTIC --saida src/bass_samples.js \
        --descricao "contrabaixo acústico (GM 32)"

Programas General MIDI úteis aqui: 24 violão nylon (já usado), 25 violão aço,
32 baixo acústico, 33 baixo elétrico dedilhado, 43 contrabaixo de orquestra.
"""
import argparse, base64, os, struct, subprocess, sys, tempfile

NOTAS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']


def nome_da_nota(midi):
    """MIDI 60 -> 'C4' (mesma convenção que Tone.Sampler espera nas chaves)."""
    return f"{NOTAS[midi % 12]}{midi // 12 - 1}"


def escrever_midi(caminho, nota, duracao_ticks=1920, programa=24, velocidade=100):
    """Monta um .mid de 1 nota sem biblioteca externa (formato 0, 480 ticks/semínima)."""
    def vlq(n):                     # comprimento variável, como o padrão MIDI exige
        out = bytearray([n & 0x7F])
        n >>= 7
        while n:
            out.insert(0, (n & 0x7F) | 0x80)
            n >>= 7
        return bytes(out)

    eventos = bytearray()
    eventos += vlq(0) + bytes([0xC0, programa])          # troca de programa
    eventos += vlq(0) + bytes([0x90, nota, velocidade])  # nota ligada
    eventos += vlq(duracao_ticks) + bytes([0x80, nota, 0])
    eventos += vlq(0) + bytes([0xFF, 0x2F, 0x00])        # fim da trilha

    with open(caminho, 'wb') as f:
        f.write(b'MThd' + struct.pack('>IHHH', 6, 0, 1, 480))
        f.write(b'MTrk' + struct.pack('>I', len(eventos)) + bytes(eventos))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sf2', required=True, help='caminho do .sf2/.sf3')
    ap.add_argument('--programa', type=int, default=24, help='programa General MIDI')
    ap.add_argument('--de', type=int, required=True, help='MIDI inicial')
    ap.add_argument('--ate', type=int, required=True, help='MIDI final (inclusive)')
    ap.add_argument('--passo', type=int, default=3, help='semitons entre amostras')
    ap.add_argument('--const', required=True, help='nome da const JS a gerar')
    ap.add_argument('--saida', required=True, help='arquivo .js de saída')
    ap.add_argument('--descricao', default='', help='vai no cabeçalho do arquivo')
    ap.add_argument('--segundos', type=float, default=2.5, help='duração de cada amostra')
    ap.add_argument('--kbps', default='96k')
    args = ap.parse_args()

    for exe in ('fluidsynth', 'ffmpeg'):
        if subprocess.run(['which', exe], capture_output=True).returncode:
            sys.exit(f'ERRO: {exe} não encontrado no PATH (instale com: brew install {exe})')
    if not os.path.exists(args.sf2):
        sys.exit(f'ERRO: SoundFont não encontrado: {args.sf2}')

    notas = list(range(args.de, args.ate + 1, args.passo))
    print(f'{len(notas)} amostras, MIDI {args.de}–{args.ate} passo {args.passo}, programa {args.programa}')

    entradas, total = [], 0
    with tempfile.TemporaryDirectory() as tmp:
        for i, nota in enumerate(notas, 1):
            mid, wav, mp3 = (os.path.join(tmp, f'n{nota}.{e}') for e in ('mid', 'wav', 'mp3'))
            escrever_midi(mid, nota, programa=args.programa)
            subprocess.run(['fluidsynth', '-ni', '-F', wav, '-r', '44100',
                            '-g', '0.8', args.sf2, mid],
                           check=True, capture_output=True)
            subprocess.run(['ffmpeg', '-y', '-i', wav, '-t', str(args.segundos),
                            '-ac', '1', '-ar', '22050', '-b:a', args.kbps, mp3],
                           check=True, capture_output=True)
            b64 = base64.b64encode(open(mp3, 'rb').read()).decode()
            total += len(b64)
            entradas.append((nome_da_nota(nota), b64))
            print(f'  [{i}/{len(notas)}] {nome_da_nota(nota):>4}  {len(b64)//1024} KB')

    corpo = ',\n'.join(f'  "{n}": "data:audio/mp3;base64,{b}"' for n, b in entradas)
    cabecalho = f'''/* =====================================================================
   {args.const} — {args.descricao or 'amostras'}
   {len(entradas)} notas (MIDI {args.de}-{args.ate}, passo de {args.passo} semitons),
   programa General MIDI {args.programa}, renderizadas via fluidsynth e
   comprimidas via ffmpeg (mono, 22050Hz, MP3 {args.kbps}).
   Tone.Sampler interpola as notas intermediárias a partir destas.
   Gerado por tools/extrair_amostras.py — ver CREDITS.md para a licença
   do SoundFont de origem.
===================================================================== */
const {args.const} = {{
{corpo}
}};
'''
    os.makedirs(os.path.dirname(args.saida) or '.', exist_ok=True)
    with open(args.saida, 'w', encoding='utf-8') as f:
        f.write(cabecalho)
    print(f'\n{args.saida}: {os.path.getsize(args.saida)//1024} KB')
    print(f'Agora: registre o arquivo em build.py e aponte SAMPLES_POR_INSTRUMENTO '
          f'(src/app.js) para {args.const}.')


if __name__ == '__main__':
    main()
