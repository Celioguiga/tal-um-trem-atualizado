#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CROMUS STUDIO v2.0.1
=====================================================================
Drop-in replacement completo. Mesma porta 4242, mesmo adaptador pipeline.py.

CHANGELOG v2.0.1 (melhorias de baixo custo, alto impacto)
-----------------------------------------------------------
  A. Undo/Redo nativo (Ctrl+Z / Ctrl+Y) com histórico de 50 passos
  B. Atalhos de teclado numérico à la Sibelius (1-7=notas, Q=semínima,
     W=mínima, E=colcheia, R=semibreve, S=silêncio, . =ponto, ~=ligadura)
  C. Contador de compasso + validador de métrica em tempo real
  D. Exportação LilyPond direto (botão .ly) — sem precisar compilar
  E. Miniatura de pré-visualização de token (cor+forma RNFG no painel)
  F. Modo Escuro / Claro toggle (persistido via localStorage)
  G. Arrastar arquivo MusicXML/PDF direto na área do editor (sem ir à aba)
  H. Log de compilação persistente com timestamps (botão "Ver log")
  I. Campo de busca rápida no textarea (Ctrl+F dentro do editor)
  J. Botão "Limpar" com confirmação para evitar perda acidental

FUNCIONALIDADES DO v2 (mantidas integralmente)
  1. Painel de edição de notas — notas 1-7, silêncio, durações,
     acidentes, ligaduras, pontos, legato, 8va/8vb.
  2. Importação PDF / MusicXML — parsing server-side.
  3. Motor de áudio — Playback Tone.js, exportação MIDI e WAV.
