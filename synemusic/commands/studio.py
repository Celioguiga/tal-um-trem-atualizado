import argparse
import os
import subprocess
from synemusic.style import status_ok, status_erro, status_info, cabecalho


def register(subparsers):
    p = subparsers.add_parser("studio", help="Cromus Studio — editor local de partituras RNFG")
    p.add_argument("action", nargs="?", choices=["start", "stop", "restart"], default="start")
    p.add_argument("--port", type=int, default=4242, help="Porta do servidor (default: 4242)")


def run(args):
    home = os.path.expanduser("~")
    studio_py = os.path.join(home, "cromus_studio.py")

    cabecalho()
    print()

    if args.action == "stop":
        subprocess.run(["pkill", "-f", "cromus_studio"], check=False)
        print(status_erro("Cromus Studio parado."))
        return

    if args.action == "restart":
        subprocess.run(["pkill", "-f", "cromus_studio"], check=False)
        print(status_info("Reiniciando…"))

    if args.action in ("start", "restart"):
        env = os.environ.copy()
        if args.port != 4242:
            env["PORT"] = str(args.port)
        proc = subprocess.Popen(
            ["python3", studio_py],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env=env,
        )
        print(status_ok(f"Cromus Studio rodando em http://localhost:{args.port} (PID {proc.pid})"))
