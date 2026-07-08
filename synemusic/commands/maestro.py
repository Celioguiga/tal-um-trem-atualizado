import argparse
from synemusic.style import status_ok, status_info, cabecalho


def register(subparsers):
    p = subparsers.add_parser("maestro", help="Maestro IA — Tutor socrático")
    p.add_argument("pergunta", nargs="*", help="Pergunta para o Maestro IA")


def run(args):
    cabecalho()
    print()

    pergunta = " ".join(args.pergunta) if args.pergunta else "Como posso ajudar?"
    print(status_ok(f"Maestro IA: {pergunta}"))
    print(status_info("(implementação em breve)"))
