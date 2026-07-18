"""
rng_common.py — Núcleo compartilhado: Real Tablatura + Harmonia Real
Synemusic / Cromus Studio  ·  RNFG (Real Nota Forma Grau)
"""

# ── CORES RNFG v2.1 (Bíblia seção 3) ──
CORES = {
    1: '#C0001A',  # Dó — vermelho
    2: '#ECD200',  # Ré — amarelo
    3: '#F07300',  # Mi — laranja
    4: '#00B050',  # Fá — verde
    5: '#0066FF',  # Sol — azul
    6: '#8B5E00',  # Lá — marrom
    7: '#9B5FC0',  # Si — roxo
}
CORES_CSS = {k: v for k, v in CORES.items()}

GRAU_NOME = {1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII'}
GRAU_NOME_ROM = GRAU_NOME

# ── FORMAS (stencils — mesma semântica da Bíblia seção 3) ──
# Descritores usados pelo front-end para desenhar SVG
GRAU_FORMA = {
    1: 'circulo',
    2: 'ogiva',
    3: 'triangulo',
    4: 'quadrado',
    5: 'estrela',
    6: 'hexagono',
    7: 'casinha',
}

# ── NOTA → SEMITOM ──
NOTE_SEMITOM = {
    'C': 0, 'C#': 1, 'Db': 1,
    'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'Fb': 4, 'E#': 5,
    'F': 5, 'F#': 6, 'Gb': 6,
    'G': 7, 'G#': 8, 'Ab': 8,
    'A': 9, 'A#': 10, 'Bb': 10,
    'B': 11, 'Cb': 11, 'B#': 0,
}

SEMITOM_NOTA = {
    0: ['C', 'B#'],
    1: ['C#', 'Db'],
    2: ['D'],
    3: ['D#', 'Eb'],
    4: ['E', 'Fb'],
    5: ['F', 'E#'],
    6: ['F#', 'Gb'],
    7: ['G'],
    8: ['G#', 'Ab'],
    9: ['A'],
    10: ['A#', 'Bb'],
    11: ['B', 'Cb'],
}

# ── GRAU → OFFSET MIDI (dentro da oitava) ──
GRAU_OFFSET = {1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11}

# ── TONALIDADES (campo harmônico maior) ──
TONALIDADE = {
    'C':  {1: 'C', 2: 'D', 3: 'E', 4: 'F', 5: 'G', 6: 'A', 7: 'B'},
    'G':  {1: 'G', 2: 'A', 3: 'B', 4: 'C', 5: 'D', 6: 'E', 7: 'F#'},
    'D':  {1: 'D', 2: 'E', 3: 'F#', 4: 'G', 5: 'A', 6: 'B', 7: 'C#'},
    'A':  {1: 'A', 2: 'B', 3: 'C#', 4: 'D', 5: 'E', 6: 'F#', 7: 'G#'},
    'E':  {1: 'E', 2: 'F#', 3: 'G#', 4: 'A', 5: 'B', 6: 'C#', 7: 'D#'},
    'B':  {1: 'B', 2: 'C#', 3: 'D#', 4: 'E', 5: 'F#', 6: 'G#', 7: 'A#'},
    'F#': {1: 'F#', 2: 'G#', 3: 'A#', 4: 'B', 5: 'C#', 6: 'D#', 7: 'E#'},
    'C#': {1: 'C#', 2: 'D#', 3: 'E#', 4: 'F#', 5: 'G#', 6: 'A#', 7: 'B#'},
    'F':  {1: 'F', 2: 'G', 3: 'A', 4: 'Bb', 5: 'C', 6: 'D', 7: 'E'},
    'Bb': {1: 'Bb', 2: 'C', 3: 'D', 4: 'Eb', 5: 'F', 6: 'G', 7: 'A'},
    'Eb': {1: 'Eb', 2: 'F', 3: 'G', 4: 'Ab', 5: 'Bb', 6: 'C', 7: 'D'},
    'Ab': {1: 'Ab', 2: 'Bb', 3: 'C', 4: 'Db', 5: 'Eb', 6: 'F', 7: 'G'},
    'Db': {1: 'Db', 2: 'Eb', 3: 'F', 4: 'Gb', 5: 'Ab', 6: 'Bb', 7: 'C'},
    'Gb': {1: 'Gb', 2: 'Ab', 3: 'Bb', 4: 'Cb', 5: 'Db', 6: 'Eb', 7: 'F'},
}

TONALIDADE_MENOR = {
    'Am': {1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F', 7: 'G'},
    'Em': {1: 'E', 2: 'F#', 3: 'G', 4: 'A', 5: 'B', 6: 'C', 7: 'D'},
    'Bm': {1: 'B', 2: 'C#', 3: 'D', 4: 'E', 5: 'F#', 6: 'G', 7: 'A'},
    'F#m':{1: 'F#', 2: 'G#', 3: 'A', 4: 'B', 5: 'C#', 6: 'D', 7: 'E'},
    'C#m':{1: 'C#', 2: 'D#', 3: 'E', 4: 'F#', 5: 'G#', 6: 'A', 7: 'B'},
    'G#m':{1: 'G#', 2: 'A#', 3: 'B', 4: 'C#', 5: 'D#', 6: 'E', 7: 'F#'},
    'Dm': {1: 'D', 2: 'E', 3: 'F', 4: 'G', 5: 'A', 6: 'Bb', 7: 'C'},
    'Gm': {1: 'G', 2: 'A', 3: 'Bb', 4: 'C', 5: 'D', 6: 'Eb', 7: 'F'},
    'Cm': {1: 'C', 2: 'D', 3: 'Eb', 4: 'F', 5: 'G', 6: 'Ab', 7: 'Bb'},
    'Fm': {1: 'F', 2: 'G', 3: 'Ab', 4: 'Bb', 5: 'C', 6: 'Db', 7: 'Eb'},
}

def tonalidade_valida(tonalidade):
    if tonalidade in TONALIDADE: return tonalidade
    if tonalidade in TONALIDADE_MENOR: return tonalidade
    return 'C'

# ── GUITARRA (afinação padrão, corda 1 = aguda) ──
GUITAR_STRINGS = [
    {'str': 1, 'nome': 'E4', 'midi': 64},
    {'str': 2, 'nome': 'B3', 'midi': 59},
    {'str': 3, 'nome': 'G3', 'midi': 55},
    {'str': 4, 'nome': 'D3', 'midi': 50},
    {'str': 5, 'nome': 'A2', 'midi': 45},
    {'str': 6, 'nome': 'E2', 'midi': 40},
]

# ── INTERVALOS DE ACORDES (em semitons da fundamental) ──
CHORD_INTERVALS = {
    '':       [0, 4, 7],
    'm':      [0, 3, 7],
    'dim':    [0, 3, 6],
    'aug':    [0, 4, 8],
    '7':      [0, 4, 7, 10],
    'm7':     [0, 3, 7, 10],
    'M7':     [0, 4, 7, 11],
    'dim7':   [0, 3, 6, 9],
    'm7b5':   [0, 3, 6, 10],
    'sus4':   [0, 5, 7],
    'sus2':   [0, 2, 7],
    '6':      [0, 4, 7, 9],
    'm6':     [0, 3, 7, 9],
    '9':      [0, 4, 7, 10, 14],
    'm9':     [0, 3, 7, 10, 14],
    '7sus4':  [0, 5, 7, 10],
    'M9':     [0, 4, 7, 11, 14],
    'add9':   [0, 4, 7, 14],
    'madd9':  [0, 3, 7, 14],
}

# ── FUNÇÕES ──

def nota_para_semitom(nome):
    nome = nome.replace('b', 'b').replace('#', '#')
    return NOTE_SEMITOM.get(nome, 0)

def semitom_para_nota(st, pref='#'):
    nomes = SEMITOM_NOTA.get(st % 12, ['?'])
    if len(nomes) == 1: return nomes[0]
    return nomes[0] if pref == '#' else nomes[-1]

def grau_na_tonalidade(tonalidade, grau, modo='maior'):
    tab = TONALIDADE_MENOR if modo == 'menor' and tonalidade in TONALIDADE_MENOR else TONALIDADE
    return tab.get(tonalidade, TONALIDADE['C']).get(grau, '?')

def graus_da_tonalidade(tonalidade, modo='maior'):
    tab = TONALIDADE_MENOR if modo == 'menor' and tonalidade in TONALIDADE_MENOR else TONALIDADE
    return tab.get(tonalidade, TONALIDADE['C'])

def nota_para_grau(nota_nome, tonalidade='C', modo='maior'):
    tab = TONALIDADE_MENOR if modo == 'menor' and tonalidade in TONALIDADE_MENOR else TONALIDADE
    tom = tab.get(tonalidade, TONALIDADE['C'])
    for g, n in tom.items():
        if n == nota_nome: return g
    return None

def extrair_fundamental(cifra):
    """Extrai o nome da fundamental de uma cifra. Ex: 'G7' → 'G', 'F#m7' → 'F#'"""
    i = 0
    while i < len(cifra) and (cifra[i] in 'ABCDEFG' or cifra[i] in '#b'):
        i += 1
    return cifra[:i]

def extrair_sufixo(cifra):
    """Extrai o sufixo do acorde. Ex: 'G7' → '7', 'Am' → 'm'"""
    i = 0
    while i < len(cifra) and (cifra[i] in 'ABCDEFG' or cifra[i] in '#b'):
        i += 1
    return cifra[i:]

def cifra_para_notas(cifra):
    """Analisa cifra → lista de nomes de nota. Ex: 'G7' → ['G', 'B', 'D']"""
    fund = extrair_fundamental(cifra)
    suf = extrair_sufixo(cifra)
    if not fund:
        return []
    intervals = CHORD_INTERVALS.get(suf)
    if intervals is None:
        return [fund]
    fs = nota_para_semitom(fund)
    notas = []
    for iv in intervals:
        st = (fs + iv) % 12
        notas.append(semitom_para_nota(st))
    return notas

def cifra_para_graus(cifra, tonalidade='C', modo='maior'):
    """Analisa cifra → lista de (grau, nome_nota). Ex: ('G7', 'C') → [(5, 'G'), (7, 'B'), (2, 'D')]"""
    notas = cifra_para_notas(cifra)
    result = []
    for n in notas:
        g = nota_para_grau(n, tonalidade, modo)
        result.append({'grau': g, 'nota': n, 'nome': GRAU_NOME.get(g, '?'), 'cor': CORES.get(g, '#888')})
    return result

def nota_posicoes_braco(nota_nome, max_traste=12):
    """Retorna lista de {string, traste} para uma nota no braço do violão."""
    target = nota_para_semitom(nota_nome)
    positions = []
    for s in GUITAR_STRINGS:
        for fret in range(0, max_traste + 1):
            semitom = (s['midi'] + fret) % 12
            if semitom == target:
                positions.append({'string': s['str'], 'fret': fret})
    return positions

def nota_melhor_posicao(nota_nome, oitava=4, max_traste=12):
    """Encontra a melhor posição (mais próxima da 5ª casa) para uma nota."""
    target_semi = nota_para_semitom(nota_nome)
    target_midi = target_semi + (oitava + 1) * 12
    best = None
    best_dist = 999
    for s in GUITAR_STRINGS:
        for fret in range(0, max_traste + 1):
            midi = s['midi'] + fret
            if (midi % 12) == target_semi:
                dist = abs(midi - target_midi)
                if dist < best_dist or (dist == best_dist and fret < (best or {}).get('fret', 999)):
                    best_dist = dist
                    best = {'string': s['str'], 'fret': fret, 'midi': midi, 'nome_afinacao': s['nome']}
    return best

def sintaxe_para_notas(sintaxe, tonalidade='C'):
    """Extrai notas (graus) de uma sintaxe Cromus. Retorna lista de dicts com grau, nome, oitava."""
    import re
    s = sintaxe
    s = re.sub(r'[|,:|()\[\]FIMD.C.D.S.𝄌𝄋]', ' ', s).strip()
    tokens = re.findall(r"[0-7]['#b]*", s)
    notas = []
    for tok in tokens:
        if not tok or tok == '0' or tok == '-':
            continue
        oitava = 0
        t = tok
        while t.startswith("'"):
            oitava -= 1
            t = t[1:]
        while t.endswith("'"):
            oitava += 1
            t = t[:-1]
        m = re.match(r"^([0-7])([#b]?)$", t)
        if not m:
            continue
        grau = int(m.group(1))
        acc = m.group(2)
        nota_nome = grau_na_tonalidade(tonalidade, grau)
        if acc == '#':
            st = (nota_para_semitom(nota_nome) + 1) % 12
            nota_nome = semitom_para_nota(st)
        elif acc == 'b':
            st = (nota_para_semitom(nota_nome) - 1) % 12
            nota_nome = semitom_para_nota(st)
        notas.append({
            'grau': grau,
            'nota': nota_nome,
            'oitava': oitava,
            'cor': CORES.get(grau, '#888'),
        })
    return notas
