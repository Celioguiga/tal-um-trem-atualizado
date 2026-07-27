p = "/root/pro_studio_deploy/src/shell.html"
s = open(p, encoding="utf-8").read()
anchor = '<div id="tab"></div>'
fix = '<svg id="tab" viewBox="0 0 100 100" role="img" aria-label="Tablatura Real Nota Forma Grau"></svg>'
assert s.count(anchor) == 1, f"encontrado {s.count(anchor)}x (esperado 1)"
s = s.replace(anchor, fix)
open(p, "w", encoding="utf-8").write(s)
print("shell.html corrigido: #tab agora é <svg>, não <div>.")
