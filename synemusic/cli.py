import argparse
import sys
from synemusic.style import ajuda


def main():
    parser = argparse.ArgumentParser(
        prog="synemusic",
        description="CLI Unificada do Ecossistema Synemusic",
        usage="synemusic <comando> [<args>]",
        add_help=False,
    )
    parser.add_argument(
        "-v", "--version", action="version", version="synemusic 0.1.0 (Prompt Mestre v10.6)"
    )
    parser.add_argument("--help", action="store_true", help="Mostra esta ajuda")

    subparsers = parser.add_subparsers(dest="command")

    from synemusic.commands.studio import register as studio_cmd
    from synemusic.commands.nfp import register as nfp_cmd
    from synemusic.commands.live import register as live_cmd
    from synemusic.commands.transcribe import register as transcribe_cmd
    from synemusic.commands.maestro import register as maestro_cmd
    from synemusic.commands.salier import register as salier_cmd
    from synemusic.commands.game import register as game_cmd
    from synemusic.commands.krisicho import register as krisicho_cmd
    from synemusic.commands.cert import register as cert_cmd
    from synemusic.commands.config import register as config_cmd
    from synemusic.commands.tab import register as tab_cmd
    from synemusic.commands.realtab import register as realtab_cmd
    from synemusic.commands.harmonia import register as harmonia_cmd

    studio_cmd(subparsers)
    nfp_cmd(subparsers)
    live_cmd(subparsers)
    transcribe_cmd(subparsers)
    maestro_cmd(subparsers)
    salier_cmd(subparsers)
    game_cmd(subparsers)
    krisicho_cmd(subparsers)
    cert_cmd(subparsers)
    config_cmd(subparsers)
    tab_cmd(subparsers)
    realtab_cmd(subparsers)
    harmonia_cmd(subparsers)

    args = parser.parse_args()

    if args.help or not args.command:
        ajuda()
        sys.exit(0 if args.help else 1)

    dispatch(args)


def dispatch(args):
    module = {
        "studio": "synemusic.commands.studio",
        "nfp": "synemusic.commands.nfp",
        "live": "synemusic.commands.live",
        "transcribe": "synemusic.commands.transcribe",
        "maestro": "synemusic.commands.maestro",
        "salier": "synemusic.commands.salier",
        "game": "synemusic.commands.game",
        "krisicho": "synemusic.commands.krisicho",
        "cert": "synemusic.commands.cert",
        "config": "synemusic.commands.config",
        "tab": "synemusic.commands.tab",
        "realtab": "synemusic.commands.realtab",
        "harmonia": "synemusic.commands.harmonia",
    }
    mod = __import__(module[args.command], fromlist=["run"])
    mod.run(args)
