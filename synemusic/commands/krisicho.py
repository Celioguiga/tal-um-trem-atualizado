import argparse
from synemusic.style import status_ok, status_info, status_erro, cabecalho


def register(subparsers):
    p = subparsers.add_parser("krisicho", help="Krisícho Transmídia — Universo narrativo")
    p.add_argument("action", nargs="?", choices=["episodios", "personagens", "store"], default="episodios")
    p.add_argument("--ep", type=int, help="Número do episódio")


def run(args):
    cabecalho()
    print()

    if args.action == "episodios":
        ep = args.ep if args.ep else "todos"
        print(status_ok(f"Episódios Krisícho: {ep}"))
    elif args.action == "personagens":
        print(status_info("Personagens:"))
        print("  Krisícho · Leo · Lorde Kenon · Taum · Harmonium · Harmonia")
    elif args.action == "store":
        print(status_ok("Krisícho Store — e-commerce contextual pedagógico"))
