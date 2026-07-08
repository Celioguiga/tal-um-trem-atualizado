import argparse, json, os, sys
sys.path.insert(0, os.path.expanduser("~"))
import rng_common as rng
from synemusic.style import (
    status_ok, status_erro, status_info, cabecalho,
    BOLD, DIM, RESET, rgb, DO, SOL, MI, FA, RE, LA, SI, CINZA2, BRANCO,
)


def register(subparsers):
    p = subparsers.add_parser("harmonia", help="Harmonia Real — análise RNFG de cifras")
    p.add_argument("cifra", nargs="?", help="Cifra para analisar (ex: G7, Am, Dm7)")
    p.add_argument("--tonalidade", default="C", help="Tonalidade (default: C)")
    p.add_argument("--modo", choices=["maior","menor"], default="maior", help="Modo (default: maior)")
    p.add_argument("--json", action="store_true", help="Saída JSON")


def run(args):
    cif = args.cifra
    if not cif:
        cabecalho()
        print()
        print(status_erro("Forneça uma cifra. Ex:  synemusic harmonia G7"))
        return

    graus = rng.cifra_para_graus(cif, args.tonalidade, args.modo)

    if args.json:
        print(json.dumps({"ok":True,"cifra":cif,"tonalidade":args.tonalidade,"modo":args.modo,"notas":graus}, indent=2, ensure_ascii=False))
        return

    cabecalho()
    print()
    print(status_ok(f"Harmonia Real — {cif} em {args.tonalidade} ({args.modo})"))
    print()

    header = f'  {BOLD}{rgb(*CINZA2)}{"Nota":<7}{"Grau":<7}{"Nome":<7}{"Forma":<16}{"Cor":<10}{RESET}'
    sep = f'  {DIM}{"─" * 47}{RESET}'
    print(header)
    print(sep)

    cores_grau = {1: DO, 2: RE, 3: MI, 4: FA, 5: SOL, 6: LA, 7: SI}
    for n in graus:
        grau = n.get('grau')
        if grau and grau in cores_grau:
            c = rgb(*cores_grau[grau])
        else:
            c = ''
        nota = n['nota']
        nome = n.get('nome', '')
        forma = rng.GRAU_FORMA.get(grau, '—') if grau else '—'
        cor_hex = n.get('cor', '#888')
        grau_str = f'{grau}°' if grau else '—'
        print(f'  {c}{nota:<7}{grau_str:<7}{nome:<7}{forma:<16}{cor_hex:<10}{RESET}')
