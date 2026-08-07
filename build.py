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
<script>
/* Amostras reais de violão (nylon), extraídas do MS Basic.sf3 (MIT) — ver
   src/guitar_samples.js para os créditos completos. Script à parte só por
   tamanho (base64), mesmo escopo global dos demais. */
{r("src/guitar_samples.js")}
</script>
<script>
/* Amostras reais de ukulelê (Kala KA-CE concert scale), CC0 — ver
   src/ukulele_samples.js para os créditos completos. Script à parte só
   por tamanho (base64), mesmo escopo global dos demais. */
{r("src/ukulele_samples.js")}
</script>
<script>
"use strict";
{r("src/app.js")}
</script>"""
out=shell.replace("<!-- @INJETAR_SCRIPTS -->\n</body>\n</html>\n",bloco+"\n</body>\n</html>\n")
assert bloco in out,"marcador @INJETAR_SCRIPTS não encontrado no shell"
open(os.path.join(BASE,"pro_studio.html"),"w",encoding="utf-8").write(out)
print("pro_studio.html montado:",os.path.getsize(os.path.join(BASE,"pro_studio.html"))//1024,"KB")
