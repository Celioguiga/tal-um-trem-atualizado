import argparse


def register(subparsers):
    p = subparsers.add_parser("maestro", help="Maestro IA — Tutor socrático")
    p.add_argument("pergunta", nargs="*", help="Pergunta para o Maestro IA")


def run(args):
    pergunta = " ".join(args.pergunta) if args.pergunta else "Como posso ajudar?"
    print(f"🎓 Maestro IA: {pergunta}")
    print("   (implementação em breve)")
