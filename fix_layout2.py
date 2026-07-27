p = "/root/pro_studio_deploy/src/shell.html"
s = open(p, encoding="utf-8").read()

anchor = '''  <section class="score-card" aria-label="Tablatura Real">
    <svg id="tab" viewBox="0 0 100 100" role="img" aria-label="Tablatura Real Nota Forma Grau"></svg>
  </section>
  <section class="score-card" aria-label="Partitura">
    <div id="score"></div>
  </section>'''

fix = '''  <div class="score-stack">
  <section class="score-card" aria-label="Tablatura Real">
    <div style="overflow-x:auto"><svg id="tab" viewBox="0 0 100 100" role="img" aria-label="Tablatura Real Nota Forma Grau"></svg></div>
  </section>
  <section class="score-card" aria-label="Partitura">
    <div id="score"></div>
  </section>
  </div>'''

assert s.count(anchor) == 1, f"encontrado {s.count(anchor)}x (esperado 1)"
s = s.replace(anchor, fix)
open(p, "w", encoding="utf-8").write(s)
print("Layout corrigido: score-stack envolvendo tab + partitura, svg com scroll horizontal.")
