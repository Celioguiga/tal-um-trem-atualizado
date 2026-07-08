import argparse
from synemusic.style import status_ok, status_info, cabecalho


def register(subparsers):
    p = subparsers.add_parser("salier", help="SalierIA — Co-criador musical")
    p.add_argument("descricao", nargs="*", help="Descreva a melodia ou ideia musical")


def run(args):
    cabecalho()
    print()

    desc = " ".join(args.descricao) if args.descricao else "nova composição"
    print(status_ok(f"SalierIA compondo: {desc}"))
    print(status_info("(implementação em breve)"))
