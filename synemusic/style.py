"""Synemusic — Identidade visual da CLI
Aplica o design da marca: senoide cromática, 7 cores RNFG, ouro Christicho.
Sem dependências externas — usa ANSI TrueColor (RGB).
"""

# ── 7 cores RNFG (RGB) ──
DO  = (192, 0, 26)     # #C0001A
RE  = (236, 210, 0)    # #ECD200
MI  = (240, 115, 0)    # #F07300
FA  = (0, 176, 80)     # #00B050
SOL = (0, 102, 255)    # #0066FF
LA  = (139, 94, 0)     # #8B5E00
SI  = (155, 95, 192)   # #9B5FC0
OURO = (232, 168, 32)  # #E8A820
BRANCO = (240, 238, 235)
CINZA  = (88, 83, 73)
CINZA2 = (139, 133, 120)
ESCURO = (23, 19, 13)

GRADIENTE = [DO, RE, MI, FA, SOL, LA, SI]
NOMES_CORES = {
    'do': DO, 're': RE, 'mi': MI, 'fa': FA,
    'sol': SOL, 'la': LA, 'si': SI,
    'ouro': OURO, 'branco': BRANCO, 'cinza': CINZA,
    'cinza2': CINZA2, 'escuro': ESCURO,
}

RESET = '\033[0m'
BOLD = '\033[1m'
DIM = '\033[2m'
ITALIC = '\033[3m'

def rgb(r, g, b):
    return f'\033[38;2;{r};{g};{b}m'

def _c(nome, *partes):
    c = NOMES_CORES.get(nome)
    if not c:
        return ' '.join(partes)
    return f'\033[38;2;{c[0]};{c[1]};{c[2]}m{" ".join(partes)}\033[0m'

SENOIDE_COMPACTA = (
    f'{rgb(*DO)}▁{RESET}{rgb(*RE)}▂{RESET}{rgb(*MI)}▃{RESET}'
    f'{rgb(*FA)}▄{RESET}{rgb(*SOL)}▅{RESET}{rgb(*LA)}▆{RESET}'
    f'{rgb(*SI)}▇{RESET}'
)

def status_ok(texto):
    return f'  {rgb(*OURO)}✦{RESET} {texto}'

def status_erro(texto):
    return f'  {rgb(*DO)}✗{RESET} {texto}'

def status_info(texto):
    return f'  {rgb(*SOL)}◈{RESET} {texto}'

def status_aviso(texto):
    return f'  {rgb(*MI)}◆{RESET} {texto}'

def cabecalho():
    return (
        f'\n'
        f'  {rgb(*OURO)}╭──────────────────────────────────────────╮{RESET}\n'
        f'  {rgb(*OURO)}│{RESET}  {rgb(*DO)}s{RESET}{rgb(*RE)}y{RESET}{rgb(*MI)}n{RESET}{rgb(*FA)}e{RESET}'
        f'{rgb(*SOL)}m{RESET}{rgb(*LA)}u{RESET}{rgb(*SI)}s{RESET}{rgb(*OURO)}i{RESET}{rgb(*DO)}c{RESET}'
        f'                    {rgb(*OURO)}│{RESET}\n'
        f'  {rgb(*OURO)}│{RESET}  {DIM}CLI Unificada · v0.1.0{RESET}             {rgb(*OURO)}│{RESET}\n'
        f'  {rgb(*OURO)}│{RESET}  {ITALIC}{rgb(*CINZA2)}A música que se vê.{RESET}            {rgb(*OURO)}│{RESET}\n'
        f'  {rgb(*OURO)}│{RESET}  {SENOIDE_COMPACTA}        {rgb(*OURO)}│{RESET}\n'
        f'  {rgb(*OURO)}╰──────────────────────────────────────────╯{RESET}'
    )

def ajuda():
    print(cabecalho())
    print()
    print(f'  {rgb(*OURO)}COMANDOS{RESET}')
    print()
    _grupo('◆ GESTÃO', [
        ('studio', 'Cromus Studio — editor local de partituras RNFG'),
        ('nfp',    'Note Form Pro — SaaS de Edutainment Musical'),
        ('config', 'Configuração global do ecossistema'),
    ])
    _grupo('◈ FERRAMENTAS', [
        ('tab',     'Real Tablatura — mapa de notas RNFG no braço do violão'),
        ('realtab', 'Real Tablatura — PWA para violão com RNFG'),
        ('harmonia','Harmonia Real — análise RNFG de cifras'),
    ])
    _grupo('✦ IA & CRIAÇÃO', [
        ('transcribe','Transcrição Universal RNG — PDF, áudio ou YouTube'),
        ('maestro',   'Maestro IA — Tutor socrático e gestor estratégico'),
        ('salier',    'SalierIA — Co-criador musical'),
    ])
    _grupo('★ ECOSSISTEMA', [
        ('live',    'NFP Live — Treinador performático'),
        ('game',    'O Pássaro Mágico — Jogo de ritmo RNG'),
        ('krisicho','Krisícho Transmídia — Universo narrativo'),
        ('cert',    'Certificação RNG — Níveis 1/2/3'),
    ])
    print()
    print(f'  {DIM}Use: synemusic <comando> --help para detalhes{RESET}')
    print()

def _grupo(titulo, cmds):
    if not cmds:
        return
    print(f'  {_c("cinza2", titulo)}')
    max_w = max(len(n) for n, _ in cmds)
    for nome, desc in cmds:
        print(f'    {BOLD}{_c("branco", nome)}{RESET}{" " * (max_w - len(nome) + 2)}{DIM}{desc}{RESET}')
    print()

def separador():
    print(f'  {DIM}{"·" * 42}{RESET}')

if __name__ == "__main__":
    ajuda()
