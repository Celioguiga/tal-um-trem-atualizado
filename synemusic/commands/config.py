import argparse
from synemusic.style import status_ok, status_info, cabecalho


def register(subparsers):
    p = subparsers.add_parser("config", help="Configuração global do ecossistema")
    p.add_argument("key", nargs="?", help="Chave de configuração")
    p.add_argument("value", nargs="?", help="Valor da configuração")


def run(args):
    cabecalho()
    print()

    if args.key and args.value:
        print(status_ok(f"{args.key} = {args.value}"))
    else:
        print(status_info("Configurações disponíveis:"))
        print()
        print("  synemusic.api_key          Chave da API Anthropic")
        print("  synemusic.studio_port      Porta do Cromus Studio (default: 4242)")
        print("  synemusic.default_model    Modelo IA padrão (default: claude-sonnet-4-6)")
        print()
        print("  Uso: synemusic config <chave> <valor>")
