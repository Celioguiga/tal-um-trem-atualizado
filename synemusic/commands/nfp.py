import argparse
import os
import subprocess
from synemusic.style import status_ok, status_erro, status_info, cabecalho


def register(subparsers):
    p = subparsers.add_parser("nfp", help="Note Form Pro — SaaS de Edutainment Musical Agêntico")
    p.add_argument("action", nargs="?", choices=["dev", "build", "start"], default="dev")


def run(args):
    nfp_dir = os.path.join(os.path.dirname(__file__), "..", "..", "nfp")
    cwd = os.path.abspath(nfp_dir)

    cabecalho()
    print()

    if args.action == "dev":
        print(status_info("Iniciando servidor de desenvolvimento NFP…"))
        subprocess.run(["npm", "run", "dev"], cwd=cwd)
    elif args.action == "build":
        print(status_info("Compilando Note Form Pro…"))
        result = subprocess.run(["npm", "run", "build"], cwd=cwd, capture_output=True, text=True)
        if result.returncode == 0:
            print(status_ok("Build concluído"))
        else:
            print(status_erro("Erro no build:"))
            print(result.stderr)
    elif args.action == "start":
        print(status_info("Iniciando preview de produção NFP…"))
        subprocess.run(["npx", "vite", "preview"], cwd=cwd)
