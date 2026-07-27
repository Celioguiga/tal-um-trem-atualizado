p = "/root/pro_studio_deploy/src/shell.html"
s = open(p, encoding="utf-8").read()

# 1) nova regra CSS — empilha os dois score-card dentro da coluna 2 do grid
anchor_css = '.score-card{background:var(--paper);border-radius:var(--r);padding:26px 28px 40px;color:#1d1d1b;'
assert s.count(anchor_css) == 1, f"CSS âncora encontrada {s.count(anchor_css)}x"
insert_css = '.score-stack{display:flex;flex-direction:column;gap:14px}\n' + anchor_css
s = s.replace(anchor_css, insert_css)

# 2) envolve as duas seções (tab + partitura) num único container
anchor_html = '''<section class="score-card" aria-label="Tablatura Real">
    <div style="overflow-x:auto"><svg id="tab" viewBox="0 0 100 100" role="img" aria-label="Tablatura Real Nota Forma Grau"></svg></div>
  </section>
  <section class="score-card" aria-label="Partitura">
    <div id="score"></div>
  </section>'''
insert_html = '''<div class="score-stack">
  <section class="score-card" aria-label="Tablatura Real">
    <div style="overflow-x:auto"><svg id="tab" viewBox="0 0 100 100" role="img" aria-label="Tablatura Real Nota Forma Grau"></svg></div>
  </section>
  <section class="score-card" aria-label="Partitura">
    <div id="score"></div>
  </section>
  </div>'''
assert s.count(anchor_html) == 1, f"HTML âncora encontrada {s.count(anchor_html)}x"
s = s.replace(anchor_html, insert_html)

open(p, "w", encoding="utf-8").write(s)
print("Layout corrigido: tab + partitura agora empilhados juntos na coluna 2 do grid.")