"""

import base64, json, os, re, shutil, subprocess, sys, tempfile, threading, webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import rng_common

PORT        = 4242
BASE_DIR    = Path(__file__).resolve().parent
HEADER_FILE = BASE_DIR / "cromus_header.ily"
WORK_DIR    = BASE_DIR / "studio_tmp"
LILYPOND    = shutil.which("lilypond") or "/opt/homebrew/bin/lilypond"

# ──────────────────────────── ADAPTADOR (inalterado) ────────────────────────
_CANDIDATOS = [
    "gerar_ly","build_ly","sintaxe_para_ly","sintaxe_to_ly",
    "traduzir_sintaxe","parse_sintaxe","montar_ly","to_lilypond",
]

def _localizar_parser():
    sys.path.insert(0, str(BASE_DIR))
    try:
        import pipeline
    except Exception as e:
        raise RuntimeError(
            f"Não consegui importar pipeline.py ({e}). "
            "Confirme que cromus_studio.py está na mesma pasta do pipeline.")
    for nome in _CANDIDATOS:
        fn = getattr(pipeline, nome, None)
        if callable(fn): return fn, nome
    disponiveis = [n for n in dir(pipeline) if callable(getattr(pipeline,n)) and not n.startswith("_")]
    raise RuntimeError(
        "pipeline.py importado, mas não encontrei a função de tradução. "
        f"Funções: {', '.join(disponiveis)}.")

_LY_PITCH = {0:"r", 1:"c'", 2:"d'", 3:"e'", 4:"f'", 5:"g'", 6:"a'", 7:"b'"}
_TUPLET_FRAC = {3:'3/2', 5:'5/4', 6:'6/4', 7:'7/4', 9:'9/8'}
_UNIDADE_TUPLET = {3:8, 5:16, 6:16, 7:16, 9:32}

_INSTRUMENTOS = {
    "Violino I":    {"clef": "treble", "midi": 40, "abrev": "Vl.I"},
    "Violino II":   {"clef": "treble", "midi": 41, "abrev": "Vl.II"},
    "Viola":        {"clef": "alto",   "midi": 42, "abrev": "Vla."},
    "Violoncelo":   {"clef": "bass",   "midi": 43, "abrev": "Vc."},
    "Cello":        {"clef": "bass",   "midi": 43, "abrev": "Vc."},
    "Contrabaixo":  {"clef": "bass",   "midi": 44, "abrev": "Cb."},
    "Flauta":       {"clef": "treble", "midi": 73, "abrev": "Fl."},
    "Flautim":      {"clef": "treble", "midi": 72, "abrev": "Picc."},
    "Oboé":         {"clef": "treble", "midi": 68, "abrev": "Ob."},
    "Clarinete":    {"clef": "treble", "midi": 71, "abrev": "Cl."},
    "Fagote":       {"clef": "bass",   "midi": 70, "abrev": "Fg."},
    "Soprano":      {"clef": "treble", "midi": 54, "abrev": "S."},
    "Contralto":    {"clef": "treble", "midi": 55, "abrev": "C."},
    "Tenor":        {"clef": "treble", "midi": 56, "abrev": "T."},
    "Baixo":        {"clef": "bass",   "midi": 57, "abrev": "B."},
    "Trompa":       {"clef": "bass",   "midi": 60, "abrev": "Cor"},
    "Trompete":     {"clef": "treble", "midi": 56, "abrev": "Tpt."},
    "Trombone":     {"clef": "bass",   "midi": 57, "abrev": "Tbn."},
    "Tuba":         {"clef": "bass",   "midi": 58, "abrev": "Tba."},
    "Harpa":        {"clef": "bass",   "midi": 46, "abrev": "Hp."},
    "Piano":        {"clef": "bass",   "midi": 1,  "abrev": "Pno."},
    "Bateria":      {"clef": "percussion", "midi": 0, "abrev": "Batt."},
    "Voz":          {"clef": "treble", "midi": 54, "abrev": "Voz"},
}

_CLEF_LILY = {"treble":"treble", "alto":"alto", "bass":"bass", "percussion":"percussion"}


def _is_orquestral(sintaxe):
    return bool(re.search(r'^---', sintaxe, re.MULTILINE))


def _parse_orquestral(sintaxe):
    blocos = re.split(r'\n(?=---)', sintaxe.strip())
    vozes = []
    for bloco in blocos:
        linhas = bloco.strip().split('\n')
        cabecalho = linhas[0].lstrip('-').strip()
        inst_name = cabecalho.split(':')[0].strip() if ':' in cabecalho else cabecalho
        corpo = '\n'.join(l for l in linhas[1:] if l.strip())
        vozes.append({"instrumento": inst_name, "sintaxe": corpo})
    return vozes


_INSTR_LOOKUP = {k.lower(): v for k, v in _INSTRUMENTOS.items()}


def _resolver_instrumento(nome):
    key = nome.strip().lower()
    if key in _INSTR_LOOKUP:
        return _INSTR_LOOKUP[key]
    for alias, inst_name in [("vl", "Violino I"), ("vln", "Violino I"),
                             ("vla", "Viola"), ("vc", "Violoncelo"),
                             ("cb", "Contrabaixo"), ("fl", "Flauta"),
                             ("cl", "Clarinete"), ("ob", "Oboé"),
                             ("fg", "Fagote"), ("tp", "Trompete"),
                             ("cor", "Trompa"), ("tbn", "Trombone"),
                             ("tba", "Tuba"), ("pno", "Piano")]:
        if nome.strip().lower().startswith(alias):
            return _INSTRUMENTOS[inst_name]
    return {"clef": "treble", "midi": 40, "abrev": nome.strip()}


def _sintaxe_para_ly_orquestral(sintaxe, compasso, andamento=80, tonalidade="c \\major"):
    vozes = _parse_orquestral(sintaxe)
    if not vozes:
        return _sintaxe_para_ly_raw(sintaxe, compasso, andamento=andamento, tonalidade=tonalidade)
    partes = []
    for voz in vozes:
        inst = _resolver_instrumento(voz["instrumento"])
        ly_raw = _sintaxe_para_ly_raw(voz["sintaxe"], compasso, andamento=andamento, tonalidade=tonalidade)
        clef = _CLEF_LILY.get(inst["clef"], "treble")
        midi_prog = inst["midi"]
        staff = (
            f'    \\new Staff \\with {{\n'
            f'      instrumentName = "{inst["abrev"]}"\n'
            f'      midiInstrument = #{midi_prog}\n'
            f'    }}\n'
            f'    {{\n'
            f'      \\clef {clef}\n'
            f'      {ly_raw.strip()}\n'
            f'    }}\n'
        )
        partes.append(staff)
    corpo = '\n'.join(partes)
    return (
        '  \\new StaffGroup <<\n'
        f'{corpo}\n'
        '  >>\n'
    )


def _sintaxe_com_midi(sintaxe, modo, titulo, compasso, andamento=80, tonalidade="c \\major"):
    """Gera bloco \\score com \\midi para orquestral ou monofônico."""
    orquestral = _is_orquestral(sintaxe)
    if orquestral:
        raw = _sintaxe_para_ly_orquestral(sintaxe, compasso, andamento=andamento, tonalidade=tonalidade)
    else:
        raw = _sintaxe_para_ly_raw(sintaxe, compasso, andamento=andamento, tonalidade=tonalidade)
        modoe = "REAL" if modo == "STAFFLESS" else modo
        raw = (
            f'    \\new Staff \\with {{ midiInstrument = #40 }}\n'
            f'    {{\n'
            f'      \\clef treble\n'
            f'      {raw.strip()}\n'
            f'    }}\n'
        )
    ly = (
        f'\\version "2.26.0"\n'
        f'\\header {{ title = "{titulo}" }}\n'
        f'\\score {{\n'
        f'{raw}'
        f'  \\layout {{ }}\n'
        f'  \\midi {{ }}\n'
        f'}}\n'
    )
    return ly


def _finger_to_ly(finger_str):
    if not finger_str: return ''
    parts = [p.strip() for p in finger_str.split(',')]
    out = ''
    for p in parts:
        if p in ('p','i','m','a'):
            out += '_' + p
        elif p in ('1','2','3','4'):
            out += '-' + p
        elif p in ('P','I','M','A'):
            out += '_' + p.lower()
    return out

def _parse_nota(tok):
    import re as _re
    finger = ''
    fm = _re.search(r'\{([^}]*)\}', tok)
    if fm:
        finger = _finger_to_ly(fm.group(1))
        tok = tok.replace(fm.group(0), '')
    ast = len(tok) - len(tok.rstrip('*'))
    parcelas = ast if ast > 0 else 1
    corpo = tok.rstrip('*')
    oitava = 0
    while corpo.startswith("'"):
        oitava -= 1; corpo = corpo[1:]
    while corpo.endswith("'"):
        oitava += 1; corpo = corpo[:-1]
    corpo = corpo.lstrip('+')
    if corpo in ('-','0'):
        return ('r', parcelas, finger)
    m = _re.match(r"^([0-7])([#b]?)$", corpo)
    if not m:
        return (None, parcelas, finger)
    grau = int(m.group(1)); acc = m.group(2)
    pitch = _LY_PITCH[grau]
    if oitava > 0:
        pitch = pitch + ("'" * oitava)
    elif oitava < 0:
        base = pitch.rstrip("'")
        pitch = base + ("," * (abs(oitava)-1))
    if acc == '#':
        pitch = pitch[0] + 'is' + pitch[1:]
    elif acc == 'b':
        pitch = pitch[0] + 'es' + pitch[1:]
    return (pitch, parcelas, finger)

def _eh_tuplet_total(total):
    return total not in (1,2,4,8,16,32)

def _dur_de_unidades(unidades, unidade_base):
    val = unidade_base / unidades
    POW = {1:'1',2:'2',4:'4',8:'8',16:'16',32:'32'}
    if val in POW:
        return POW[val]
    if unidades == 3:
        base = unidade_base / 2
        if base in POW:
            return POW[base] + '.'
    return str(unidade_base)

def _finger_to_ly(finger_str):
    if not finger_str: return ''
    parts = [p.strip() for p in finger_str.split(',')]
    out = ''
    for p in parts:
        if p in ('p','i','m','a'):
            out += '_' + p
        elif p in ('1','2','3','4'):
            out += '-' + p
        elif p in ('P','I','M','A'):
            out += '_' + p.lower()
    return out

def _converter_tempo(grupo):
    import re as _re
    g = grupo.strip()
    if not g:
        return ''

    # ---- Preprocess + (ligadura/tie) into @TIE@ markers ----
    # "5+6" → "5 @TIE@ 6", "5 + 6" → "5 @TIE@ 6", "+5 6" → "@TIE@ 5 6"
    g = _re.sub(r'(\S+?)\s*\+', r'\1 @TIE@ ', g)
    g = _re.sub(r'\+\s*(\S+)', r' @TIE@ \1', g)
    g = _re.sub(r'@TIE@\s+@TIE@', '@TIE@', g)

    mc = _re.match(r'^\(\((.+)\)\)$', g)
    mt = _re.match(r'^\((.+)\)$', g)
    alvo = mc or mt
    if alvo:
        notas = alvo.group(1).split()
        n = len(notas)
        frac = _TUPLET_FRAC.get(n, str(n)+'/'+str(n-1))
        corpo = []
        tie_next = False
        for tk in notas:
            is_tie = tk == '@TIE@'
            if is_tie:
                tie_next = True
                continue
            p, _, finger = _parse_nota(tk.replace('@TIE@',''))
            if p:
                nly = p + '8' + finger
                if tie_next and corpo:
                    corpo[-1] += '~'
                elif tie_next:
                    nly += '~'
                tie_next = False
                corpo.append(nly)
        return '\\tuplet ' + frac + ' { ' + ' '.join(corpo) + ' }'

    # Strip @TIE@ markers and record which notes are tied
    raw = g.split()
    tie_idx = set()
    clean_raw = []
    tie_pending = False
    for tok in raw:
        if tok == '@TIE@':
            if clean_raw:
                tie_idx.add(len(clean_raw) - 1)
            else:
                tie_pending = True
        else:
            clean_raw.append(tok)
            if tie_pending:
                tie_idx.add(len(clean_raw) - 1)
                tie_pending = False
    clean_g = ' '.join(clean_raw)

    tokens = _re.findall(r"[0-7]\{[^}]*\}[''#b]*\**|[0-7]'*\*+|-\*+|[0-7]'*|-", clean_g.replace(' ',''))
    notas = []
    for t in tokens:
        if '*' in t:
            base = t.rstrip('*'); ast = len(t)-len(base)
            notas.append((base, ast))
        else:
            notas.append((t, 1))
    total = sum(p for _,p in notas)
    if total == 0:
        return ''
    tuplet = _eh_tuplet_total(total)
    POW2 = {4.0:'1',2.0:'2',1.0:'4',0.5:'8',0.25:'16',0.125:'32',
            3.0:'2.',1.5:'4.',0.75:'8.',0.375:'16.'}
    corpo = []
    for idx, (base, parcelas) in enumerate(notas):
        pitch, _, finger = _parse_nota(base)
        if not pitch:
            continue
        if tuplet:
            unidade_base = _UNIDADE_TUPLET.get(total,16)
            nly = pitch + _dur_de_unidades(parcelas, unidade_base) + finger
        else:
            frac = (parcelas/total)*1.0
            nly = pitch + POW2.get(frac,'16') + finger
        if idx in tie_idx:
            nly += '~'
        corpo.append(nly)
    inner = ' '.join(corpo)
    if tuplet:
        frac = _TUPLET_FRAC.get(total, str(total)+'/'+str(total-1))
        return '\\tuplet ' + frac + ' { ' + inner + ' }'
    return inner

def _sintaxe_para_ly_raw(sintaxe, compasso, compassos_por_linha=4, andamento=80, tonalidade="c \\major"):
    s = sintaxe
    s = s.replace('`', "'")
    # Substitui marcadores estruturais por placeholders isolados por virgulas
    s = re.sub(r'\(\s*CASA\s*1\s*\)', ',@volta_1@,', s)
    s = re.sub(r'\(\s*CASA\s*2\s*\)', ',@volta_2@,', s)
    s = s.replace('||:', ' ,@start_rep@, ')
    s = s.replace(':||', ' ,@end_rep@, ')
    s = s.replace('D.C.', ' ,@da_capo@, ')
    s = s.replace('D.S.', ' ,@dal_segno@, ')
    s = s.replace('𝄌', ' ,@to_coda@, ')
    s = s.replace('𝄋', ' ,@segno@, ')
    s = s.replace('FIM', ' ,@fim@, ')
    # Agora converte | para , (separador de tempo)
    s = s.replace('|', ',')
    for junk in ['CASA1', 'CASA2', '[1', '[2']:
        s = s.replace(junk, ',')
    s = re.sub(r',,+', ',', s)
    s = s.strip(',').strip()
    beat_struct = ""
    comp_base = compasso
    if '(' in compasso:
        comp_base = compasso.split('(')[0].strip()
        bs = compasso.split('(')[1].rstrip(')').strip()
        beat_struct = ' ' + bs
    num, denom = comp_base.split('/')
    tempos_por_compasso = int(num)
    grupos = s.split(',')
    partes = []
    cont_tempo = 0
    cont_compasso = 0
    # Tabela de conversao placeholder → LilyPond
    LILY_MARKS = {
        '@start_rep@': "\\set Score.repeatCommands = #'(start-repeat)",
        '@end_rep@':   "\\set Score.repeatCommands = #'((volta #f) end-repeat)",
        '@volta_1@':   "\\set Score.repeatCommands = #'((volta \"1\"))",
        '@volta_2@':   "\\set Score.repeatCommands = #'((volta \"2\"))",
        '@da_capo@':   "\\mark \\markup { \\musicglyph #\"scripts.dacapo\" \\bold { D.C. al Fine } }",
        '@dal_segno@': "\\mark \\markup { \\musicglyph #\"scripts.segno\" }",
        '@to_coda@':   "\\mark \\markup { \\musicglyph #\"scripts.coda\" }",
        '@segno@':     "\\mark \\markup { \\musicglyph #\"scripts.segno\" }",
        '@fim@':       '\\bar "|." \\mark \\markup { \\bold { Fim } }',
    }
    for grupo in grupos:
        g = grupo.strip()
        if not g:
            continue
        # Se for placeholder estrutural
        if g in LILY_MARKS:
            if g == '@fim@':
                partes.append("\\set Score.repeatCommands = #'((volta #f))")
            partes.append(LILY_MARKS[g])
            continue
        ly = _converter_tempo(g)
        partes.append(ly)
        cont_tempo += 1
        if cont_tempo >= tempos_por_compasso:
            partes.append('|')
            cont_tempo = 0
            cont_compasso += 1
            if cont_compasso % compassos_por_linha == 0:
                partes.append('\\break')
    corpo = ' '.join(partes)
    time_cmd = f'  \\time {comp_base}{beat_struct}\n'
    return (
        time_cmd +
        f'  \\tempo 4 = {andamento}\n'
        f'  \\key {tonalidade}\n'
        '\n'
        '  ' + corpo + '\n'
    )

def gerar_arquivo_ly(sintaxe, modo, titulo, compasso, andamento=80, tonalidade="c \\major"):
    import tempfile, os
    # Rota orquestral: gera LilyPond completo diretamente
    if _is_orquestral(sintaxe):
        ly = _sintaxe_com_midi(sintaxe, modo, titulo, compasso, andamento=andamento, tonalidade=tonalidade)
        return ly
    # Rota monofônica: usa pipeline legado
    fn, nome = _localizar_parser()
    notas_raw = _sintaxe_para_ly_raw(sintaxe, compasso, andamento=andamento, tonalidade=tonalidade)
    cantiga = {
        "titulo": titulo, "compositor": "Synemusic", "compasso": compasso,
        "tonalidade": tonalidade, "andamento": andamento, "compassos_por_linha": 4,
        "notas_ly_raw": notas_raw,
    }
    with tempfile.NamedTemporaryFile(suffix=".ly", delete=False) as tmp:
        saida_ly = tmp.name
    try:
        fn(cantiga, saida_ly, modo)
        return Path(saida_ly).read_text(encoding="utf-8")
    finally:
        try: os.unlink(saida_ly)
        except: pass

# ────────────────────────── fim do ADAPTADOR ────────────────────────────────


# ─────────────────────────── COMPILAÇÃO TAB ──────────────────────────────────
# Gera LilyPond com Staff (RNFG) + TabStaff (algarismos romanos, ritmo, dedilhado)

_TAB_ROMAN_MAP = "'(\"I\" \"II\" \"III\" \"IV\" \"V\" \"VI\" \"VII\" \"VIII\" \"IX\" \"X\" \"XI\" \"XII\" \"XIII\" \"XIV\" \"XV\" \"XVI\" \"XVII\" \"XVIII\" \"XIX\" \"XX\" \"XXI\" \"XXII\")"

_TAB_HEADER_LY = r'''
#(define (roman-fret-number grob)
   (let* ((fret (ly:grob-property grob 'fret #f))
          (romans %s))
     (if (and (integer? fret) (>= fret 1) (<= fret (length romans)))
         (grob-interpret-markup grob (markup (list-ref romans (1- fret))))
         (if (integer? fret)
             (grob-interpret-markup grob (markup (number->string fret)))
             (grob-interpret-markup grob (markup "?"))))))
''' % _TAB_ROMAN_MAP

def _extrair_dedilhado(sintaxe):
    """Extrai anotações de dedilhado {1-4} (mão esquerda) e {p,i,m,a} (direita)
    da sintaxe original. Retorna lista de strings LilyPond na ordem das notas."""
    import re as _re
    # Remove marcadores estruturais
    s = sintaxe
    for j in ['||:', ':||', '||', 'FIM', 'D.C.', 'D.S.', '𝄌', '𝄋', 'CASA1', 'CASA2']:
        s = s.replace(j, ' ')
    s = _re.sub(r'\([^)]*\)', ' ', s)
    # Extrai tokens que são notas (dígitos com possíveis oitavas/acidentes)
    tokens = _re.findall(r"[0-7]['#b]*\{[^}]*\}|[0-7]['#b]*", s)
    dedos = []
    for tok in tokens:
        m = _re.search(r'\{([^}]*)\}', tok)
        if m:
            txt = m.group(1).strip()
            # txt pode ser "2" (esquerda), "p" (direita), ou "2,i" (ambos)
            partes = txt.replace(',', ' ').split()
            esq = None; dir = None
            for p in partes:
                p = p.strip().lower()
                if p in ('p','i','m','a','c','x'):
                    dir = p
                elif p in ('1','2','3','4','5'):
                    esq = p
            # Gera LilyPond articulation
            arts = []
            if esq: arts.append('-' + esq)
            if dir: arts.append('_' + dir)
            dedos.append(''.join(arts) if arts else '')
        else:
            dedos.append('')
    return dedos

def _aplicar_dedilhado_ly(notas_raw, dedos):
    """Aplica dedilhado às notas num bloco LilyPond.
    Substitui cada nota c'4 por c'4-2 (dedo esquerdo) etc."""
    import re as _re
    if not dedos: return notas_raw
    tokens = _re.findall(r"r\d*\.?\s*|[a-g]['',]*\d*\.?\s*", notas_raw)
    idx = 0
    saida = []
    for tok in tokens:
        tok_s = tok.strip()
        if not tok_s: continue
        if tok_s.startswith('r'):
            saida.append(tok)
            continue
        # É uma nota
        dedo = dedos[idx] if idx < len(dedos) else ''
        saida.append(tok_s + dedo + ' ')
        if dedo: idx += 1
        else: idx += 1
    return ''.join(saida)

def _gerar_tab_ly(sintaxe, titulo, compasso, andamento=80, tonalidade="c \\major", compositor="Synemusic"):
    raw = _sintaxe_para_ly_raw(sintaxe, compasso, andamento=andamento, tonalidade=tonalidade)
    # notas_raw from _sintaxe_para_ly_raw already includes \time, \tempo, \key headers;
    # the template below also adds them, so strip them from raw to avoid duplication.
    linhas = raw.split('\n')
    linhas = [l for l in linhas if not l.strip().startswith(('\\time','\\tempo','\\key'))]
    notas_raw = '\n'.join(linhas)
    return (
        '\\version "2.26.0"\n\n'
        '\\include "cromus_header.ily"\n\n'
        + _TAB_HEADER_LY + '\n'
        '\\header {\n'
        f'  title    = "{titulo}"\n'
        f'  composer = "{compositor}"\n'
        '  tagline  = ##f\n'
        '}\n\n'
        '#(set-global-staff-size 34)\n'
        '\n\\paper {\n'
        '  #(set-paper-size "a4")\n'
        '  ragged-bottom = ##f\n'
        '  ragged-last   = ##f\n'
        '  indent        = 0.8\\cm\n'
        '  short-indent  = 0\\cm\n'
        '  top-margin    = 10\\mm\n'
        '  bottom-margin = 14\\mm\n'
        '  left-margin   = 12\\mm\n'
        '  right-margin  = 12\\mm\n'
        '  print-page-number = ##t\n'
        '  print-first-page-number = ##t\n'
        '  system-system-spacing.padding = 6\\mm\n'
        '  system-system-spacing.minimum-distance = 5\\mm\n'
        '  page-limit-inter-system-space = ##t\n'
        '  page-limit-inter-system-space-factor = 1.3\n'
        '}\n\n'
        '\\score {\n'
        '  <<\n'
        '    \\new Staff \\with {\n'
        '      \\consists #(cromus-engraver-factory "REAL")\n'
        '    } {\n'
        f'      \\clef treble\n'
        f'      \\key {tonalidade}\n'
        f'      \\time {compasso}\n'
        f'      \\tempo 4 = {andamento}\n\n'
        f'      {notas_raw}\n'
        '    }\n'
        '    \\new TabStaff \\with {\n'
        '      \\tabFullNotation\n'
        '      \\override TabNoteHead.stencil = #roman-fret-number\n'
        '    } {\n'
        '      \\clef moderntab\n'
        f'      \\key {tonalidade}\n'
        f'      \\time {compasso}\n'
        f'      \\tempo 4 = {andamento}\n\n'
        '      \\set TabStaff.stringTunings = #guitar-tuning\n'
        f'      {notas_raw}\n'
        '    }\n'
        '  >>\n'
        '  \\layout {\n'
        '    \\context {\n'
        '      \\Score\n'
        '      \\override SpacingSpanner.uniform-stretching = ##t\n'
        '    }\n'
        '    \\context {\n'
        '      \\TabStaff\n'
        '      \\override TabNoteHead.font-size = -2\n'
        '    }\n'
        '  }\n'
        '}\n'
    )

def compilar_tab(sintaxe, titulo, compasso, compositor="Synemusic"):
    WORK_DIR.mkdir(exist_ok=True)
    for f in WORK_DIR.glob("preview*"): f.unlink(missing_ok=True)
    conteudo_ly = _gerar_tab_ly(sintaxe, titulo, compasso, compositor=compositor)
    (WORK_DIR / "preview.ly").write_text(conteudo_ly, encoding="utf-8")
    if HEADER_FILE.exists():
        shutil.copy(HEADER_FILE, WORK_DIR / HEADER_FILE.name)
    proc = subprocess.run(
        [LILYPOND, "-dno-point-and-click", "--formats=pdf,png",
         "-dresolution=170", "-o", "preview", "preview.ly"],
        capture_output=True, text=True, cwd=str(WORK_DIR), timeout=120)
    log = (proc.stdout or "") + "\n" + (proc.stderr or "")
    paginas = sorted(WORK_DIR.glob("preview*.png"))
    if proc.returncode != 0 and not paginas:
        return {"ok": False, "log": log.strip(), "ly": conteudo_ly}
    imgs = [base64.b64encode(p.read_bytes()).decode() for p in paginas]
    pdf_path = WORK_DIR / "preview.pdf"
    pdf_data = base64.b64encode(pdf_path.read_bytes()).decode() if pdf_path.exists() else ""
    return {"ok": True, "pages": imgs, "log": log.strip(), "ly": conteudo_ly, "pdf": pdf_data}

# ─────────────────────────── COMPILAÇÃO ─────────────────────────────────────
def compilar(sintaxe, modo, titulo, compasso, tonalidade="c \\major"):
    WORK_DIR.mkdir(exist_ok=True)
    for f in WORK_DIR.glob("preview*"): f.unlink(missing_ok=True)
    orquestral_ = _is_orquestral(sintaxe)
    conteudo_ly = gerar_arquivo_ly(sintaxe, modo, titulo, compasso, tonalidade=tonalidade)
    (WORK_DIR / "preview.ly").write_text(conteudo_ly, encoding="utf-8")
    if HEADER_FILE.exists() and not orquestral_:
        shutil.copy(HEADER_FILE, WORK_DIR / HEADER_FILE.name)
    # Passo 1: PDF + PNG para exibição visual
    proc = subprocess.run(
        [LILYPOND, "-dno-point-and-click", "--formats=pdf,png",
         "-dresolution=170", "-o", "preview", "preview.ly"],
        capture_output=True, text=True, cwd=str(WORK_DIR), timeout=120)
    log = (proc.stdout or "") + "\n" + (proc.stderr or "")
    paginas = sorted(WORK_DIR.glob("preview*.png"))
    if proc.returncode != 0 and not paginas:
        return {"ok": False, "log": log.strip(), "ly": conteudo_ly}
    imgs = [base64.b64encode(p.read_bytes()).decode() for p in paginas]

    # Passo 2: SVG apenas para extrair posições das notas (highlight nota-a-nota)
    posicoes = []
    subprocess.run(
        [LILYPOND, "-dno-point-and-click", "-dbackend=svg",
         "-o", "preview", "preview.ly"],
        capture_output=True, text=True, cwd=str(WORK_DIR), timeout=60)
    svgs = sorted(WORK_DIR.glob("preview*.svg"))
    _RE_NOTA = re.compile(
        r'<g color="rgba\([^)]+%\)">\s*'
        r'<g transform="translate\(([\d\.\-]+),\s*([\d\.\-]+)\)">\s*'
        r'(?:<circle[^>]*/>|<path[^>]*/>|<rect[^>]*/>)'
    )
    for svg_path in svgs:
        svg_content = svg_path.read_text(encoding="utf-8")
        notas = _RE_NOTA.findall(svg_content)
        vb = re.search(
            r'viewBox="([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)\s+([\d\.\-]+)"',
            svg_content
        )
        posicoes.append({
            "notas": [{"x": float(x), "y": float(y)} for x, y in notas],
            "w": float(vb.group(3)) if vb else 63,
            "h": float(vb.group(4)) if vb else 89,
        })
        svg_path.unlink(missing_ok=True)  # limpa SVG após extrair

    return {"ok": True, "pages": imgs, "positions": posicoes,
            "log": log.strip(), "ly": conteudo_ly,
            "pdf": (WORK_DIR / "preview.pdf").exists()}


# ─────────────────────────── ÁUDIO ORQUESTRAL ───────────────────────────────
# Gera WAV via LilyPond → MIDI → FluidSynth com SoundFont real

_SOUNDFONT_PATHS = [
    os.path.expanduser("~/Library/Audio/Sounds/MuseScore_General.sf3"),
    os.path.expanduser("~/Library/Audio/Sounds/FluidR3_GM.sf2"),
    "/opt/homebrew/share/soundfonts/MuseScore_General.sf3",
    "/usr/share/sounds/sf2/FluidR3_GM.sf2",
]

def _localizar_soundfont():
    for p in _SOUNDFONT_PATHS:
        if os.path.exists(p):
            return p
    return None


def _compilar_audio(sintaxe, titulo, compasso, andamento=80, tonalidade="c \\major"):
    WORK_DIR.mkdir(exist_ok=True)
    for f in WORK_DIR.glob("midi_*"): f.unlink(missing_ok=True)
    for f in WORK_DIR.glob("audio_*"): f.unlink(missing_ok=True)
    # Gera .ly com \midi (aproveita a função orquestral se multi-voz)
    ly = _sintaxe_com_midi(sintaxe, "REAL", titulo, compasso, andamento=andamento, tonalidade=tonalidade)
    ly_path = WORK_DIR / "midi_preview.ly"
    ly_path.write_text(ly, encoding="utf-8")
    # Compila .ly → MIDI
    proc = subprocess.run(
        [LILYPOND, "-dno-point-and-click", "--formats=midi", "-o", "midi_preview", "midi_preview.ly"],
        capture_output=True, text=True, cwd=str(WORK_DIR), timeout=120)
    log = (proc.stdout or "") + "\n" + (proc.stderr or "")
    midis = sorted(WORK_DIR.glob("midi_preview*.midi")) or sorted(WORK_DIR.glob("midi_preview*.mid"))
    if not midis and proc.returncode != 0:
        return {"ok": False, "erro": "MIDI não gerado", "log": log.strip()}
    midi_path = midis[0]
    # MIDI → WAV via FluidSynth
    wav_path = WORK_DIR / "audio_preview.wav"
    sf_path = _localizar_soundfont()
    if not sf_path:
        # Fallback: MIDI bruto sem SoundFont
        wav_data = base64.b64encode(midi_path.read_bytes()).decode()
        return {"ok": True, "midi": wav_data, "wav": None,
                "erro": "SoundFont não encontrado. Baixe um .sf2 em ~/Library/Audio/Sounds/",
                "log": log.strip()}
    fs_cmd = ["fluidsynth", "-ni", "-F", str(wav_path), "-g", "0.8", sf_path,
              "-T", "wav", str(midi_path)]
    subprocess.run(fs_cmd, capture_output=True, text=True, timeout=180)
    if not wav_path.exists():
        return {"ok": False, "erro": "FluidSynth não gerou WAV", "log": log.strip()}
    wav_data = base64.b64encode(wav_path.read_bytes()).decode()
    # Limpeza
    ly_path.unlink(missing_ok=True)
    midi_path.unlink(missing_ok=True)
    return {"ok": True, "wav": wav_data, "midi": None, "log": log.strip()}


# ─────────────────────────── PARSER MUSICXML ────────────────────────────────
def parse_musicxml(xml_text):
    NOTA_GRAU = {'C':1,'D':2,'E':3,'F':4,'G':5,'A':6,'B':7}
    DUR_MAP   = {'whole':'w','half':'h','quarter':'q','eighth':'e','16th':'s','32nd':'t'}
    notas = []
    for nxml in re.findall(r'<note\b[^>]*>.*?</note>', xml_text, re.DOTALL):
        if '<rest' in nxml:
            tipo = re.search(r'<type>([^<]+)</type>', nxml)
            dur  = DUR_MAP.get((tipo.group(1).strip() if tipo else 'quarter'), 'q')
            notas.append(f'0{dur}{"." if "<dot/>" in nxml else ""}')
            continue
        step  = re.search(r'<step>([A-G])</step>', nxml)
        tipo  = re.search(r'<type>([^<]+)</type>', nxml)
        alter = re.search(r'<alter>([^<]+)</alter>', nxml)
        if not step: continue
        grau = NOTA_GRAU.get(step.group(1), 1)
        dur  = DUR_MAP.get((tipo.group(1).strip() if tipo else 'quarter'), 'q')
        acc  = ('#' if alter and float(alter.group(1))>0 else
                'b' if alter and float(alter.group(1))<0 else '')
        tie  = '~' if re.search(r"<tie\s+type=[\"']start[\"']", nxml) else ''
        notas.append(f'{grau}{acc}{dur}{"." if "<dot/>" in nxml else ""}{tie}')
    if not notas: return ''
    return ',\n'.join(' '.join(notas[i:i+4]) for i in range(0,len(notas),4))


# ─────────────────────────── EXTRAÇÃO PDF ───────────────────────────────────
def _extrair_texto_pdf(pdf_bytes):
    try:
        from pdfminer.high_level import extract_text_to_fp
        from pdfminer.layout import LAParams
        import io
        out = io.StringIO()
        extract_text_to_fp(io.BytesIO(pdf_bytes), out, laparams=LAParams())
        return out.getvalue().strip()
    except ImportError: pass
    try:
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            f.write(pdf_bytes); tmp = f.name
        proc = subprocess.run(['pdftotext', tmp, '-'], capture_output=True, text=True)
        os.unlink(tmp)
        if proc.returncode == 0: return proc.stdout.strip()
    except Exception: pass
    return "(Instale pdfminer.six: pip install pdfminer.six)"

def _detectar_sintaxe_no_texto(texto):
    tokens = re.findall(r'\b[0-7](?:[#b])?(?:[whqest])\.?~?\b', texto)
    if len(tokens) < 3: return ''
    return ',\n'.join(' '.join(tokens[i:i+4]) for i in range(0,len(tokens),4))


# ═══════════════════════════════════════════════════════════════════════════
#  HTML COMPLETO — v2.0.1
# ═══════════════════════════════════════════════════════════════════════════
HTML = r"""<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Note Form Pro · Synemusic</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
<script src="https://cdn.jsdelivr.net/npm/midi-writer-js@2.1.4/build/midi-writer.js"></script>
<script src="https://unpkg.com/soundfont-player@0.12.0/dist/soundfont-player.js"></script>
<style>
/* ── tokens e tema claro/escuro ── */
:root{
  --do:#C0001A;--re:#ECD200;--mi:#F07300;--fa:#00B050;
  --sol:#0066FF;--la:#8B5E00;--si:#9B5FC0;
  --ok:#5fc88a;--err:#e07a7a;
  --mono:"SF Mono",ui-monospace,Menlo,Consolas,monospace;
  --ui:-apple-system,system-ui,sans-serif;
}
[data-theme="dark"]{
  --bg:#14161c;--panel:#1d2129;--panel2:#20242d;
  --line:#2c313c;--ink:#e8e6df;--dim:#9aa0ad;--paper:#fbfaf6;
}
[data-theme="light"]{
  --bg:#f0f0ee;--panel:#ffffff;--panel2:#f8f8f6;
  --line:#d5d5d0;--ink:#1a1a1a;--dim:#666660;--paper:#ffffff;
}

