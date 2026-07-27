p = "/root/pro_studio_deploy/src/shell.html"
s = open(p, encoding="utf-8").read()

a = '''  <div class="score-stack">
  <section class="score-card" aria-label="Tablatura Real">
    <div style="overflow-x:auto"><svg id="tab" viewBox="0 0 100 100" role="img" aria-label="Tablatura Real Nota Forma Grau"></svg></div>
  </section>
  <section class="score-card" aria-label="Partitura">
    <div id="score"></div>
  </section>
  </div>'''
f = '''  <section class="score-card" aria-label="Partitura">
    <div id="score"></div>
  </section>'''
assert s.count(a)==1, f"achado {s.count(a)}x"
s = s.replace(a, f)

open(p, "w", encoding="utf-8").write(s)
print("shell.html revertido: #tab separado removido, só resta #score (tab desenha dentro dele agora).")
