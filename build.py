#!/usr/bin/env python3
"""
Pro Studio — montagem do arquivo final.
Edite SEMPRE os arquivos em src/ (pequenos, patches cirúrgicos — regra do projeto)
e rode:  python3 build.py
NUNCA edite pro_studio.html diretamente (588 KB — risco de corrupção).
"""
import os
BASE=os.path.dirname(os.path.abspath(__file__))
r=lambda p:open(os.path.join(BASE,p),encoding="utf-8").read()
shell=r("src/shell.html")

# Conjuntos de amostras. Cada um vira um <script> separado só por tamanho
# (base64), no mesmo escopo global dos demais.
# Arquivo AUSENTE é PULADO com aviso, não quebra o build: gerar amostras exige
# fluidsynth + ffmpeg + SoundFont (ver tools/extrair_amostras.py), que nem toda
# máquina tem. Instrumento cujo conjunto não foi gerado cai no nylon — timbre
# aproximado em vez de mudo (ver SAMPLES_POR_INSTRUMENTO em src/app.js).
AMOSTRAS=[
    ("src/guitar_samples.js",  "violão nylon — MS Basic.sf3 (MIT), GM 24"),
    ("src/ukulele_samples.js", "ukulelê Kala KA-CE concert (CC0)"),
    ("src/bass_samples.js",    "contrabaixo acústico — GM 32"),
    ("src/steel_samples.js",   "violão de aço — GM 25 (cavaquinho e viola caipira)"),
]
blocos_amostras=[]
for caminho,desc in AMOSTRAS:
    if not os.path.exists(os.path.join(BASE,caminho)):
        print(f"  amostras ainda não geradas, pulando: {caminho}")
        continue
    blocos_amostras.append(f"""<script>
/* Amostras reais — {desc}. Créditos completos no próprio {caminho}. */
{r(caminho)}
</script>""")
blocos_amostras="\n".join(blocos_amostras)
bloco=f"""<script>
/* Tone.js 14.8.49 — embutido, sem CDN */
{r("vendor/tone.js")}
</script>
<script>
/* VexFlow 4.2.2 (Bravura) — embutido, sem CDN */
{r("vendor/vexflow-bravura.js")}
</script>
<script>
"use strict";
{r("src/core.js")}
{r("src/rng_tab_module.js")}
{r("src/renderer.js")}
{r("src/scrubber_module.js")}
</script>
{blocos_amostras}
<script>
"use strict";
{r("src/app.js")}
</script>"""
out=shell.replace("<!-- @INJETAR_SCRIPTS -->\n</body>\n</html>\n",bloco+"\n</body>\n</html>\n")
assert bloco in out,"marcador @INJETAR_SCRIPTS não encontrado no shell"
open(os.path.join(BASE,"pro_studio.html"),"w",encoding="utf-8").write(out)
print("pro_studio.html montado:",os.path.getsize(os.path.join(BASE,"pro_studio.html"))//1024,"KB")
