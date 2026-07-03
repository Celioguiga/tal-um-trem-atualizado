import argparse
import sys


def main():
    parser = argparse.ArgumentParser(
        prog="synemusic",
        description="CLI unificada do Ecossistema Synemusic",
    )
    parser.add_argument(
        "-v", "--version", action="version", version="synemusic 0.1.0 (Prompt Mestre v10.6)"
    )

    subparsers = parser.add_subparsers(dest="command", help="Subcomandos")

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

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

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
    }
    mod = __import__(module[args.command], fromlist=["run"])
    mod.run(args)
