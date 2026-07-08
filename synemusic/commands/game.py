import argparse
from synemusic.style import status_ok, status_info, cabecalho


def register(subparsers):
    p = subparsers.add_parser("game", help="O Pássaro Mágico — Jogo de ritmo RNG")
    p.add_argument("action", nargs="?", choices=["play", "levels", "heroes"], default="play")


def run(args):
    cabecalho()
    print()

    if args.action == "play":
        print(status_ok("Iniciando O Pássaro Mágico…"))
    elif args.action == "levels":
        print(status_info("Níveis:"))
        print("  Explorador → Músico → Mestre → Virtuoso")
    elif args.action == "heroes":
        print(status_info("Heróis:"))
        print("  LEO · ANA · JULIA · PEDRO · JOÃO")
