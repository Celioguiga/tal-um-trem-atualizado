import argparse


def register(subparsers):
    p = subparsers.add_parser("krisicho", help="Krisícho Transmídia — Universo narrativo")
    p.add_argument("action", nargs="?", choices=["episodios", "personagens", "store"], default="episodios")
    p.add_argument("--ep", type=int, help="Número do episódio")


def run(args):
    if args.action == "episodios":
        ep = args.ep if args.ep else "todos"
        print(f"📖 Episódios Krisícho: {ep}")
    elif args.action == "personagens":
        print("👑 Krisícho · Leo · Lorde Kenon · Taum · Harmonium · Harmonia")
    elif args.action == "store":
        print("🛍️ Krisícho Store — e-commerce contextual pedagógico")
