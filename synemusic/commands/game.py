import argparse


def register(subparsers):
    p = subparsers.add_parser("game", help="O Pássaro Mágico — Jogo de ritmo RNG")
    p.add_argument("action", nargs="?", choices=["play", "levels", "heroes"], default="play")


def run(args):
    if args.action == "play":
        print("🎮 Iniciando O Pássaro Mágico…")
    elif args.action == "levels":
        print("📊 Níveis: Explorador → Músico → Mestre → Virtuoso")
    elif args.action == "heroes":
        print("🦸 Heróis: LEO · ANA · JULIA · PEDRO · JOÃO")
