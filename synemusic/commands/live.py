import argparse
from synemusic.style import status_ok, status_info, cabecalho


def register(subparsers):
    p = subparsers.add_parser("live", help="NFP Live — Treinador performático (Camada VI)")
    p.add_argument("mode", nargs="?", choices=["ensaio", "show"], default="ensaio")
    p.add_argument("--piece", help="Peça a praticar")


def run(args):
    cabecalho()
    print()

    if args.mode == "ensaio":
        piece = args.piece or "última peça"
        print(status_ok(f"Modo Ensaio — peça: {piece}"))
        print()
        print("  Pratique com o metrônomo interno e receba")
        print("  feedback em tempo real do seu desempenho.")
    elif args.mode == "show":
        print(status_info("Modo Show — performance ao vivo"))
        print()
        print("  Prepare-se para a apresentação!")
        print("  Acompanhamento automático, luzes e palco virtual.")
