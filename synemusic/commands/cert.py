import argparse


def register(subparsers):
    p = subparsers.add_parser("cert", help="Certificação RNG — Níveis 1/2/3")
    p.add_argument("action", nargs="?", choices=["info", "nivel1", "nivel2", "nivel3"], default="info")


def run(args):
    if args.action == "info":
        print("Certificação RNG:")
        print("  Nível 1 — Professor RNG Certificado (40h)")
        print("  Nível 2 — Professor RNG Avançado (+80h)")
        print("  Nível 3 — Engenheiro Colaborador de IA RNG (convite)")
    elif args.action == "nivel1":
        print("📜 Nível 1: 40h · Módulo Básico")
    elif args.action == "nivel2":
        print("📜 Nível 2: +80h · SalierIA · Trilhas Curriculares")
    elif args.action == "nivel3":
        print("📜 Nível 3: Convite · Co-criação de ativos de IA")
