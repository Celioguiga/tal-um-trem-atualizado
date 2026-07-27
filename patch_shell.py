import re
p = "/root/pro_studio_deploy/src/shell.html"
s = open(p, encoding="utf-8").read()

# 1) Adiciona o seletor de modo/desenho da tablatura, logo após o de Visualização
anchor_a = '''<label><input type="radio" name="modo" value="trad"><span>Pauta</span></label>
          </div></div>'''
insert_a = anchor_a + '''
        <div><span class="lbl">Tablatura</span>
          <select id="selModoTab">
            <option value="proxima">Mais próxima</option>
            <option value="C">Desenho de Dó (C)</option>
            <option value="A">Desenho de Lá (A)</option>
            <option value="G">Desenho de Sol (G)</option>
            <option value="E">Desenho de Mi (E)</option>
            <option value="D">Desenho de Ré (D)</option>
          </select></div>'''
assert s.count(anchor_a) == 1, f"anchor_a encontrado {s.count(anchor_a)}x (esperado 1)"
s = s.replace(anchor_a, insert_a)

# 2) Adiciona o container da tablatura ACIMA do container da partitura
anchor_b = '<section class="score-card" aria-label="Partitura">'
insert_b = '''<section class="score-card" aria-label="Tablatura Real">
    <div id="tab"></div>
  </section>
  ''' + anchor_b
assert s.count(anchor_b) == 1, f"anchor_b encontrado {s.count(anchor_b)}x (esperado 1)"
s = s.replace(anchor_b, insert_b)

open(p, "w", encoding="utf-8").write(s)
print("shell.html corrigido: seletor de tablatura + container #tab inseridos.")
