import argparse


def register(subparsers):
    p = subparsers.add_parser("nfp", help="Note Form Pro — SaaS de Edutainment Musical Agêntico")
    p.add_argument("action", nargs="?", choices=["dev", "build", "start"], default="dev")


def run(args):
    if args.action == "dev":
        print("→ npm run dev (Note Form Pro)")
    elif args.action == "build":
        print("→ npm run build (Note Form Pro)")
    elif args.action == "start":
        print("→ npm start (Note Form Pro)")
