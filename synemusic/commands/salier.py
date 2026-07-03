import argparse


def register(subparsers):
    p = subparsers.add_parser("salier", help="SalierIA — Co-criador musical")
    p.add_argument("descricao", nargs="*", help="Descreva a melodia ou ideia musical")


def run(args):
    desc = " ".join(args.descricao) if args.descricao else "nova composição"
    print(f"🎼 SalierIA compondo: {desc}")
    print("   (implementação em breve)")
