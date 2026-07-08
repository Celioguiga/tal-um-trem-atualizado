import argparse
from synemusic.style import status_ok, status_erro, status_info, cabecalho


def register(subparsers):
    p = subparsers.add_parser("transcribe", help="Transcrição Universal RNG — Camada VII")
    p.add_argument("source", help="Arquivo (PDF, PNG, MP3, WAV) ou URL do YouTube")
    p.add_argument("--pipeline", choices=["A", "B", "auto"], default="auto",
                   help="A=OMR (imagem/PDF), B=AMT (áudio), auto=detecta")


def run(args):
    cabecalho()
    print()

    pipe = args.pipeline
    if pipe == "auto":
        ext = args.source.lower().split(".")[-1] if "." in args.source else ""
        if ext in ("pdf", "png", "jpg", "jpeg", "tiff", "bmp"):
            pipe = "A"
        else:
            pipe = "B"

    print(status_info(f"Pipeline {pipe}: transcrevendo {args.source}"))
    print(status_info("(implementação em breve)"))
