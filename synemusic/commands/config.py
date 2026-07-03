import argparse


def register(subparsers):
    p = subparsers.add_parser("config", help="Configuração global do ecossistema")
    p.add_argument("key", nargs="?", help="Chave de configuração")
    p.add_argument("value", nargs="?", help="Valor da configuração")


def run(args):
    if args.key and args.value:
        print(f"✓ {args.key} = {args.value}")
    else:
        print("Configurações disponíveis:")
        print("  synemusic.api_key          → Chave da API Anthropic")
        print("  synemusic.studio_port      → Porta do Cromus Studio (default: 4242)")
        print("  synemusic.default_model    → Modelo IA padrão (default: claude-sonnet-4-6)")
        print("")
        print(f"  Uso: synemusic config <chave> <valor>")
