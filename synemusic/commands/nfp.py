import argparse
import os
import subprocess


def register(subparsers):
    p = subparsers.add_parser("nfp", help="Note Form Pro — SaaS de Edutainment Musical Agêntico")
    p.add_argument("action", nargs="?", choices=["dev", "build", "start"], default="dev")


def run(args):
    nfp_dir = os.path.join(os.path.dirname(__file__), "..", "..", "nfp")
    cwd = os.path.abspath(nfp_dir)

    if args.action == "dev":
        print(f"→ cd nfp && npm run dev")
        subprocess.run(["npm", "run", "dev"], cwd=cwd)
    elif args.action == "build":
        print("→ Compilando Note Form Pro…")
        result = subprocess.run(["npm", "run", "build"], cwd=cwd, capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ Build concluído")
        else:
            print("✗ Erro no build:")
            print(result.stderr)
    elif args.action == "start":
        print("→ cd nfp && npx vite preview")
        subprocess.run(["npx", "vite", "preview"], cwd=cwd)
