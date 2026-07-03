import argparse


def register(subparsers):
    p = subparsers.add_parser("tab", help="Real Tablatura Universal — Célula multidimensional RNG")
    p.add_argument("action", nargs="?", choices=["mostrar", "config", "export"], default="mostrar")
    p.add_argument("--nota", help="Nota para exibir (ex: C, D, E…)")
    p.add_argument("--tonalidade", default="C", help="Tonalidade (default: C)")
    p.add_argument("--modo", choices=["maior", "menor"], default="maior", help="Modo (default: maior)")
    p.add_argument("--tipo", choices=["NFG", "RNFG"], default="RNFG", help="Tipo de notação")


def run(args):
    if args.action == "mostrar":
        nota = args.nota or "C"
        print(f"┌─ Super Tablatura RNG ─────────────────────┐")
        print(f"│  Nota: {nota:<10}  Tonalidade: {args.tonalidade:<6}  │")
        print(f"│  Modo: {args.modo:<6}  Tipo: {args.tipo:<8}          │")
        print(f"│                                            │")
        print(f"│  ┌──────────────────────────────────┐      │")
        print(f"│  │  [SATÉLITE]      ← Numeral Romano│      │")
        print(f"│  │  ╭─────────────╮                │      │")
        print(f"│  │  │ INVÓLUCRO   │ ← Forma + Cor  │      │")
        print(f"│  │  │   (NÚCLEO)  │ ← Casa/Fret    │      │")
        print(f"│  │  ╰─────────────╯                │      │")
        print(f"│  └──────────────────────────────────┘      │")
        print(f"└────────────────────────────────────────────┘")
    elif args.action == "config":
        print("Configuração da Real Tablatura Universal:")
        print(f"  Tonalidade: {args.tonalidade}")
        print(f"  Modo: {args.modo}")
        print(f"  Tipo: {args.tipo}")
    elif args.action == "export":
        print(f"→ Exportando tablatura… (implementação em breve)")
