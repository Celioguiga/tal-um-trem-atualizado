p = "/root/pro_studio_deploy/src/shell.html"
s = open(p, encoding="utf-8").read()

troca1 = ('<title>Pro Studio — Note Forma Grau</title>', '<title>Real Tablatura Studio</title>')
troca2 = ('<h1>Pro Studio</h1>', '<h1>Real Tablatura Studio</h1>')
troca3 = ('<small>Note Forma Grau · Synemusic</small>', '<small>Real Nota Forma Grau · Synemusic</small>')

for antigo, novo in [troca1, troca2, troca3]:
    assert s.count(antigo) == 1, f"não encontrado ou duplicado: {antigo!r}"
    s = s.replace(antigo, novo)

open(p, "w", encoding="utf-8").write(s)
print("Renomeado: aba do navegador, título e subtítulo -> Real Tablatura Studio.")