*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--ink);height:100vh;
  display:flex;flex-direction:column;font:14px/1.5 var(--ui);overflow:hidden;
  transition:background .2s,color .2s}

/* ── HEADER ── */
header{
  display:flex;align-items:center;gap:10px;
  padding:8px 14px;border-bottom:1px solid var(--line);
  flex-shrink:0;background:var(--panel);
}
.dots{display:flex;gap:4px}
.dots i{width:9px;height:9px;border-radius:50%;display:block}
h1{font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
h1 small{color:var(--dim);font-weight:400;text-transform:none;
  letter-spacing:0;margin-left:5px;font-size:12px}
.hdr-right{margin-left:auto;display:flex;align-items:center;gap:8px}
.pill{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--dim)}
.pill .dot{width:6px;height:6px;border-radius:50%;background:var(--dim);flex-shrink:0}
.pill.ok .dot{background:var(--ok)} .pill.err .dot{background:var(--err)}
.hdr-btn{
  background:transparent;border:1px solid var(--line);border-radius:5px;
  color:var(--dim);cursor:pointer;padding:4px 8px;font-size:11px;
  transition:all .15s;
}
.hdr-btn:hover{border-color:#4a5264;color:var(--ink)}

/* ── LAYOUT ── */
main{flex:1;display:grid;grid-template-columns:46px minmax(300px,40%) 1fr;min-height:0;overflow:hidden}

/* ── RAIL ── */
.rail{
  background:var(--panel);border-right:1px solid var(--line);
  display:flex;flex-direction:column;align-items:center;
  padding:8px 0;gap:3px;z-index:5;
}
.rbtn{
  width:34px;height:34px;border-radius:7px;border:none;
  background:transparent;color:var(--dim);cursor:pointer;
  font-size:15px;display:flex;align-items:center;justify-content:center;
  position:relative;transition:background .15s,color .15s;
}
.rbtn:hover,.rbtn.on{background:var(--line);color:var(--ink)}
.rbtn:hover::after{
  content:attr(data-tip);
  position:absolute;left:42px;top:50%;transform:translateY(-50%);
  background:var(--panel2);border:1px solid var(--line);
  color:var(--ink);padding:3px 8px;border-radius:5px;
  font-size:11px;white-space:nowrap;pointer-events:none;z-index:99;
}
.rail-sep{width:22px;height:1px;background:var(--line);margin:3px 0}

/* ── EDITOR ── */
.editor{
  display:flex;flex-direction:column;position:relative;
  border-right:1px solid var(--line);background:var(--panel);min-height:0;
}
.editor.split{flex-direction:row}
.editor-left{
  display:flex;flex-direction:column;
  width:280px;min-width:200px;max-width:520px;
  flex-shrink:0;background:var(--panel2);
  border-right:1px solid var(--line);overflow-y:auto;
}
.editor-left.hidden{display:none}
.editor-right{display:flex;flex-direction:column;flex:1;min-width:0;min-height:0}
.resizer{
  width:6px;cursor:col-resize;background:var(--line);
  flex-shrink:0;transition:background .15s;
}
.resizer:hover{background:var(--ok)}
.resizer.hidden{display:none}
.meta{display:grid;grid-template-columns:1fr 72px 112px;gap:6px;padding:9px 11px 0}
.meta label{display:block;font-size:10px;color:var(--dim);
  text-transform:uppercase;letter-spacing:.08em;margin-bottom:2px}
.meta input,.meta select{
  width:100%;background:var(--bg);color:var(--ink);
  border:1px solid var(--line);border-radius:5px;padding:5px 7px;font-size:13px;
}
.meta input:focus,.meta select:focus{outline:none;border-color:#4a5264}

/* barra info (compasso + métrica) */
.infobar{
  display:flex;align-items:center;gap:10px;
  padding:4px 11px;font-size:11px;color:var(--dim);
  border-bottom:1px solid var(--line);background:var(--panel2);
  flex-shrink:0;
}
.infobar .badge{
  padding:1px 6px;border-radius:3px;background:var(--line);
  font:11px var(--mono);color:var(--ink);
}
.infobar .badge.warn{background:#4a2a00;color:#f0a050}
.infobar .badge.good{background:#0a2a15;color:var(--ok)}

/* busca inline */
.search-bar{
  display:none;align-items:center;gap:7px;
  padding:5px 11px;border-bottom:1px solid var(--line);
  background:var(--panel2);flex-shrink:0;
}
.search-bar.open{display:flex}
.search-bar input{
  flex:1;background:var(--bg);color:var(--ink);
  border:1px solid var(--line);border-radius:5px;padding:4px 8px;font-size:12px;
}
.search-bar input:focus{outline:none;border-color:#4a5264}
.sbtn{
  background:var(--line);color:var(--ink);border:none;border-radius:5px;
  padding:4px 9px;font-size:11px;cursor:pointer;transition:opacity .15s;
}
.sbtn:hover{opacity:.8}

#sintaxe{
  flex:1;margin:9px 11px;background:var(--bg);color:var(--ink);
  border:1px solid var(--line);border-radius:7px;padding:11px;
  resize:none;font:14px/1.9 var(--mono);letter-spacing:.03em;min-height:0;
  transition:border-color .15s;
}
/* barrinha de marcadores do compasso atual */
.comp-bar{
  display:flex;align-items:center;gap:4px;
  padding:2px 11px 0;font-size:11px;color:var(--dim);
  flex-shrink:0;overflow-x:auto;
}
.comp-bar .cnum{font:bold 12px var(--mono);color:var(--ink);margin-right:4px;white-space:nowrap}
.comp-bar .cmrk{
  background:var(--line);border:none;border-radius:4px;padding:2px 7px;
  font:10px var(--mono);color:var(--dim);cursor:pointer;white-space:nowrap;
  transition:all .15s;
}
.comp-bar .cmrk:hover{background:#3a3f4e;color:var(--ink)}
.comp-bar .cmrk.on{background:#0a3a2a;color:var(--ok);box-shadow:0 0 0 1px var(--ok)}
/* grade de propriedades no painel */
.prop-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.pbtn{
  background:var(--line);border:none;border-radius:5px;padding:5px 8px;
  font:10px var(--mono);color:var(--dim);cursor:pointer;text-align:center;
  transition:all .12s;
}
.pbtn:hover{background:#3a3f50;color:var(--ink)}
.pbtn.on{background:#0a2a18;color:var(--ok);box-shadow:inset 0 0 0 1px var(--ok)}
.pbtn.dcon{background:#3a1a18;color:#f08060;box-shadow:inset 0 0 0 1px #f08060}
#sintaxe:focus{outline:none;border-color:#4a5264}
.ebar{display:flex;align-items:center;gap:6px;padding:0 11px 9px;flex-wrap:wrap}
.btn{
  background:var(--ink);color:var(--bg);border:none;border-radius:5px;
  padding:6px 11px;font-size:12px;font-weight:600;cursor:pointer;
  transition:opacity .15s;
}
.btn:hover{opacity:.82}
.btn.g{background:transparent;color:var(--dim);border:1px solid var(--line)}
.btn.danger{background:#5a1a1a;color:#ffaaaa;border:none}
.hint{font-size:11px;color:var(--dim);margin-left:auto}

/* ── PAINEL DE NOTAS ── */
.spanel{
  position:relative;width:280px;min-width:200px;max-width:520px;
  background:var(--panel2);border-right:1px solid var(--line);
  display:none;flex-direction:column;flex-shrink:0;
  z-index:5;overflow-y:auto;
}
.spanel.open{display:flex;order:0}
.ed-col{display:flex;flex-direction:column;flex:1;min-width:0;min-height:0;order:2}
.resizer{order:1;width:6px;cursor:col-resize;background:var(--line);flex-shrink:0;display:none}
.resizer.open{display:block}
.resizer:hover{background:var(--ok)}
.sp-hdr{
  display:flex;align-items:center;justify-content:space-between;
  padding:10px 13px;border-bottom:1px solid var(--line);flex-shrink:0;
}
.sp-hdr h2{font-size:11px;font-weight:700;text-transform:uppercase;
  letter-spacing:.1em;color:var(--dim)}
.sp-x{background:none;border:none;color:var(--dim);cursor:pointer;
  font-size:17px;line-height:1;padding:0}
.sp-body{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:13px}
.sp-sec h3{font-size:10px;color:var(--dim);text-transform:uppercase;
  letter-spacing:.1em;margin-bottom:7px}

/* grade de notas com preview SVG inline */
.note-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.nbtn{
  aspect-ratio:1;border:none;border-radius:6px;cursor:pointer;
  font:bold 13px var(--mono);color:#fff;
  text-shadow:0 1px 3px rgba(0,0,0,.5);
  transition:transform .1s;display:flex;align-items:center;justify-content:center;
}
.nbtn:hover{transform:scale(1.1)}
.nbtn.sel{outline:2px solid #fff;outline-offset:1px}
.nbtn.playing{transform:scale(1.2);box-shadow:0 0 20px 8px rgba(255,255,255,.45);z-index:2}
.n1{background:var(--do)} .n2{background:var(--re);color:#1a1a1a}
.n3{background:var(--mi);color:#1a1a1a} .n4{background:var(--fa)}
.n5{background:var(--sol)} .n6{background:var(--la)} .n7{background:var(--si)}

/* preview RNFG visual do token */
.tok-visual{
  background:var(--bg);border:1px solid var(--line);border-radius:7px;
  padding:10px;display:flex;align-items:center;gap:10px;min-height:52px;
}
.tok-visual svg{flex-shrink:0}
.tok-str{font:14px var(--mono);color:var(--ok);letter-spacing:.06em}
.tok-str .ph{color:var(--dim);font-size:12px}

.dur-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
.dbtn{
  padding:6px 2px;border:1px solid var(--line);border-radius:5px;
  background:var(--bg);color:var(--ink);cursor:pointer;
  font-size:14px;text-align:center;transition:background .12s;line-height:1;
}
.dbtn:hover{background:var(--line)} .dbtn.sel{border-color:var(--ok);color:var(--ok)}
.acc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}
.abtn{
  padding:6px;border:1px solid var(--line);border-radius:5px;
  background:var(--bg);color:var(--ink);cursor:pointer;
  font-size:14px;text-align:center;transition:background .12s;
}
.abtn:hover,.abtn.sel{background:var(--line);border-color:#4a5264}
.mod-row{display:flex;gap:5px;flex-wrap:wrap}
.mbtn{
  padding:4px 10px;border:1px solid var(--line);border-radius:18px;
  background:var(--bg);color:var(--dim);cursor:pointer;font-size:11.5px;
  transition:all .12s;
}
.mbtn.sel{background:var(--ok);color:#000;border-color:var(--ok);font-weight:600}
.tok-acts{display:flex;gap:5px;margin-top:7px}

/* atalho keyboard display */
.kbd{
  display:inline-block;padding:1px 5px;background:var(--line);
  border-radius:3px;font:11px var(--mono);color:var(--dim);
  margin-left:4px;
}

/* ── ABAS ── */
.preview-col{display:flex;flex-direction:column;min-height:0;overflow:hidden}
.tabs{display:flex;border-bottom:1px solid var(--line);background:var(--panel);flex-shrink:0}
.tab{
  padding:8px 14px;font-size:11.5px;font-weight:600;cursor:pointer;
  color:var(--dim);border-bottom:2px solid transparent;
  transition:color .12s,border-color .12s;text-transform:uppercase;letter-spacing:.04em;
}
.tab.on{color:var(--ink);border-bottom-color:var(--ok)}
.tabcontent{flex:1;overflow:auto;min-height:0}
.pane{display:none;height:100%}
.pane.on{display:flex;flex-direction:column}

/* partitura */
#p-score{overflow:auto;background:#21242c;padding:16px}
[data-theme="light"] #p-score{background:#e8e8e6}
.page{
  background:var(--paper);border-radius:4px;margin:0 auto 12px;
  max-width:900px;box-shadow:0 5px 20px rgba(0,0,0,.35);
}
.page img{width:100%;display:block;border-radius:4px}
.empty{color:var(--dim);text-align:center;margin-top:18vh;font-size:13px}
pre.logbox{
  background:#2a1d1f;color:#e8b4b4;border:1px solid #5c3236;
  border-radius:7px;padding:13px;font:11.5px/1.6 var(--mono);
  white-space:pre-wrap;max-width:900px;margin:0 auto;
}

/* áudio */
#p-audio{overflow:auto;padding:14px;gap:12px}
.acard{background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:14px}
.acard h3{font-size:11px;text-transform:uppercase;letter-spacing:.08em;
  color:var(--dim);margin-bottom:12px}
.transport{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.playbtn{
  width:44px;height:44px;border-radius:50%;border:none;
  background:var(--ok);color:#000;cursor:pointer;
  font-size:17px;display:flex;align-items:center;justify-content:center;
  transition:transform .1s;
}
.playbtn:hover{transform:scale(1.06)}
.stopbtn{
  width:34px;height:34px;border-radius:50%;border:none;
  background:var(--line);color:var(--ink);cursor:pointer;
  font-size:13px;display:flex;align-items:center;justify-content:center;
}
.bpm-w{display:flex;align-items:center;gap:6px;color:var(--dim);font-size:12px}
#bpmVal{
  width:56px;background:var(--bg);color:var(--ink);
  border:1px solid var(--line);border-radius:5px;
  padding:4px 7px;font-size:13px;text-align:center;
}
.inst-w{display:flex;align-items:center;gap:7px;margin-top:9px;
  font-size:12px;color:var(--dim)}
#instSel{background:var(--bg);color:var(--ink);border:1px solid var(--line);
  border-radius:5px;padding:4px 7px;font-size:12px}
.progbar{height:3px;background:var(--line);border-radius:2px;margin-top:11px;overflow:hidden}
.progfill{height:100%;background:var(--ok);width:0%;transition:width .1s linear}
.exp-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
.expbtn{
  display:flex;align-items:center;gap:5px;padding:6px 11px;
  border:1px solid var(--line);border-radius:6px;
  background:var(--bg);color:var(--ink);cursor:pointer;
  font-size:12px;font-weight:600;transition:background .12s;
}
.expbtn:hover{background:var(--line)}
.alog{font:11px var(--mono);color:var(--dim);margin-top:8px;min-height:14px}

/* importação */
#p-import{overflow:auto;padding:14px;gap:10px}
.drop-zone{
  border:2px dashed var(--line);border-radius:9px;
  padding:24px;text-align:center;cursor:pointer;
  transition:border-color .15s,background .15s;color:var(--dim);font-size:13px;
}
.drop-zone:hover{border-color:#4a5264;background:rgba(255,255,255,.02)}
.imp-result{
  margin-top:10px;background:var(--panel);border:1px solid var(--line);
  border-radius:8px;padding:12px;font:11.5px/1.6 var(--mono);
  color:var(--ink);white-space:pre-wrap;max-height:240px;overflow:auto;display:none;
}
.imp-acts{display:none;margin-top:7px}

/* LilyPond */
#p-ly{overflow:auto;padding:14px}
#p-ly pre{
  font:12px/1.7 var(--mono);color:#a8d4f5;background:var(--panel);
  border:1px solid var(--line);border-radius:7px;padding:13px;white-space:pre-wrap;
}

/* log histórico */
#p-log{overflow:auto;padding:14px}
.log-entry{
  display:flex;gap:8px;align-items:flex-start;padding:6px 0;
  border-bottom:1px solid var(--line);font:12px var(--mono);
}
.log-entry:last-child{border-bottom:none}
.log-ts{color:var(--dim);flex-shrink:0;font-size:11px;padding-top:1px}
.log-ok{color:var(--ok)} .log-err{color:var(--err)}
.log-msg{flex:1;white-space:pre-wrap;font-size:11.5px}

/* modal de confirmação */
.overlay{
  position:fixed;inset:0;background:rgba(0,0,0,.6);
  display:none;align-items:center;justify-content:center;z-index:100;
}
.overlay.open{display:flex}
.modal{
  background:var(--panel);border:1px solid var(--line);border-radius:10px;
  padding:22px 26px;max-width:320px;text-align:center;
}
.modal h3{font-size:14px;margin-bottom:10px}
.modal p{font-size:13px;color:var(--dim);margin-bottom:18px}
.modal-btns{display:flex;gap:8px;justify-content:center}
</style>
</head>
<body>

<!-- HEADER -->
<header>
  <span class="dots">
    <i style="background:var(--do)"></i><i style="background:var(--re)"></i>
    <i style="background:var(--mi)"></i><i style="background:var(--fa)"></i>
    <i style="background:var(--sol)"></i><i style="background:var(--la)"></i>
    <i style="background:var(--si)"></i>
  </span>
  <h1>Note Form Pro <small>v2.1 · Synemusic</small></h1>
  <div class="hdr-right">
    <button class="hdr-btn" onclick="toggleTheme()" id="themeBtn">☀️ Claro</button>
    <button class="hdr-btn" onclick="toggleSearch()">🔍 <span class="kbd">⌘F</span></button>
    <div class="pill" id="pill"><span class="dot"></span><span id="pillTxt">pronto</span></div>
  </div>
</header>

<main>
  <!-- RAIL -->
  <div class="rail">
    <button class="rbtn" data-tip="Editor de notas (F2)" id="btnPanel" onclick="togglePanel()">🎼</button>
    <div class="rail-sep"></div>
    <button class="rbtn" data-tip="Partitura"        onclick="sw('score')">📋</button>
    <button class="rbtn" data-tip="Áudio / Exportar" onclick="sw('audio')">🔊</button>
    <button class="rbtn" data-tip="Importar arquivo" onclick="sw('import')">📂</button>
    <button class="rbtn" data-tip="LilyPond"         onclick="sw('ly')">📄</button>
    <button class="rbtn" data-tip="Real Tablatura"   onclick="sw('tab')">🎸</button>
    <button class="rbtn" data-tip="Harmonia Real"    onclick="sw('harm')">🎵</button>
    <button class="rbtn" data-tip="Log de compilação" onclick="sw('log')">📋</button>
  </div>

  <!-- EDITOR -->
  <section class="editor" id="editorSection">
    <div class="resizer" id="resizer"></div>
    <div class="ed-col">
    <div class="meta">
      <div><label>Título</label>
        <input id="titulo" value="Sem título" spellcheck="false"></div>
      <div><label>Compasso</label>
        <input id="compasso" value="2/4" spellcheck="false" oninput="atualizarInfo()"></div>
      <div><label>Modo</label>
        <select id="modo">
          <option value="REAL">REAL (cores)</option>
          <option value="FORMA">FORMA (preto)</option>
          <option value="STAFFLESS">Sem Pentagrama</option>
          <option value="TAB">Tab + Partitura 🎸</option>
        </select>
      </div>
    </div>

    <!-- barra de info em tempo real -->
    <div class="infobar">
      <span id="infoCompassos">compassos: —</span>
      <span id="infoTokens">tokens: 0</span>
      <span class="badge" id="infoMetrica">—</span>
    </div>
    <div class="comp-bar" id="compBar">
      <span class="cnum" id="compNumLabel">Comp. 1</span>
      <button class="cmrk" data-cmrk="repeat-start" onclick="toggleCompMark('repeat-start')" title="Início de repetição">|:</button>
      <button class="cmrk" data-cmrk="repeat-end"   onclick="toggleCompMark('repeat-end')"   title="Fim de repetição">:|</button>
      <button class="cmrk" data-cmrk="casa1"        onclick="toggleCompMark('casa1')"        title="Casa 1">C₁</button>
      <button class="cmrk" data-cmrk="casa2"        onclick="toggleCompMark('casa2')"        title="Casa 2">C₂</button>
      <button class="cmrk" data-cmrk="dc"           onclick="toggleCompMark('dc')"           title="Da Capo">D.C.</button>
      <button class="cmrk" data-cmrk="ds"           onclick="toggleCompMark('ds')"           title="Dal Segno">D.S.</button>
      <button class="cmrk" data-cmrk="coda"         onclick="toggleCompMark('coda')"         title="Coda (𝄌)">𝄌</button>
      <button class="cmrk" data-cmrk="segno"        onclick="toggleCompMark('segno')"        title="Segno (𝄋)">𝄋</button>
      <button class="cmrk" data-cmrk="fine"         onclick="toggleCompMark('fine')"         title="Fine / Fim">Fine</button>
    </div>

    <!-- busca inline -->
    <div class="search-bar" id="searchBar">
      <input type="text" id="searchInput" placeholder="Buscar na sintaxe…"
             oninput="doSearch()" onkeydown="searchKey(event)">
      <span id="searchCount" style="font-size:11px;color:var(--dim)">—</span>
      <button class="sbtn" onclick="searchMove(-1)">↑</button>
      <button class="sbtn" onclick="searchMove(1)">↓</button>
      <button class="sbtn" onclick="toggleSearch()">✕</button>
    </div>

    <textarea id="sintaxe" spellcheck="false"
      placeholder="Escreva a Sintaxe Cromus aqui…&#10;&#10;Ex.:  1 1, 5 5, 6 6, 5 -"
      ondragover="event.preventDefault()"
      ondrop="handleDropOnEditor(event)"></textarea>

    <div class="ebar">
      <button class="btn" id="btnRun">Renderizar</button>
      <button class="btn g" id="btnPdf">PDF</button>
      <button class="btn g" onclick="exportLy()">Salvar .ly</button>
      <button class="btn danger" onclick="pedirLimpar()">Limpar</button>
      <span class="hint">⌘↵ · Undo ⌘Z</span>
    </div>

    </div><!-- fecha ed-col -->

    <!-- PAINEL DE EDIÇÃO DE NOTAS -->
    <div class="spanel" id="spanel">
      <div class="sp-hdr">
        <h2>Editor de Notas <span class="kbd">F2</span></h2>
        <button class="sp-x" onclick="togglePanel()">✕</button>
      </div>
      <div class="sp-body">

        <div class="sp-sec">
          <h3>Nota <span class="kbd">1–7</span></h3>
          <div class="note-grid">
            <button class="nbtn n1" data-n="1" onclick="setNota(1)" title="Dó — tecla 1">1</button>
            <button class="nbtn n2" data-n="2" onclick="setNota(2)" title="Ré — tecla 2">2</button>
            <button class="nbtn n3" data-n="3" onclick="setNota(3)" title="Mi — tecla 3">3</button>
            <button class="nbtn n4" data-n="4" onclick="setNota(4)" title="Fá — tecla 4">4</button>
            <button class="nbtn n5" data-n="5" onclick="setNota(5)" title="Sol — tecla 5">5</button>
            <button class="nbtn n6" data-n="6" onclick="setNota(6)" title="Lá — tecla 6">6</button>
            <button class="nbtn n7" data-n="7" onclick="setNota(7)" title="Si — tecla 7">7</button>
          </div>
        </div>

        <div class="sp-sec">
          <h3>Silêncio &amp; Oitava <span class="kbd">S</span></h3>
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            <button class="mbtn" data-n="0" onclick="setNota(0)">— Silêncio <span class="kbd">S</span></button>
            <button class="mbtn" id="togOct8va" onclick="toggleMod('oct8va')">8va ↑</button>
            <button class="mbtn" id="togOct8vb" onclick="toggleMod('oct8vb')">8vb ↓</button>
          </div>
        </div>

        <div class="sp-sec">
          <h3>Duração <span class="kbd">R W Q E T</span></h3>
          <div class="dur-grid">
            <button class="dbtn" data-d="w" onclick="setDur('w')" title="Semibreve — R">𝅝</button>
            <button class="dbtn" data-d="h" onclick="setDur('h')" title="Mínima — W">𝅗</button>
            <button class="dbtn sel" data-d="q" onclick="setDur('q')" title="Semínima — Q">♩</button>
            <button class="dbtn" data-d="e" onclick="setDur('e')" title="Colcheia — E">♪</button>
            <button class="dbtn" data-d="s" onclick="setDur('s')" title="Semicolcheia — T">𝅘𝅥𝅯</button>
          </div>
        </div>

        <div class="sp-sec">
          <h3>Acidente <span class="kbd">B N #</span></h3>
          <div class="acc-grid">
            <button class="abtn" data-a="b"  onclick="setAcc('b')"  title="Bemol — B">♭</button>
            <button class="abtn sel" data-a="" onclick="setAcc('')"  title="Natural — N">♮</button>
            <button class="abtn" data-a="#"  onclick="setAcc('#')"  title="Sustenido — #">♯</button>
          </div>
        </div>

        <div class="sp-sec">
          <h3>Modificadores <span class="kbd">. ~ (</span></h3>
          <div class="mod-row">
            <button class="mbtn" id="togDot"    onclick="toggleMod('dot')">Ponto <span class="kbd">.</span></button>
            <button class="mbtn" id="togTie"    onclick="toggleMod('tie')">Ligadura <span class="kbd">~</span></button>
            <button class="mbtn" id="togSlur"   onclick="toggleMod('slur')">Legato <span class="kbd">(</span></button>
          </div>
        </div>

        <div class="sp-sec">
          <h3>Token RNFG</h3>
          <div class="tok-visual" id="tokVisual">
            <svg width="32" height="32" id="tokSvg" viewBox="0 0 32 32"></svg>
            <span class="tok-str" id="tokStr"><span class="ph">nota + duração</span></span>
          </div>
          <div class="tok-acts">
            <button class="btn" style="flex:1;font-size:12px" onclick="insertToken()">Inserir <span class="kbd">↵</span></button>
            <button class="btn g" style="font-size:12px" onclick="insertBar()">| Barra</button>
          </div>
        </div>

        <div class="sp-sec">
          <h3>Propriedades do Compasso <span id="propCompNum" style="color:var(--ok)">1</span></h3>
          <div class="prop-grid">
            <button class="pbtn" data-prop="repeat-start" onclick="toggleProp('repeat-start')">|: Repetir</button>
            <button class="pbtn" data-prop="repeat-end"   onclick="toggleProp('repeat-end')">:| Fim Rep.</button>
            <button class="pbtn" data-prop="casa1"        onclick="toggleProp('casa1')">Casa 1</button>
            <button class="pbtn" data-prop="casa2"        onclick="toggleProp('casa2')">Casa 2</button>
            <button class="pbtn dcon" data-prop="dc"      onclick="toggleProp('dc')">D.C.</button>
            <button class="pbtn dcon" data-prop="ds"      onclick="toggleProp('ds')">D.S.</button>
            <button class="pbtn dcon" data-prop="coda"    onclick="toggleProp('coda')">𝄌</button>
            <button class="pbtn dcon" data-prop="segno"   onclick="toggleProp('segno')">𝄋</button>
            <button class="pbtn dcon" data-prop="fine"    onclick="toggleProp('fine')">Fine ✣</button>
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- PREVIEW -->
  <div class="preview-col">
    <div class="tabs">
      <span class="tab on"  data-t="score"  onclick="sw('score')">Partitura</span>
      <span class="tab"     data-t="audio"  onclick="sw('audio')">Áudio</span>
      <span class="tab"     data-t="import" onclick="sw('import')">Importar</span>
      <span class="tab"     data-t="ly"     onclick="sw('ly')">LilyPond</span>
      <span class="tab"     data-t="tab"    onclick="sw('tab')">Tablatura</span>
      <span class="tab"     data-t="harm"   onclick="sw('harm')">Harmonia</span>
      <span class="tab"     data-t="log"    onclick="sw('log')">Log</span>
    </div>
    <div class="tabcontent">

      <!-- Partitura -->
      <div class="pane on" id="p-score">
        <div class="empty" id="emptyMsg">A partitura aparece aqui assim que você digitar.</div>
      </div>

      <!-- Áudio -->
      <div class="pane" id="p-audio">
        <div class="acard">
          <h3>Playback <span class="kbd">Espaço</span></h3>
          <div class="transport">
            <button class="playbtn" id="playBtn" onclick="audioPlay()">▶</button>
            <button class="stopbtn" onclick="audioStop()">■</button>
            <div class="bpm-w">BPM <input type="number" id="bpmVal" value="80" min="20" max="300"></div>
          </div>
          <div class="inst-w">Instrumento
            <select id="instSel">
              <option value="piano" selected>Piano</option>
              <option value="violao">Violão</option>
              <option value="flauta">Flauta</option>
              <option value="ukulele">Ukulele</option>
              <option value="lira">Lira</option>
              <option value="salterio">Saltério</option>
              <option value="orgao">Órgão</option>
              <option value="synth">Sintetizador</option>
            </select>
          </div>
          <div class="metro-row" style="display:flex;align-items:center;gap:10px;margin-top:10px">
            <button id="metroBtn" onclick="toggleMetro()"
              style="background:var(--bg);border:1px solid var(--line);border-radius:6px;
              color:var(--dim);cursor:pointer;padding:5px 11px;font-size:12px">
              🔇 Metrônomo</button>
            <div id="metroBlink" style="width:14px;height:14px;border-radius:50%;
              background:var(--line);transition:background .05s"></div>
            <div id="compassoInd" style="font:12px var(--mono);color:var(--dim)">
              compasso — · tempo —</div>
          </div>
          <div class="progbar" style="margin-top:10px"><div class="progfill" id="progFill"></div></div>
          <div class="alog" id="alog">Pronto.</div>
        </div>
        <div class="acard" style="margin-top:0">
          <h3>Exportar</h3>
          <div class="exp-row">
            <button class="expbtn" onclick="exportMidi()">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M8 2v8M5 7l3 3 3-3M3 13h10"/></svg>
              MIDI
            </button>
            <button class="expbtn" onclick="exportWav()">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M8 2v8M5 7l3 3 3-3M3 13h10"/></svg>
              WAV
            </button>
            <button class="expbtn" onclick="exportLy()">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M8 2v8M5 7l3 3 3-3M3 13h10"/></svg>
              .ly
            </button>
          </div>
          <div class="alog" id="explog"></div>
        </div>
      </div>

      <!-- Importar -->
      <div class="pane" id="p-import">
        <div style="font-size:13px;color:var(--dim);margin-bottom:8px">
          Abra um <strong>MusicXML</strong> ou <strong>PDF</strong> para importar notas como Sintaxe Cromus.<br>
          <small>Também pode arrastar o arquivo direto sobre o editor de texto.</small>
        </div>
        <div class="drop-zone" id="dropZone"
             onclick="document.getElementById('fileIn').click()">
          <div style="font-size:28px;margin-bottom:7px">📂</div>
          Clique ou arraste aqui<br>
          <small style="color:var(--dim)">MusicXML · PDF</small>
        </div>
        <input type="file" id="fileIn" accept=".xml,.mxl,.musicxml,.pdf"
               style="display:none" onchange="handleFile(this.files[0])">
        <div class="imp-result" id="impResult"></div>
        <div class="imp-acts" id="impActs">
          <button class="btn" onclick="useImported()">Usar no Editor →</button>
        </div>
      </div>

      <!-- LilyPond -->
      <div class="pane" id="p-ly">
        <pre id="lyCode">— compile para ver o código LilyPond —</pre>
      </div>

      <!-- Tablatura -->
      <div class="pane" id="p-tab">
        <div style="padding:10px 14px;display:flex;flex-direction:column;gap:8px;height:100%">
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <span style="font-weight:600;font-size:13px">Sintaxe:</span>
            <textarea id="tabSintaxe" rows="1" spellcheck="false"
              style="flex:1;font:13px var(--mono);padding:5px 8px;background:var(--bg);
              border:1px solid var(--line);border-radius:6px;color:var(--ink);resize:vertical;min-height:30px"
              placeholder="Cole ou edite a Sintaxe Cromus"
              oninput="tabAutoParse()"></textarea>
            <label style="font-size:12px">Tom:
              <select id="tabTonalidade" style="font-size:12px;background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:4px">
                <option>C</option><option>G</option><option>D</option><option>A</option><option>E</option><option>B</option>
                <option>F</option><option>Bb</option><option>Eb</option><option>Ab</option><option>Db</option><option>Gb</option>
                <option>Am</option><option>Em</option><option>Bm</option><option>F#m</option><option>C#m</option>
                <option>Dm</option><option>Gm</option><option>Cm</option><option>Fm</option>
              </select>
            </label>
            <button class="btn" style="font-size:12px;padding:4px 10px" onclick="syncTabSintaxe()">⇅ Sinc</button>
            <button class="btn" style="font-size:12px;padding:4px 10px" onclick="gerarTab()">🎸 Gerar</button>
          </div>
          <div id="tabOutput" style="flex:1;overflow:auto;min-height:150px">
            <div style="color:var(--dim);font-size:13px">
              A tablatura aparece automaticamente ao abrir ou clicar em Gerar.
            </div>
          </div>
        </div>
      </div>

      <!-- Harmonia Real -->
      <div class="pane" id="p-harm">
        <div style="padding:14px;display:flex;flex-direction:column;gap:12px;height:100%">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span style="font-weight:600">Cifra:</span>
            <input id="harmCifra" spellcheck="false" placeholder="Ex: G7, Am, Dm7, C"
              style="width:140px;font:16px var(--mono);padding:6px;background:var(--bg);
              border:1px solid var(--line);border-radius:6px;color:var(--ink)">
            <label>Tonalidade:
              <select id="harmTonalidade" style="background:var(--bg);color:var(--ink);border:1px solid var(--line)">
                <option>C</option><option>G</option><option>D</option><option>A</option><option>E</option><option>B</option>
                <option>F</option><option>Bb</option><option>Eb</option><option>Ab</option><option>Db</option><option>Gb</option>
              </select>
            </label>
            <label>Modo:
              <select id="harmModo" style="background:var(--bg);color:var(--ink);border:1px solid var(--line)">
                <option value="maior">Maior</option>
                <option value="menor">Menor</option>
              </select>
            </label>
            <button class="btn" onclick="gerarHarmonia()">Analisar</button>
          </div>
          <div id="harmOutput" style="flex:1;overflow:auto;min-height:200px">
            <div style="color:var(--dim);font-size:13px">Digite uma cifra e clique em Analisar.</div>
          </div>
        </div>
      </div>

      <!-- Log -->
      <div class="pane" id="p-log">
        <div id="logList" style="padding:14px"></div>
      </div>

    </div>
  </div>

<!-- MINI-PLAYER FLUTUANTE (visível em qualquer aba) -->
<div id="floatPlayer" style="position:fixed;right:18px;bottom:18px;z-index:50;
  background:var(--panel);border:1px solid var(--line);border-radius:12px;
  box-shadow:0 8px 28px rgba(0,0,0,.4);padding:10px 12px;
  display:flex;align-items:center;gap:10px;font:12px var(--ui)">
  <button onclick="audioPlay()" id="floatPlay"
    style="width:38px;height:38px;border-radius:50%;border:none;background:var(--ok);
    color:#000;cursor:pointer;font-size:15px">▶</button>
  <button onclick="audioStop()"
    style="width:30px;height:30px;border-radius:50%;border:none;background:var(--line);
    color:var(--ink);cursor:pointer;font-size:12px">■</button>
  <div id="floatBlink" style="width:13px;height:13px;border-radius:50%;
    background:var(--line);transition:background .05s"></div>
  <button onclick="toggleMetro()" id="floatMetro"
    style="background:var(--bg);border:1px solid var(--line);border-radius:6px;
    color:var(--dim);cursor:pointer;padding:4px 9px;font-size:11px">🔇</button>
  <div id="floatInd" style="font:11px var(--mono);color:var(--dim);min-width:120px">
    compasso — · tempo —</div>
</div>
</main>

<!-- MODAL LIMPAR -->
<div class="overlay" id="clearModal">
  <div class="modal">
    <h3>Limpar editor?</h3>
    <p>O texto atual será apagado. Esta ação pode ser desfeita com Ctrl+Z.</p>
    <div class="modal-btns">
      <button class="btn danger" onclick="confirmarLimpar()">Limpar</button>
      <button class="btn g" onclick="fecharModal()">Cancelar</button>
    </div>
  </div>
</div>

<script>
// ══════════════════════════════════════════════════════════
//  CORE UTILS
// ══════════════════════════════════════════════════════════
const $ = id => document.getElementById(id);
const esc = s => s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const now = () => new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});

function setStatus(txt,cls=''){
  $('pill').className='pill '+cls;
  $('pillTxt').textContent=txt;
}

// ══════════════════════════════════════════════════════════
//  TEMA CLARO/ESCURO (A — novo v2.0.1)
// ══════════════════════════════════════════════════════════
(function initTheme(){
  const saved = localStorage.getItem('cromus_theme')||'dark';
  document.documentElement.dataset.theme = saved;
  $('themeBtn').textContent = saved==='dark' ? '☀️ Claro' : '🌙 Escuro';
})();
function toggleTheme(){
  const t = document.documentElement.dataset.theme==='dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  localStorage.setItem('cromus_theme', t);
  $('themeBtn').textContent = t==='dark' ? '☀️ Claro' : '🌙 Escuro';
}

// ══════════════════════════════════════════════════════════
//  UNDO / REDO (A — novo v2.0.1)
// ══════════════════════════════════════════════════════════
const MAX_HIST = 50;
let _hist = [''], _histIdx = 0, _histLock = false;

function pushHistory(val){
  if(_histLock) return;
  if(val === _hist[_histIdx]) return;
  _hist = _hist.slice(0, _histIdx+1);
  _hist.push(val);
  if(_hist.length > MAX_HIST) _hist.shift();
  _histIdx = _hist.length-1;
}
function undoAction(){
  if(_histIdx <= 0) return;
  _histLock = true;
  _histIdx--;
  $('sintaxe').value = _hist[_histIdx];
  _histLock = false;
  atualizarInfo(); schedRender();
}
function redoAction(){
  if(_histIdx >= _hist.length-1) return;
  _histLock = true;
  _histIdx++;
  $('sintaxe').value = _hist[_histIdx];
  _histLock = false;
  atualizarInfo(); schedRender();
}

// ══════════════════════════════════════════════════════════
//  ABAS
// ══════════════════════════════════════════════════════════
function sw(id){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t.dataset.t===id));
  document.querySelectorAll('.pane').forEach(p=>p.classList.toggle('on',p.id==='p-'+id));
  if(id==='tab'){
    const ta=$('tabSintaxe');
    if(!ta.value.trim()) ta.value=$('sintaxe').value;
    if(ta.value.trim()) gerarTab();
  }
}

// ══════════════════════════════════════════════════════════
//  INFOBAR — contador de compassos e validador (C — novo)
// ══════════════════════════════════════════════════════════
const DUR_BEATS_MAP = {w:4,h:2,q:1,e:.5,s:.25,t:.125};

function atualizarInfo(){
  const val = $('sintaxe').value;
  const compassoStr = $('compasso').value.trim();

  // tokens totais
  const toks = val.split(/[\s,]+/).filter(t=>t && t!=='-' && t!=='|');
  $('infoTokens').textContent = `tokens: ${toks.length}`;

  // compassos
  const cparts = val.split(',');
  $('infoCompassos').textContent = `compassos: ${cparts.length}`;

  // validação de métrica
  const badge = $('infoMetrica');
  const [num, den] = compassoStr.split('/').map(Number);
  if(!num || !den){ badge.className='badge'; badge.textContent='compasso: ?'; return; }
  const beatsEsperados = (num/den)*4;

  // valida apenas o último compasso completo (em digitação)
  const ultimoToks = cparts[cparts.length-1].trim().split(/\s+/)
    .filter(t=>t && t!=='-' && t!=='|');
  let beatsAtuais = 0;
  for(const tok of ultimoToks){
    const m = tok.match(/^(\d)([#b])?(w|h|q|e|s|t)?(\.)?(~)?/);
    if(!m) continue;
    const durK = m[3]||'q', dot=!!m[4];
    beatsAtuais += DUR_BEATS_MAP[durK]*(dot?1.5:1);
  }
  if(Math.abs(beatsAtuais - beatsEsperados) < 0.01){
    badge.className='badge good'; badge.textContent=`✓ ${compassoStr}`;
  } else if(beatsAtuais > beatsEsperados){
    badge.className='badge warn'; badge.textContent=`⚠ +${(beatsAtuais-beatsEsperados).toFixed(2)} tempos`;
  } else {
    badge.className='badge'; badge.textContent=`${beatsAtuais.toFixed(2)}/${beatsEsperados} tempos`;
  }
  atualizarComp();
}

// ══════════════════════════════════════════════════════════
//  MEDIDAS — DETECÇÃO E MARCADORES DE COMPASSO
// ══════════════════════════════════════════════════════════
const COMP_MARKERS = {
  'repeat-start': { txt:'||:', side:'before' },
  'repeat-end':   { txt:':||', side:'after'  },
  'casa1':        { txt:'(CASA1)', side:'before' },
  'casa2':        { txt:'(CASA2)', side:'before' },
  'dc':           { txt:'D.C.',    side:'after'  },
  'ds':           { txt:'D.S.',    side:'after'  },
  'coda':         { txt:'𝄌',      side:'after'  },
  'segno':        { txt:'𝄋',      side:'after'  },
  'fine':         { txt:'FIM',     side:'after'  },
};

function getCompInfo(val, cursorPos) {
  // acha o compasso sob o cursor baseado nas barras |
  // retorna { idx (0-based), inicio, fim, total }
  const ant = val.slice(0, Math.min(cursorPos||0, val.length));
  const todos = val.match(/\|/g);
  const antes = (ant.match(/\|/g)||[]).length;
  // procura posicao da enesima barra
  let pos = 0, inicios = [], fins = [];
  for(let i=0; i<val.length; i++){
    if(val[i] === '|'){
      fins.push(i+1);  // fim do compasso anterior (depois da barra)
      if(i+1 < val.length) inicios.push(i+1);
    }
  }
  inicios.unshift(0);  // comp 1 comeca no inicio
  fins.push(val.length);
  const idx = Math.min(antes, inicios.length-1);
  return {
    idx,
    inicio: inicios[idx]||0,
    fim: fins[idx]||val.length,
    total: todos ? todos.length+1 : 1,
    conteudo: val.slice(inicios[idx]||0, fins[idx]||val.length)
  };
}

function atualizarComp(){
  const info = getCompInfo(ta.value, ta.selectionStart);
  const num = info.idx + 1;
  $('compNumLabel').textContent = `Comp. ${num}`;
  $('propCompNum').textContent = num;
  // atualiza estado dos botoes — escaneia conteudo do comp
  const c = info.conteudo;
  document.querySelectorAll('.cmrk').forEach(btn => {
    const k = btn.dataset.cmrk;
    const m = COMP_MARKERS[k];
    const on = m && c.includes(m.txt);
    btn.classList.toggle('on', on);
  });
  document.querySelectorAll('.pbtn').forEach(btn => {
    const k = btn.dataset.prop;
    const m = COMP_MARKERS[k];
    const on = m && c.includes(m.txt);
    btn.classList.toggle('on', on);
  });
}

function toggleCompMark(k){
  const m = COMP_MARKERS[k];
  if(!m) return;
  const info = getCompInfo(ta.value, ta.selectionStart);
  const val = ta.value;
  const c = info.conteudo;
  const jaTem = c.includes(m.txt);
  const selIni = ta.selectionStart, selFim = ta.selectionEnd;

  let novo;
  if(jaTem){
    // remove
    novo = val.slice(0, info.inicio) + c.replace(m.txt, '') + val.slice(info.fim);
  } else {
    // insere
    const ins = m.txt + (m.side==='after' ? ' ' : '');
    if(m.side === 'before'){
      const pos = info.inicio;
      novo = val.slice(0, pos) + ins + val.slice(pos);
    } else {
      const pos = info.fim;
      novo = val.slice(0, pos) + (m.side==='after'? ' ' + ins : ins) + val.slice(pos);
    }
  }
  ta.value = novo;
  pushHistory(novo);
  atualizarInfo();
  schedRender();
  // restaura cursor
  const desl = jaTem ? -m.txt.length : m.txt.length + (m.side==='after'?1:0);
  const novoPos = Math.max(0, Math.min(novo.length, selIni + (jaTem ? 0 : 0)));
  ta.selectionStart = ta.selectionEnd = novoPos;
  ta.focus();
  atualizarComp();
}

function toggleProp(k){ toggleCompMark(k); }

// ══════════════════════════════════════════════════════════
//  BUSCA INLINE (I — novo v2.0.1)
// ══════════════════════════════════════════════════════════
let _searchMatches=[], _searchIdx=0;
function toggleSearch(){
  const bar=$('searchBar');
  bar.classList.toggle('open');
  if(bar.classList.contains('open')) $('searchInput').focus();
  else $('sintaxe').focus();
}
function doSearch(){
  const q=$('searchInput').value;
  const ta=$('sintaxe'), val=ta.value;
  _searchMatches=[];
  if(!q){ $('searchCount').textContent='—'; return; }
  let i=0;
  while((i=val.indexOf(q,i))!==-1){ _searchMatches.push(i); i+=q.length; }
  $('searchCount').textContent=`${_searchMatches.length} ocorrências`;
  if(_searchMatches.length) searchMove(0);
}
function searchMove(dir){
  if(!_searchMatches.length) return;
  _searchIdx=(_searchIdx+dir+_searchMatches.length)%_searchMatches.length;
  const pos=_searchMatches[_searchIdx];
  const ta=$('sintaxe');
  ta.focus(); ta.setSelectionRange(pos, pos+$('searchInput').value.length);
}
function searchKey(e){
  if(e.key==='Enter'){ e.preventDefault(); searchMove(e.shiftKey?-1:1); }
  if(e.key==='Escape') toggleSearch();
}

// ══════════════════════════════════════════════════════════
//  MODAL LIMPAR (J — novo v2.0.1)
// ══════════════════════════════════════════════════════════
function pedirLimpar(){ $('clearModal').classList.add('open'); }
function fecharModal(){ $('clearModal').classList.remove('open'); }
function confirmarLimpar(){
  pushHistory($('sintaxe').value);
  $('sintaxe').value='';
  fecharModal(); atualizarInfo(); schedRender();
}

// ══════════════════════════════════════════════════════════
//  EXPORTAR .LY DIRETO (D — novo v2.0.1)
// ══════════════════════════════════════════════════════════
function exportLy(){
  const ly=$('lyCode').textContent;
  if(!ly || ly.startsWith('—')){ $('explog').textContent='Compile primeiro.'; return; }
  const blob=new Blob([ly],{type:'text/plain'});
  dlBlob(blob, ($('titulo').value||'cromus')+'.ly');
  $('explog').textContent='Arquivo .ly exportado ✓';
}

// ══════════════════════════════════════════════════════════
//  LOG HISTÓRICO (H — novo v2.0.1)
// ══════════════════════════════════════════════════════════
function pushLog(msg, ok){
  const list=$('logList');
  const div=document.createElement('div');
  div.className='log-entry';
  div.innerHTML=`<span class="log-ts">${now()}</span>`
    +`<span class="log-msg ${ok?'log-ok':'log-err'}">${esc(msg)}</span>`;
  list.prepend(div);
  // mantém só 100 entradas
  while(list.children.length>100) list.removeChild(list.lastChild);
}

// ══════════════════════════════════════════════════════════
//  PAINEL DE EDIÇÃO DE NOTAS
// ══════════════════════════════════════════════════════════
let _n=null, _d='q', _a='', _dot=false, _tie=false, _slur=false,
    _oct8va=false, _oct8vb=false;

function togglePanel(){
  const aberto = $('spanel').classList.toggle('open');
  $('btnPanel').classList.toggle('on');
  const rz = $('resizer');
  if(rz) rz.classList.toggle('open', aberto);
}

// Drag do resizer para redimensionar o painel de notas
(function(){
  let arrastando = false;
  document.addEventListener('mousedown', e=>{
    if(e.target.id === 'resizer'){
      arrastando = true;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    }
  });
  document.addEventListener('mousemove', e=>{
    if(!arrastando) return;
    const sec = $('editorSection');
    const sp = $('spanel');
    if(!sec || !sp) return;
    const rect = sec.getBoundingClientRect();
    let larg = e.clientX - rect.left;
    larg = Math.max(200, Math.min(520, larg));
    sp.style.width = larg + 'px';
  });
  document.addEventListener('mouseup', ()=>{
    if(arrastando){
      arrastando = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
})();
function setNota(n){
  _n=n;
  document.querySelectorAll('.nbtn').forEach(b=>b.classList.toggle('sel',+b.dataset.n===n));
  document.querySelectorAll('[data-n="0"]').forEach(b=>b.classList.toggle('sel',n===0));
  updTok();
}
function setDur(d){
  _d=d;
  document.querySelectorAll('.dbtn').forEach(b=>b.classList.toggle('sel',b.dataset.d===d));
  updTok();
}
function setAcc(a){
  _a=(_a===a)?'':a;
  document.querySelectorAll('.abtn').forEach(b=>b.classList.toggle('sel',b.dataset.a===_a));
  updTok();
}
function toggleMod(m){
  if(m==='dot'){   _dot  =!_dot;   $('togDot').classList.toggle('sel',_dot); }
  if(m==='tie'){   _tie  =!_tie;   $('togTie').classList.toggle('sel',_tie); }
  if(m==='slur'){  _slur =!_slur;  $('togSlur').classList.toggle('sel',_slur); }
  if(m==='oct8va'){_oct8va=!_oct8va;$('togOct8va').classList.toggle('sel',_oct8va);
    if(_oct8va){_oct8vb=false;$('togOct8vb').classList.remove('sel');}}
  if(m==='oct8vb'){_oct8vb=!_oct8vb;$('togOct8vb').classList.toggle('sel',_oct8vb);
    if(_oct8vb){_oct8va=false;$('togOct8va').classList.remove('sel');}}
  updTok();
}

// mapa de formas RNFG para o preview SVG (E — novo v2.0.1)
const SHAPES = {
  1: (c)=>`<circle cx="16" cy="16" r="11" fill="${c}"/>`,
  2: (c)=>`<ellipse cx="16" cy="16" rx="8" ry="11" fill="${c}"/>`,
  3: (c)=>`<polygon points="16,5 27,27 5,27" fill="${c}"/>`,
  4: (c)=>`<rect x="5" y="5" width="22" height="22" fill="${c}"/>`,
  5: (c)=>`<ellipse cx="16" cy="16" rx="11" ry="11" fill="${c}"/>`,
  6: (c)=>`<polygon points="16,5 25,10 25,22 16,27 7,22 7,10" fill="${c}"/>`,
  7: (c)=>`<polygon points="16,5 26,12 26,27 6,27 6,12" fill="${c}"/>`,
  0: ()=>`<text x="16" y="21" text-anchor="middle" font-size="18" fill="#666">𝄽</text>`,
};
const COLORS = {1:'#C0001A',2:'#ECD200',3:'#F07300',4:'#00B050',5:'#0066FF',6:'#8B5E00',7:'#9B5FC0'};

function buildTok(){
  if(_n===null) return null;
  let t=(_n===0)?'0'+_d+(_dot?'.':''):String(_n)+_a+_d+(_dot?'.':'')+(_tie?'~':'');
  if(_oct8va) t=`\\8va{${t}}`;
  if(_oct8vb) t=`\\8vb{${t}}`;
  return t;
}
function updTok(){
  const tok=buildTok();
  $('tokStr').innerHTML = tok ? tok : '<span class="ph">nota + duração</span>';
  const svg=$('tokSvg');
  if(_n!==null && SHAPES[_n]){
    svg.innerHTML=SHAPES[_n](COLORS[_n]||'#888');
  } else {
    svg.innerHTML='';
  }
}

function insertToken(){
  const tok=buildTok(); if(!tok) return;
  pushHistory($('sintaxe').value);
  const ta=$('sintaxe'), pos=ta.selectionStart, v=ta.value;
  const pre=v.slice(0,pos), suf=v.slice(pos);
  const sep=(pre.length && !/[ ,\n]$/.test(pre))?' ':'';
  const ins=_slur?`( ${tok} )`:tok;
  ta.value=pre+sep+ins+' '+suf;
  ta.selectionStart=ta.selectionEnd=pos+sep.length+ins.length+1;
  ta.focus(); atualizarInfo(); schedRender();
}
function insertBar(){
  pushHistory($('sintaxe').value);
  const ta=$('sintaxe'), pos=ta.selectionStart, v=ta.value;
  const pre=v.slice(0,pos).trimEnd();
  ta.value=pre+',\n'+v.slice(pos);
  ta.selectionStart=ta.selectionEnd=pre.length+2;
  ta.focus();
}

// ══════════════════════════════════════════════════════════
//  ATALHOS DE TECLADO (B — novo v2.0.1)  à la Sibelius
// ══════════════════════════════════════════════════════════
document.addEventListener('keydown', e=>{
  // Ctrl/Cmd+Z → Undo
  if((e.metaKey||e.ctrlKey) && e.key==='z' && !e.shiftKey){
    e.preventDefault(); undoAction(); return;
  }
  // Ctrl/Cmd+Y ou Ctrl+Shift+Z → Redo
  if((e.metaKey||e.ctrlKey) && (e.key==='y' || (e.key==='z' && e.shiftKey))){
    e.preventDefault(); redoAction(); return;
  }
  // Ctrl+Enter → Render
  if((e.metaKey||e.ctrlKey) && e.key==='Enter'){ e.preventDefault(); render(); return; }
  // Ctrl+F → Busca
  if((e.metaKey||e.ctrlKey) && e.key==='f'){ e.preventDefault(); toggleSearch(); return; }
  // F2 → painel de notas
  if(e.key==='F2'){ e.preventDefault(); togglePanel(); return; }
  // Espaço (fora de input) → play/pause
  if(e.key===' ' && document.activeElement.tagName!=='INPUT' &&
     document.activeElement.tagName!=='TEXTAREA'){
    e.preventDefault(); audioPlay(); return;
  }

  // atalhos só quando o painel está aberto
  if(!$('spanel').classList.contains('open')) return;
  // e não estamos num input
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;

  const k=e.key.toLowerCase();
  // notas 1-7
  if(/^[1-7]$/.test(k)){ e.preventDefault(); setNota(+k); return; }
  // s = silêncio
  if(k==='s'){ e.preventDefault(); setNota(0); return; }
  // durações: r=semibreve w=mínima q=semínima e=colcheia t=semicolcheia
  const durMap={r:'w',w:'h',q:'q',e:'e',t:'s'};
  if(durMap[k]){ e.preventDefault(); setDur(durMap[k]); return; }
  // acidentes
  if(k==='b'){ e.preventDefault(); setAcc('b'); return; }
  if(k==='n'){ e.preventDefault(); setAcc(''); return; }
  if(k==='#'||e.key==='#'){ e.preventDefault(); setAcc('#'); return; }
  // modificadores
  if(k==='.'){ e.preventDefault(); toggleMod('dot'); return; }
  if(k==='~'||e.key==='~'||e.key==='Dead'){ e.preventDefault(); toggleMod('tie'); return; }
  if(k==='('){ e.preventDefault(); toggleMod('slur'); return; }
  // inserir com Enter (quando painel aberto e fora de textarea)
  if(e.key==='Enter'){ e.preventDefault(); insertToken(); return; }
  // , = barra de compasso
  if(k===','){ e.preventDefault(); insertBar(); return; }
});

// ══════════════════════════════════════════════════════════
//  RENDER
// ══════════════════════════════════════════════════════════
let _timer=null, _busy=false, _pend=false;

function schedRender(){ clearTimeout(_timer); _timer=setTimeout(render,900); }

const ta=$('sintaxe');
ta.addEventListener('input',()=>{
  pushHistory(ta.value); atualizarInfo(); schedRender();
});
ta.addEventListener('click', atualizarComp);
ta.addEventListener('keyup', atualizarComp);
$('titulo').addEventListener('input',schedRender);
$('compasso').addEventListener('input',schedRender);
$('modo').addEventListener('change',render);
$('btnRun').addEventListener('click',render);
$('btnPdf').addEventListener('click',()=>window.open('/pdf','_blank'));

async function render(){
  const s=ta.value.trim(); if(!s) return;
  if(_busy){_pend=true;return;}
  _busy=true; setStatus('compilando…','');
  try{
    const r=await fetch('/render',{method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({sintaxe:s,modo:$('modo').value,
        titulo:$('titulo').value,compasso:$('compasso').value})});
    const d=await r.json();
    const pane=$('p-score');
    if(d.ok){
      pane.innerHTML=d.pages.map((p,i)=>`<div class="page" data-pg="${i}"><img src="data:image/png;base64,${p}"></div>`).join('');
      $('lyCode').textContent=d.ly||'—';
      setStatus('ok','ok');
      pushLog(`Compilado com sucesso — ${d.pages.length} pág.`, true);
      parseSintaxeAudio(s);
      // Prepara canvas overlay com posições das notas
      _notePositions=[];
      if(d.positions){
        let flat=[], idx=0;
        d.positions.forEach((pg, pgi)=>{
          const vbW=pg.w, vbH=pg.h;
          const pngW=Math.round(210/25.4*170), pngH=Math.round(297/25.4*170);
          const sx=pngW/vbW, sy=pngH/vbH;
          const pageDiv=pane.querySelector(`[data-pg="${pgi}"]`);
          if(!pageDiv) return;
          let cv=pageDiv.querySelector('.note-canvas');
          if(!cv){
            cv=document.createElement('canvas');
            cv.className='note-canvas';
            cv.width=pngW; cv.height=pngH;
            cv.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
            pageDiv.style.position='relative';
            pageDiv.appendChild(cv);
          }
          pg.notas.forEach(n=>{
            flat.push({page:pgi, x:n.x*sx, y:n.y*sy});
          });
        });
        _notePositions=flat;
      }
    }else{
      pane.innerHTML=`<pre class="logbox">${esc(d.log||d.erro||'erro desconhecido')}</pre>`;
      setStatus('erro','err');
      pushLog(d.log||d.erro||'erro desconhecido', false);
    }
  }catch(err){ setStatus('falha','err'); pushLog(err.message,false); }
  _busy=false;
  if(_pend){_pend=false;render();}
}

// drag-and-drop de arquivo direto no editor (G — novo v2.0.1)
function handleDropOnEditor(e){
  e.preventDefault();
  const file=e.dataTransfer.files[0];
  if(file){ sw('import'); handleFile(file); }
}

// ══════════════════════════════════════════════════════════
//  MOTOR DE ÁUDIO — Tone.js
// ══════════════════════════════════════════════════════════
const GRAU_NOTE={1:'C4',2:'D4',3:'E4',4:'F4',5:'G4',6:'A4',7:'B4'};
const DUR_TONE={w:'1n',h:'2n',q:'4n',e:'8n',s:'16n',t:'32n'};

let _events=[], _totalTime=0, _synth=null, _playing=false;
let _tempos=[];        // {time, compasso, tempoNoCompasso, charIni, charFim}
let _metroOn=false, _metroSynth=null, _cursorRAF=null;
let _notePositions=[]; // [{page, x, y}] — espelha _events[], posições no canvas
let _sampler=null, _samplerName='';

const _SF_MAP = {
  piano:'acoustic_grand_piano', violao:'acoustic_guitar_nylon',
  flauta:'flute', ukulele:'acoustic_guitar_steel',
  lira:'orchestral_harp', salterio:'harpsichord', orgao:'church_organ',
};
let _currentNoteIdx=0;

function preprocessSintaxe(s){
  s = s.replace(/`/g, "'");
  s = s.replace(/\(\s*CASA\s*\d+\s*\)/g, '');
  for(const junk of ['||:', ':||', '||', 'FIM', 'D.C.', 'D.S.', '𝄌', '𝄋', 'CASA1', 'CASA2', '[1', '[2']){
    s = s.replaceAll(junk, '');
  }
  s = s.replace(/\|/g, ',');
  s = s.replace(/,+/g, ',');
  s = s.replace(/^[,\s]+|[,\s]+$/g, '');
  return s;
}

function parseSintaxeAudio(sintaxe){
  sintaxe = preprocessSintaxe(sintaxe);
  _events = [];
  const bpm = parseFloat($('bpmVal').value) || 80;
  const beat = 60 / bpm;
  const GRAU_OCT = {1:0,2:2,3:4,4:5,5:7,6:9,7:11};
  const BASE_MIDI = 60;

  function notaParaMidi(base){
    let oitava = 0;
    while(base.startsWith("'")){ oitava--; base = base.slice(1); }
    while(base.endsWith("'")){ oitava++; base = base.slice(0,-1); }
    if(base === '-' || base === '0') return null;
    const m = base.match(/^([0-7])([#b]?)$/);
    if(!m) return null;
    const grau = +m[1], acc = m[2];
    if(grau === 0) return null;
    let midi = BASE_MIDI + GRAU_OCT[grau] + (oitava*12);
    if(acc === '#') midi += 1;
    if(acc === 'b') midi -= 1;
    return midi;
  }

  function midiParaNota(midi){
    return Tone.Frequency(midi, "midi").toNote();
  }

  let time = 0;
  _tempos = [];
  const numCompasso = parseInt(($('compasso').value||'4/4').split('/')[0]) || 4;
  const grupos = sintaxe.split(',');
  let idxTempo = 0, charPos = 0;
  for(let gi=0; gi<grupos.length; gi++){
    let grupoRaw = grupos[gi];
    const charIni = charPos;
    charPos += grupoRaw.length + 1;
    let grupo = grupoRaw.trim();
    if(!grupo) continue;
    _tempos.push({
      time,
      compasso: Math.floor(idxTempo / numCompasso) + 1,
      tempoNoCompasso: (idxTempo % numCompasso) + 1,
      charIni,
      charFim: charIni + grupoRaw.length
    });
    idxTempo++;

    // Tuplet explicito (a b c) ou ((a b c))
    let mtuplet = grupo.match(/^\(+(.+?)\)+$/);
    let notas;
    let totalParcelas;
    if(mtuplet){
      const itens = mtuplet[1].split(/\s+/).filter(Boolean);
      notas = itens.map(t => ({base:t.replace(/\*+$/,''), parc:1}));
      totalParcelas = notas.length;
    } else {
      // Tokenizador unificado: mescla a logica com/sem asteriscos
      const tokens = grupo.replace(/\s+/g,'').match(/[0-7]'*\*+|-\*+|[0-7]'*|-/g) || [];
      if(!tokens.length) continue;
      notas = tokens.map(tok => {
        const base = tok.replace(/\*+$/, '');
        const ast = tok.length - base.length;
        return { base, parc: 1 + ast };
      });
      totalParcelas = notas.reduce((a,n) => a + n.parc, 0);
    }
    if(totalParcelas === 0) totalParcelas = 1;

    const durParcela = beat / totalParcelas;
    for(const n of notas){
      const midi = notaParaMidi(n.base);
      const durSeg = durParcela * n.parc;
      if(midi !== null){
        _events.push({ note: midiParaNota(midi), dur: durSeg, time });
      }
      time += durSeg;
    }
  }
  _totalTime = time;
}

function buildSynthFallback(){
  if(_synth){try{_synth.dispose();}catch(e){}_synth=null;}
  const t=$('instSel').value;
  const O={
    piano:[Tone.PolySynth,Tone.AMSynth,{harmonicity:2,oscillator:{type:'triangle'},envelope:{attack:.005,decay:.3,sustain:.2,release:.8}}],
    orgao:[Tone.PolySynth,Tone.FMSynth,{harmonicity:3,envelope:{attack:.01,decay:.1,sustain:.4,release:1}}],
    synth:[Tone.PolySynth,Tone.Synth,{oscillator:{type:'sawtooth'},envelope:{attack:.01,decay:.1,sustain:.5,release:.4}}],
    violao:[Tone.PolySynth,Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:.003,decay:.3,sustain:0,release:1.0}}],
    flauta:[Tone.PolySynth,Tone.Synth,{oscillator:{type:'sine'},envelope:{attack:.1,decay:.1,sustain:.8,release:.3}}],
    ukulele:[Tone.PolySynth,Tone.FMSynth,{harmonicity:1.5,modulationIndex:2,oscillator:{type:'triangle'},envelope:{attack:.001,decay:.2,sustain:0,release:.6}}],
    lira:[Tone.PolySynth,Tone.FMSynth,{harmonicity:2.5,modulationIndex:1,oscillator:{type:'sine'},envelope:{attack:.003,decay:.3,sustain:0,release:1.2}}],
    salterio:[Tone.PolySynth,Tone.FMSynth,{harmonicity:4,modulationIndex:3,oscillator:{type:'sine'},envelope:{attack:.001,decay:.4,sustain:0,release:.8}}],
  }[t]||[Tone.PolySynth,Tone.AMSynth,{}];
  _synth=new O[0](O[1],O[2]).toDestination();
}

async function loadSampler(name){
  const sfName=_SF_MAP[name];
  if(!sfName){_sampler=null; _samplerName=''; buildSynthFallback(); return;}
  if(_sampler && _samplerName===name) return;
  _sampler=null; _samplerName='';
  if(_synth){try{_synth.dispose();}catch(e){}_synth=null;}
  try{
    await Tone.start();
    const ctx=Tone.context.rawContext;
    _sampler=await SoundFont.instrument(ctx, sfName);
    _samplerName=name;
  }catch(e){
    console.warn('SoundFont falhou, usando síntese:', e);
    buildSynthFallback();
  }
}

// Carrega piano ao iniciar
setTimeout(()=>loadSampler('piano'), 1000);

const _NOTE_GRAU={C:1,D:2,E:3,F:4,G:5,A:6,B:7};
function highlightNote(noteName, on){
  const grau=_NOTE_GRAU[noteName[0]];
  if(!grau) return;
  const btn=document.querySelector(`.nbtn[data-n="${grau}"]`);
  if(btn) btn.classList.toggle('playing', on);
}
function clearNoteHighlights(){
  document.querySelectorAll('.nbtn.playing').forEach(b=>b.classList.remove('playing'));
}

function drawNoteGlow(idx){
  if(idx<0||idx>=_notePositions.length) return;
  const pos=_notePositions[idx];
  const pageDiv=document.querySelector(`.page[data-pg="${pos.page}"]`);
  if(!pageDiv) return;
  const cv=pageDiv.querySelector('.note-canvas');
  if(!cv) return;
  const ctx=cv.getContext('2d');
  // Glow dourado: gradiente radial
  const g=ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 40);
  g.addColorStop(0, 'rgba(255,215,0,1)');
  g.addColorStop(0.25, 'rgba(255,215,0,0.7)');
  g.addColorStop(0.5, 'rgba(255,215,0,0.2)');
  g.addColorStop(1, 'rgba(255,215,0,0)');
  ctx.fillStyle=g;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 40, 0, Math.PI*2);
  ctx.fill();
  // Anel externo
  ctx.strokeStyle='rgba(255,215,0,1)';
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 12, 0, Math.PI*2);
  ctx.stroke();
}
function clearNoteGlow(){
  document.querySelectorAll('.note-canvas').forEach(cv=>{
    cv.getContext('2d').clearRect(0,0,cv.width,cv.height);
  });
}

async function audioPlay(){
  await Tone.start();
  if(_playing){
    Tone.Transport.pause();_playing=false;
    $('playBtn').textContent='▶';$('alog').textContent='Pausado.';return;
  }
  const s=ta.value.trim(); if(s) parseSintaxeAudio(s);
  if(!_events.length){$('alog').textContent='Sem notas. Compile primeiro.';return;}
  await loadSampler($('instSel').value);
  Tone.Transport.stop();Tone.Transport.cancel();
  Tone.Transport.bpm.value=parseFloat($('bpmVal').value)||80;
  _events.forEach(ev=>{
    if(ev.note){
      Tone.Transport.schedule(t=>{
        if(_sampler) _sampler.play(ev.note, t, {duration:ev.dur, gain:0.6});
        else if(_synth) _synth.triggerAttackRelease(ev.note, ev.dur, t);
      }, ev.time);
      Tone.Transport.schedule(t=>highlightNote(ev.note,true),ev.time);
      Tone.Transport.schedule(t=>highlightNote(ev.note,false),ev.time+ev.dur);
    }
  });
  Tone.Transport.schedule(()=>{
    _playing=false;$('playBtn').textContent='▶';
    clearNoteHighlights();
    clearNoteGlow();
    $('alog').textContent='Reprodução concluída.';
    $('progFill').style.width='100%';
    setTimeout(()=>$('progFill').style.width='0%',800);
  },_totalTime+.1);
  // metrônomo: agenda um clique no início de cada tempo
  if(_metroOn){
    if(!_metroSynth) _metroSynth = new Tone.MembraneSynth({
      pitchDecay:.008, octaves:2,
      envelope:{attack:.001,decay:.12,sustain:0,release:.1}
    }).toDestination();
    _tempos.forEach(tp=>{
      Tone.Transport.schedule(t=>{
        const forte = (tp.tempoNoCompasso === 1);
        _metroSynth.triggerAttackRelease(forte?'C3':'G2', '16n', t);
      }, tp.time);
    });
  }
  // cursor visual + indicador + texto destacado + glow nota-a-nota
  _currentNoteIdx=0;
  let lastNoteIdx=-1;
  const pi=setInterval(()=>{
    if(!_playing){clearInterval(pi);return;}
    const seg = Tone.Transport.seconds;
    $('progFill').style.width=Math.min(100,(seg/_totalTime)*100)+'%';
    // acha o tempo atual
    let atual = null;
    for(let i=_tempos.length-1;i>=0;i--){
      if(seg >= _tempos[i].time - .02){ atual = _tempos[i]; break; }
    }
    if(atual){
      const txt = `compasso ${atual.compasso} · tempo ${atual.tempoNoCompasso}`;
      $('compassoInd').textContent = txt;
      const fi=$('floatInd'); if(fi) fi.textContent = txt;
      // blink no tempo
      const dentro = seg - atual.time;
      const cor = dentro < .12 ? (atual.tempoNoCompasso===1 ? 'var(--ok)' : '#f0a050')
                               : 'var(--line)';
      $('metroBlink').style.background = cor;
      const fb=$('floatBlink'); if(fb) fb.style.background = cor;
      // destaca trecho de texto
      try{
        ta.focus();
        ta.setSelectionRange(atual.charIni, atual.charFim);
      }catch(e){}
    }
    // Avança índice da nota atual (highlight segue o som, não antecipa)
    while(_currentNoteIdx<_events.length-1 && seg>=_events[_currentNoteIdx].time+_events[_currentNoteIdx].dur-_events[_currentNoteIdx].dur*.1){
      _currentNoteIdx++;
    }
    if(_currentNoteIdx!==lastNoteIdx){
      clearNoteGlow();
      drawNoteGlow(_currentNoteIdx);
      lastNoteIdx=_currentNoteIdx;
    }
  },50);
  Tone.Transport.start();
  _playing=true;$('playBtn').textContent='⏸';{const fp=$('floatPlay');if(fp)fp.textContent='⏸';}
  $('alog').textContent=`Tocando ${_events.length} notas — ${Math.round(_totalTime)}s`;
}
function audioStop(){
  Tone.Transport.stop();Tone.Transport.cancel();
  _playing=false;$('playBtn').textContent='▶';
  clearNoteHighlights();
  clearNoteGlow();
  $('progFill').style.width='0%';$('alog').textContent='Parado.';
  const mb=$('metroBlink'); if(mb) mb.style.background='var(--line)';
  const ci=$('compassoInd'); if(ci) ci.textContent='compasso — · tempo —';
  const fb=$('floatBlink'); if(fb) fb.style.background='var(--line)';
  const fi=$('floatInd'); if(fi) fi.textContent='compasso — · tempo —';
  const fp=$('floatPlay'); if(fp) fp.textContent='▶';
}

function toggleMetro(){
  _metroOn = !_metroOn;
  const b = $('metroBtn');
  const fm = $('floatMetro');
  if(_metroOn){
    if(b){ b.textContent='🔊 Metrônomo'; b.style.color='var(--ok)'; b.style.borderColor='var(--ok)'; }
    if(fm){ fm.textContent='🔊'; fm.style.color='var(--ok)'; fm.style.borderColor='var(--ok)'; }
  } else {
    if(b){ b.textContent='🔇 Metrônomo'; b.style.color='var(--dim)'; b.style.borderColor='var(--line)'; }
    if(fm){ fm.textContent='🔇'; fm.style.color='var(--dim)'; fm.style.borderColor='var(--line)'; }
  }
}

// ══════════════════════════════════════════════════════════
//  EXPORTAÇÃO MIDI
// ══════════════════════════════════════════════════════════
function beatsToMidiStr(beats){
  if(beats < 0.001) return '0';
  const STDS = [4,'1',2,'2',1,'4',0.5,'8',0.25,'16',0.125,'32'];
  for(let i=0;i<STDS.length;i+=2){
    if(Math.abs(beats-STDS[i]) < 0.01) return STDS[i+1];
  }
  for(let i=0;i<STDS.length;i+=2){
    if(Math.abs(beats-STDS[i]*1.5) < 0.01) return [STDS[i+1],STDS[i+1]==='32'?'64':STDS[i-1]||'8'];
  }
  let best='4',bd=99;
  for(let i=0;i<STDS.length;i+=2){const d=Math.abs(beats-STDS[i]);if(d<bd){bd=d;best=STDS[i+1];}}
  return best;
}

function exportMidi(){
  const s=ta.value.trim();
  if(!s){$('explog').textContent='Sem sintaxe.';return;}
  try{
    parseSintaxeAudio(s);
    if(!_events.length){$('explog').textContent='Sem notas.';return;}
    const W=window.MidiWriter;
    const bpm=parseFloat($('bpmVal').value)||80;
    const track=new W.Track();
    track.setTempo(bpm);
    let prevTime=0;
    for(const ev of _events){
      const waitBeats=(ev.time-prevTime)*bpm/60;
      const durBeats=ev.dur*bpm/60;
      const ws=beatsToMidiStr(waitBeats);
      track.addEvent(new W.NoteEvent({
        pitch:[ev.note||'C4'],
        duration:beatsToMidiStr(durBeats),
        wait:ws,
        velocity:ev.note?80:0
      }));
      prevTime=ev.time;
    }
    dlBlob(new Blob([new Uint8Array(new W.Writer([track]).buildFile())],{type:'audio/midi'}),
           ($('titulo').value||'cromus')+'.mid');
    $('explog').textContent='MIDI exportado ✓';
    pushLog('MIDI exportado',true);
  }catch(err){$('explog').textContent='Erro MIDI: '+err.message;pushLog(err.message,false);}
}

// ══════════════════════════════════════════════════════════
//  EXPORTAÇÃO WAV
// ══════════════════════════════════════════════════════════
async function exportWav(){
  const s=ta.value.trim();
  if(!s){$('explog').textContent='Sem sintaxe.';return;}
  parseSintaxeAudio(s);
  if(!_events.length){$('explog').textContent='Sem notas.';return;}
  $('explog').textContent='Renderizando WAV…';
  try{
    const buf=await Tone.Offline(async()=>{
      const sy=new Tone.PolySynth(Tone.AMSynth).toDestination();
      _events.forEach(ev=>{
        if(ev.note) Tone.Transport.schedule(t=>sy.triggerAttackRelease(ev.note,ev.dur,t),ev.time);
      });
      Tone.Transport.start();
    },_totalTime+2);
    dlBlob(new Blob([abToWav(buf.get())],{type:'audio/wav'}),
           ($('titulo').value||'cromus')+'.wav');
    $('explog').textContent='WAV exportado ✓';
    pushLog('WAV exportado',true);
  }catch(err){$('explog').textContent='Erro WAV: '+err.message;pushLog(err.message,false);}
}

function abToWav(ab){
  const nc=ab.numberOfChannels,sr=ab.sampleRate,len=ab.length;
  const dv=new DataView(new ArrayBuffer(44+len*nc*2));
  const ws=(off,s)=>{for(let i=0;i<s.length;i++)dv.setUint8(off+i,s.charCodeAt(i));};
  ws(0,'RIFF');dv.setUint32(4,36+len*nc*2,true);
  ws(8,'WAVE');ws(12,'fmt ');dv.setUint32(16,16,true);
  dv.setUint16(20,1,true);dv.setUint16(22,nc,true);
  dv.setUint32(24,sr,true);dv.setUint32(28,sr*nc*2,true);
  dv.setUint16(32,nc*2,true);dv.setUint16(34,16,true);
  ws(36,'data');dv.setUint32(40,len*nc*2,true);
  let o=44;
  for(let i=0;i<len;i++)for(let c=0;c<nc;c++){
    const v=Math.max(-1,Math.min(1,ab.getChannelData(c)[i]));
    dv.setInt16(o,v<0?v*0x8000:v*0x7FFF,true);o+=2;
  }
  return dv.buffer;
}

function dlBlob(blob,name){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),10000);
}

// ══════════════════════════════════════════════════════════
//  IMPORTAÇÃO PDF / MusicXML
// ══════════════════════════════════════════════════════════
let _imported='';

const dz=$('dropZone');
dz.addEventListener('dragover',e=>{e.preventDefault();dz.style.borderColor='#4a5264'});
dz.addEventListener('dragleave',()=>{dz.style.borderColor='var(--line)'});
dz.addEventListener('drop',e=>{
  e.preventDefault();dz.style.borderColor='var(--line)';
  if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

async function handleFile(file){
  if(!file) return;
  _imported='';
  $('impResult').style.display='none';
  $('impActs').style.display='none';
  setStatus('importando…','');
  const ext=file.name.split('.').pop().toLowerCase();

  if(['xml','mxl','musicxml'].includes(ext)){
    try{
      const r=await fetch('/parse_xml',{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({xml:await file.text()})});
      const d=await r.json();
      $('impResult').style.display='block';
      if(d.ok&&d.sintaxe){
        _imported=d.sintaxe;
        $('impResult').textContent=d.sintaxe;
        $('impActs').style.display='block';
        setStatus('MusicXML importado','ok');
        pushLog(`MusicXML: ${file.name} importado`,true);
      }else{
        $('impResult').textContent=d.erro||'Sem notas encontradas.';
        setStatus('erro na importação','err');
        pushLog(d.erro||'Sem notas',false);
      }
    }catch(e){setStatus('falha','err');}

  }else if(ext==='pdf'){
    try{
      const ab=await file.arrayBuffer();
      const b64=btoa(String.fromCharCode(...new Uint8Array(ab)));
      const r=await fetch('/parse_pdf',{method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({pdf_b64:b64,name:file.name})});
      const d=await r.json();
      $('impResult').style.display='block';
      if(d.ok){
        $('impResult').textContent=d.texto||'(sem texto)';
        if(d.sintaxe){_imported=d.sintaxe;$('impActs').style.display='block';}
        setStatus('PDF lido','ok');
        pushLog(`PDF: ${file.name} lido`,true);
      }else{
        $('impResult').textContent=d.erro||'Não foi possível ler.';
        setStatus('erro PDF','err');
        pushLog(d.erro||'Erro PDF',false);
      }
    }catch(e){setStatus('falha','err');}
  }else{
    $('impResult').style.display='block';
    $('impResult').textContent='Formato não suportado. Use .xml, .mxl ou .pdf.';
    setStatus('formato inválido','err');
  }
}

function useImported(){
  if(!_imported) return;
  pushHistory($('sintaxe').value);
  $('sintaxe').value=_imported;
  sw('score'); atualizarInfo(); render();
}

// ══════════════════════════════════════════════════════════
//  REAL TABLATURA
// ══════════════════════════════════════════════════════════
const GRAU_NOME_ROM = {1:'I',2:'II',3:'III',4:'IV',5:'V',6:'VI',7:'VII'};
const CORES_RNFG = {1:'#C0001A',2:'#ECD200',3:'#F07300',4:'#00B050',5:'#0066FF',6:'#8B5E00',7:'#9B5FC0'};
const GRAU_FORMA = {1:'circulo',2:'ogiva',3:'triangulo',4:'quadrado',5:'estrela',6:'hexagono',7:'casinha'};
const GRAU_FORMA_NOME = {1:'círculo',2:'ogiva',3:'triângulo',4:'quadrado',5:'estrela',6:'hexágono',7:'casinha'};
const FORMA_SVG = {
  circulo:  (x,y,r,c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity=".85"/>`,
  ogiva:    (x,y,r,c) => `<path d="M${x} ${y-r} Q${x+r} ${y} ${x} ${y+r} Q${x-r} ${y} ${x} ${y-r}z" fill="${c}" opacity=".85"/>`,
  triangulo:(x,y,r,c) => `<polygon points="${x},${y-r} ${x+r*0.866},${y+r*0.5} ${x-r*0.866},${y+r*0.5}" fill="${c}" opacity=".85"/>`,
  quadrado: (x,y,r,c) => `<rect x="${x-r*0.7}" y="${y-r*0.7}" width="${r*1.4}" height="${r*1.4}" fill="${c}" opacity=".85"/>`,
  estrela:  (x,y,r,c) => { const p=[]; for(let i=0;i<5;i++){const a=-Math.PI/2+i*2*Math.PI/5,b=a+Math.PI/5;p.push(`${x+r*0.9*Math.cos(a)},${y+r*0.9*Math.sin(a)} ${x+r*0.4*Math.cos(b)},${y+r*0.4*Math.sin(b)}`)} return `<polygon points="${p.join(' ')}" fill="${c}" opacity=".85"/>`; },
  hexagono: (x,y,r,c) => { const p=[]; for(let i=0;i<6;i++){const a=Math.PI/6+i*Math.PI/3;p.push(`${x+r*Math.cos(a)},${y+r*Math.sin(a)}`)} return `<polygon points="${p.join(' ')}" fill="${c}" opacity=".85"/>`; },
  casinha:  (x,y,r,c) => `<path d="M${x-r*0.7} ${y+r*0.5} L${x-r*0.7} ${y-r*0.15} L${x} ${y-r*0.85} L${x+r*0.7} ${y-r*0.15} L${x+r*0.7} ${y+r*0.5} Z" fill="${c}" opacity=".85"/>`,
};

function syncTabSintaxe(){
  $('tabSintaxe').value=$('sintaxe').value;
  gerarTab();
}

let _tabDebounce = null;
function tabAutoParse(){
  clearTimeout(_tabDebounce);
  _tabDebounce = setTimeout(()=>gerarTab(), 600);
}

async function gerarTab(){
  const sintaxe = $('tabSintaxe').value.trim();
  if(!sintaxe){ $('tabOutput').innerHTML='<div style="color:var(--err)">Digite uma sintaxe primeiro.</div>'; return; }
  const tonalidade = $('tabTonalidade').value;
  $('tabOutput').innerHTML='<div style="color:var(--dim)">Gerando…</div>';
  try{
    const r = await fetch('/tab_info',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({sintaxe,tonalidade})});
    const d = await r.json();
    if(!d.ok){ $('tabOutput').innerHTML='<div style="color:var(--err)">'+esc(d.erro||'erro')+'</div>'; return; }
    renderFretboard(d.notas, tonalidade);
  }catch(e){ $('tabOutput').innerHTML='<div style="color:var(--err)">Erro: '+esc(e.message)+'</div>'; }
}

function renderFretboard(notas, tonalidade){
  const W=620, H=310, marg=44, strings=6, stepY=18;
  const svg = [];
  svg.push(`<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:680px;background:var(--bg);border-radius:8px;display:block">`);
  svg.push(`<defs><filter id="gshadow"><feDropShadow dx="0" dy="0.5" stdDeviation="1" flood-opacity=".5"/></filter></defs>`);
  svg.push(`<rect width="${W}" height="${H}" fill="var(--bg)" rx="6"/>`);
  // título da tonalidade
  svg.push(`<text x="${marg}" y="18" font-size="12" font-weight="700" fill="var(--ink)">Real Tablatura — ${tonalidade}</text>`);
  // braço
  const y0 = 38;
  const stepX = (W-marg*2)/(strings-1);
  for(let s=0; s<strings; s++){
    const x = marg + s*stepX;
    svg.push(`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0+12*stepY}" stroke="var(--line)" stroke-width="1.2"/>`);
  }
  for(let f=0; f<=12; f++){
    const y = y0 + f*stepY;
    svg.push(`<line x1="${marg}" y1="${y}" x2="${marg+(strings-1)*stepX}" y2="${y}" stroke="var(--line)" stroke-width="${f===0?2.5:.6}"/>`);
    if(f>0) svg.push(`<text x="${marg-9}" y="${y+4}" font-size="9" fill="var(--dim)" text-anchor="end" font-weight="${f===12?'600':'400'}">${f}</text>`);
  }
  // nomes das cordas
  const nomesCordas = ['e','B','G','D','A','E'];
  for(let s=0; s<strings; s++){
    const x = marg + s*stepX;
    svg.push(`<text x="${x}" y="${y0-7}" font-size="9" font-weight="700" fill="var(--dim)" text-anchor="middle">${nomesCordas[s]}</text>`);
  }
  // marcação de casa (bolinha no 3, 5, 7, 9, 12)
  const dots = {3:0,5:1,7:1,9:1,12:2};
  for(const f in dots){
    if(dots[f]===0){
      svg.push(`<circle cx="${marg+(strings-1)*stepX/2}" cy="${y0+f*stepY}" r="2.5" fill="var(--dim)" opacity=".3"/>`);
    } else {
      const off = stepX*1.2;
      svg.push(`<circle cx="${marg+off}" cy="${y0+f*stepY}" r="2" fill="var(--dim)" opacity=".3"/>`);
      svg.push(`<circle cx="${marg+(strings-1)*stepX-off}" cy="${y0+f*stepY}" r="2" fill="var(--dim)" opacity=".3"/>`);
    }
  }
  // agrupar notas por posição
  const posMap = {};
  for(const n of notas){
    if(!n.posicao) continue;
    const key = n.posicao.string+'-'+n.posicao.fret;
    if(!posMap[key]) posMap[key] = [];
    posMap[key].push(n);
  }
  const stepOff = [0, 10, -10, 17, -17];
  for(const key in posMap){
    const group = posMap[key];
    const p = group[0].posicao;
    const count = group.length;
    const baseX = marg + (6-p.string)*stepX;
    const y = y0 + p.fret*stepY;
    for(let i=0; i<count; i++){
      const n = group[i];
      const offX = stepOff[i] || stepOff[0];
      const x = baseX + (count>1 ? offX : 0);
      const cor = CORES_RNFG[n.grau]||'#888';
      const forma = GRAU_FORMA[n.grau]||'circulo';
      // glow sutil atrás da forma
      svg.push(`<circle cx="${x}" cy="${y}" r="8" fill="${cor}33" stroke="${cor}" stroke-width="1.5" filter="url(#gshadow)"/>`);
      // forma RNFG como marcador principal
      if(FORMA_SVG[forma]){
        svg.push(FORMA_SVG[forma](x, y, 6, cor));
      }
      // tooltip
      svg.push(`<title>${GRAU_NOME_ROM[n.grau]||'?'} — ${n.nota}${n.oitava!==0?(n.oitava>0?"'":"".repeat(-n.oitava)):''} (corda ${p.string}, traste ${p.fret})</title>`);
    }
  }
  svg.push('</svg>');
  // legenda RNFG com formas
  let html = svg.join('');
  html += '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;font:11px var(--mono);align-items:center">';
  html += `<span style="font-weight:600;font-size:10px;color:var(--dim);margin-right:4px">RNFG:</span>`;
  for(let g=1; g<=7; g++){
    const cor = CORES_RNFG[g];
    const fsvg = FORMA_SVG[GRAU_FORMA[g]];
    html += `<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background:${cor}22;border-radius:4px;border:1px solid ${cor}44">
      <svg width="14" height="14" viewBox="0 0 14 14">`;
    if(fsvg) html += fsvg(7, 7, 5, cor);
    html += `</svg>
      <span style="color:${cor};font-weight:600">${GRAU_NOME_ROM[g]}</span></span>`;
  }
  html += '</div>';
  // tab tradicional com números coloridos RNFG
  html += '<div style="margin-top:8px;font:11px var(--mono);overflow-x:auto;white-space:pre;color:var(--dim)"><strong>Tablatura RNFG:</strong><br>';
  const tabStrs = ['e-···','B-···','G-···','D-···','A-···','E-···'];
  // Guardar cores por posição para aplicar na tab
  const corMap = {};
  for(const n of notas){
    if(!n.posicao) continue;
    const key = n.posicao.string;
    if(!corMap[key]) corMap[key] = [];
    corMap[key].push({'fret': n.posicao.fret, 'cor': CORES_RNFG[n.grau]||'var(--dim)'});
  }
  // Gerar tab com <span> coloridos
  // Primeiro construir as linhas como arrays de partes
  const tabParts = [
    {str:'e', parts:[{txt:'-···',cor:null}]},
    {str:'B', parts:[{txt:'-···',cor:null}]},
    {str:'G', parts:[{txt:'-···',cor:null}]},
    {str:'D', parts:[{txt:'-···',cor:null}]},
    {str:'A', parts:[{txt:'-···',cor:null}]},
    {str:'E', parts:[{txt:'-···',cor:null}]},
  ];
  for(const n of notas){
    if(!n.posicao) continue;
    const p = n.posicao;
    const fr = String(p.fret).padStart(2,' ');
    const cor = CORES_RNFG[n.grau]||'var(--dim)';
    const idx = p.string-1;
    for(let s=0; s<6; s++){
      if(s===idx){
        tabParts[s].parts.push({txt:fr, cor:cor});
      } else {
        tabParts[s].parts.push({txt:'··', cor:null});
      }
      tabParts[s].parts.push({txt:'·', cor:null});
    }
  }
  for(let s=5; s>=0; s--){
    html += tabParts[s].str + '·';
    for(const p of tabParts[s].parts){
      if(p.cor){
        html += `<span style="color:${p.cor};font-weight:600">${p.txt}</span>`;
      } else {
        html += p.txt;
      }
    }
    html += '<br>';
  }
  html += '</div>';
  // sequência de graus coloridos
  html += '<div style="margin-top:5px;font:11px var(--mono);color:var(--dim)">';
  html += '<strong>Graus:</strong> ';
  for(const n of notas){
    const cor = CORES_RNFG[n.grau]||'#888';
    html += `<span style="display:inline-block;width:16px;text-align:center;color:${cor};font-weight:700">${n.grau}</span>`;
  }
  html += '</div>';
  html += `<div style="font:10px var(--mono);color:var(--dim);margin-top:4px">${notas.length} notas · ${tonalidade}</div>`;
  $('tabOutput').innerHTML = html;
}
function grau_forma_nome(g){ return GRAU_FORMA_NOME[g]||'—'; }

// ══════════════════════════════════════════════════════════
//  HARMONIA REAL
// ══════════════════════════════════════════════════════════
async function gerarHarmonia(){
  const cifra = $('harmCifra').value.trim();
  if(!cifra){ $('harmOutput').innerHTML='<div style="color:var(--err)">Digite uma cifra.</div>'; return; }
  const tonalidade = $('harmTonalidade').value;
  const modo = $('harmModo').value;
  $('harmOutput').innerHTML='<div style="color:var(--dim)">Analisando…</div>';
  try{
    const r = await fetch('/harmonia_info',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({cifra,tonalidade,modo})});
    const d = await r.json();
    if(!d.ok){ $('harmOutput').innerHTML='<div style="color:var(--err)">'+esc(d.erro||'erro')+'</div>'; return; }
    renderHarmonia(d, cifra, tonalidade);
  }catch(e){ $('harmOutput').innerHTML='<div style="color:var(--err)">Erro: '+esc(e.message)+'</div>'; }
}

function renderHarmonia(d, cifra, tonalidade){
  const notas = d.notas||[];
  let html = `<div style="margin-bottom:8px;font-size:15px"><strong>${esc(cifra)}</strong> em <strong>${tonalidade}</strong></div>`;
  html += '<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px">';
  for(const n of notas){
    const cor = n.cor||'#888';
    const formaNome = GRAU_FORMA[n.grau]||'circulo';
    html += `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;
      padding:10px;background:${cor}22;border:1px solid ${cor}44;border-radius:10px;min-width:80px">`;
    // forma SVG
    const fsvg = FORMA_SVG[formaNome];
    if(fsvg){
      html += `<svg width="40" height="40" viewBox="0 0 40 40">`;
      html += fsvg(20, 20, 14, cor);
      html += `</svg>`;
    }
    html += `<div style="font-weight:600;font-size:18px;color:${cor}">${n.nome||'?'}</div>`;
    html += `<div style="font:12px var(--mono);color:var(--dim)">${n.nota||'?'}</div>`;
    if(n.grau) html += `<div style="font:11px var(--mono);color:var(--dim)">${grau_forma_nome(n.grau)}</div>`;
    html += '</div>';
  }
  html += '</div>';
  // legenda
  html += '<div style="margin-top:12px;font:11px var(--mono);color:var(--dim)">';
  html += 'Grau: forma geométrica   |   Cor: nota fixa (RNFG)';
  html += '</div>';
  $('harmOutput').innerHTML = html;
}

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════
atualizarInfo();
</script>
</body>
</html>"""


# ═══════════════════════════════════════════════════════════
#  HANDLER HTTP
# ═══════════════════════════════════════════════════════════
class Handler(BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def _send(self,code,body,ctype):
        if isinstance(body,str): body=body.encode('utf-8')
        self.send_response(code)
        self.send_header("Content-Type",ctype)
        self.send_header("Content-Length",str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def _json(self):
        n=int(self.headers.get("Content-Length",0))
        return json.loads(self.rfile.read(n) or b"{}")

    def do_GET(self):
        if self.path in ("/","/index.html"):
            self._send(200,HTML,"text/html; charset=utf-8")
        elif self.path=="/pdf":
            pdf=WORK_DIR/"preview.pdf"
            if pdf.exists(): self._send(200,pdf.read_bytes(),"application/pdf")
            else: self._send(404,"Nenhum PDF renderizado.","text/plain; charset=utf-8")
        else: self._send(404,b"not found","text/plain")

    def do_POST(self):
        p=self.path
        if p=="/render":
            d=self._json()
            modo=d.get("modo","REAL")
            ton=d.get("tonalidade","c \\major")
            try:
                if modo=="TAB":
                    res=compilar_tab(d.get("sintaxe",""),
                                     d.get("titulo","Sem título"),d.get("compasso","2/4"))
                else:
                    res=compilar(d.get("sintaxe",""),modo,
                                  d.get("titulo","Sem título"),d.get("compasso","2/4"),
                                  tonalidade=ton)
            except Exception as e:
                res={"ok":False,"log":str(e)}
            self._send(200,json.dumps(res),"application/json; charset=utf-8")
        elif p=="/parse_xml":
            d=self._json()
            try:
                s=parse_musicxml(d.get("xml",""))
                self._send(200,json.dumps({"ok":bool(s),"sintaxe":s,
                    "erro":"Nenhuma nota encontrada." if not s else ""}),"application/json; charset=utf-8")
            except Exception as e:
                self._send(200,json.dumps({"ok":False,"erro":str(e)}),"application/json; charset=utf-8")
        elif p=="/parse_pdf":
            d=self._json()
            try:
                raw=base64.b64decode(d.get("pdf_b64",""))
                txt=_extrair_texto_pdf(raw)
                sint=_detectar_sintaxe_no_texto(txt)
                res={"ok":True,"texto":txt[:3000]}
                if sint: res["sintaxe"]=sint
                self._send(200,json.dumps(res),"application/json; charset=utf-8")
            except Exception as e:
                self._send(200,json.dumps({"ok":False,"erro":str(e)}),"application/json; charset=utf-8")
        elif p=="/tab_info":
            import rng_common as rng
            d=self._json()
            sint=d.get("sintaxe","")
            ton=d.get("tonalidade","C")
            notas=rng.sintaxe_para_notas(sint, ton)
            for n in notas:
                oit = n["oitava"] + 4  # oitava 0 = C4
                mel = rng.nota_melhor_posicao(n["nota"], oit)
                n["posicao"] = mel
            self._send(200, json.dumps({"ok":True,"notas":notas}), "application/json; charset=utf-8")
        elif p=="/harmonia_info":
            import rng_common as rng
            d=self._json()
            cif=d.get("cifra","")
            ton=d.get("tonalidade","C")
            modo=d.get("modo","maior")
            graus=rng.cifra_para_graus(cif, ton, modo)
            self._send(200, json.dumps({"ok":True,"notas":graus}), "application/json; charset=utf-8")
        elif p=="/normalizar":
            d=self._json()
            txt=d.get("texto","")
            normalizado=txt.translate(str.maketrans({
                "\u2019":"'","\u2018":"'","\u201b":"'","\u0060":"'","\u00b4":"'",
                "\u201c":'"',"\u201d":'"',"\u201e":'"',
            }))
            self._send(200,json.dumps({"ok":True,"sintaxe":normalizado}),
                "application/json; charset=utf-8")
        elif p=="/render/audio":
            d=self._json()
            try:
                res=_compilar_audio(d.get("sintaxe",""),
                    d.get("titulo","Sem título"),d.get("compasso","2/4"),
                    andamento=d.get("andamento",80),
                    tonalidade=d.get("tonalidade","c \\major"))
            except Exception as e:
                res={"ok":False,"erro":str(e)}
            self._send(200,json.dumps(res),"application/json; charset=utf-8")
        elif p=="/export/midi":
            d=self._json()
            try:
                res=_compilar_audio(d.get("sintaxe",""),
                    d.get("titulo","Sem título"),d.get("compasso","2/4"),
                    andamento=d.get("andamento",80),
                    tonalidade=d.get("tonalidade","c \\major"))
                if res.get("midi"):
                    self._send(200,json.dumps({"ok":True,"midi":res["midi"]}),
                        "application/json; charset=utf-8")
                else:
                    self._send(200,json.dumps({"ok":False,"erro":"MIDI não gerado"}),
                        "application/json; charset=utf-8")
            except Exception as e:
                self._send(200,json.dumps({"ok":False,"erro":str(e)}),
                    "application/json; charset=utf-8")
        elif p=="/export/wav":
            d=self._json()
            try:
                res=_compilar_audio(d.get("sintaxe",""),
                    d.get("titulo","Sem título"),d.get("compasso","2/4"),
                    andamento=d.get("andamento",80),
                    tonalidade=d.get("tonalidade","c \\major"))
                if res.get("wav"):
                    self._send(200,json.dumps({"ok":True,"wav":res["wav"]}),
                        "application/json; charset=utf-8")
                else:
                    self._send(200,json.dumps({"ok":False,"erro":res.get("erro","WAV não gerado")}),
                        "application/json; charset=utf-8")
            except Exception as e:
                self._send(200,json.dumps({"ok":False,"erro":str(e)}),
                    "application/json; charset=utf-8")
        else:
            self._send(404,b"not found","text/plain")


# ═══════════════════════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════════════════════
def main():
    if not Path(LILYPOND).exists() and shutil.which("lilypond") is None:
        print("⚠️  LilyPond não encontrado. Instale:  brew install lilypond")
        sys.exit(1)
    if not HEADER_FILE.exists():
        print(f"⚠️  {HEADER_FILE.name} não encontrado — o .ly pode falhar no \\include.")
    for pkg,mod in [("pdfminer.six","pdfminer")]:
        try: __import__(mod)
        except ImportError:
            print(f"ℹ️  Extração de PDF aprimorada: pip install {pkg}")

    url=f"http://localhost:{PORT}"
    print(f"🎼  Note Form Pro v2.1 → {url}  (Ctrl+C para sair)")
    print("    ✦ Undo/Redo  ✦ Atalhos à la Sibelius  ✦ Contador de compassos")
    print("    ✦ Tema claro/escuro  ✦ Busca inline  ✦ Preview RNFG  ✦ Log histórico")
    print("    ✦ Real Tablatura (🎸)  ✦ Harmonia Real (🎵)")
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    ThreadingHTTPServer(("127.0.0.1",PORT),Handler).serve_forever()

if __name__=="__main__":
    main()
