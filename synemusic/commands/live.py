import argparse


def register(subparsers):
    p = subparsers.add_parser("live", help="NFP Live — Treinador performático (Camada VI)")
    p.add_argument("mode", nargs="?", choices=["ensaio", "show"], default="ensaio")
    p.add_argument("--piece", help="Peça a praticar")


def run(args):
    if args.mode == "ensaio":
        piece = args.piece or "última peça"
        print(f"🎯 Modo Ensaio — peça: {piece}")
    elif args.mode == "show":
        print("🎤 Modo Show — performance ao vivo")
