import argparse, json, os, sys
sys.path.insert(0, os.path.expanduser("~"))
import rng_common as rng
from synemusic.style import (
    status_ok, status_erro, cabecalho,
    BOLD, DIM, RESET, rgb, DO, RE, MI, FA, SOL, LA, SI, CINZA2, BRANCO,
)


def register(subparsers):
    p = subparsers.add_parser("tab", help="Real Tablatura — mapa de notas RNFG no braço do violão")
    p.add_argument("sintaxe", nargs="?", help="Sintaxe Cromus (ex: '1,2,3,4,5')")
    p.add_argument("--tonalidade", default="C", help="Tonalidade (default: C)")
    p.add_argument("--trastes", type=int, default=12, help="Máximo de trastes (default: 12)")
    p.add_argument("--json", action="store_true", help="Saída JSON")


def run(args):
    sint = args.sintaxe
    if not sint:
        cabecalho()
        print()
        print(status_erro("Forneça uma Sintaxe Cromus. Ex:  synemusic tab '1,2,3,4,5'"))
        return

    notas = rng.sintaxe_para_notas(sint, args.tonalidade)
    for n in notas:
        oit = n["oitava"] + 4
        mel = rng.nota_melhor_posicao(n["nota"], oit, args.trastes)
        n["posicao"] = mel

    if args.json:
        print(json.dumps({"ok":True,"tonalidade":args.tonalidade,"notas":notas}, indent=2, ensure_ascii=False))
        return

    cabecalho()
    print()
    print(status_ok(f"Real Tablatura — {args.tonalidade}"))
    print()

    # table header
    h = f'  {BOLD}{rgb(*CINZA2)}{"Nota":<7}{"Grau":<7}{"Corda":<7}{"Traste":<8}{RESET}'
    print(h)
    print(f'  {DIM}{"─" * 29}{RESET}')

    tab = {s: [] for s in range(1, 7)}
    cores_grau = {1: DO, 2: RE, 3: MI, 4: FA, 5: SOL, 6: LA, 7: SI}

    for n in notas:
        p = n["posicao"]
        g = n["grau"]
        c = rgb(*cores_grau.get(g, BRANCO)) if g in cores_grau else ''
        nome_grau = rng.GRAU_NOME.get(g, '?')
        if p:
            print(f'  {c}{n["nota"]:<7}{nome_grau:<7}{p["string"]:<7}{p["fret"]:<8}{RESET}')
            tab[p["string"]].append((p["fret"], g))
        else:
            print(f'  {c}{n["nota"]:<7}{nome_grau:<7}—      —      (fora do braço){RESET}')

    # visual tab
    print()
    strs = {6:'E', 5:'A', 4:'D', 3:'G', 2:'B', 1:'e'}
    for s in range(6, 0, -1):
        line = f'  {DIM}{strs[s]}|{RESET}'
        trastes = {f: g for f, g in tab.get(s, [])}
        for f in range(13):
            if f in trastes:
                g = trastes[f]
                c = rgb(*cores_grau.get(g, BRANCO))
                line += f'{c}{g:>2}{RESET}'
                if f < 12:
                    line += '-'
            else:
                line += f'{f:>2}-' if f > 0 else '--'
        print(line)
    print(f'  {"":>3}{"".join(f"{i:>2} " for i in range(13))}')
