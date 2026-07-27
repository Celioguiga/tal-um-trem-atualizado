p = "/root/pro_studio_deploy/src/app.js"
s = open(p, encoding="utf-8").read()

# 1) remove a chamada antiga (desenhava num #tab separado, antes da pauta existir)
a1 = '''  const elTab=$("tab");
  try{
    const armaduraLabel = KEY_LABEL[$("tom").value] + " · " + (key.sig>0 ? key.sig+'♯' : key.sig<0 ? (-key.sig)+'♭' : 'sem alteração');
    desenhaTab(elTab, events, tonicaPc(key), Object.assign({compasso: ts, armadura: armaduraLabel}, getTabOpts()));
  }catch(err){
    console.error("Real Tablatura:", err);
  }
'''
f1 = '''  const armaduraLabel = KEY_LABEL[$("tom").value] + " · " + (key.sig>0 ? key.sig+'♯' : key.sig<0 ? (-key.sig)+'♭' : 'sem alteração');
'''
assert s.count(a1)==1, f"a1: {s.count(a1)}x"
s = s.replace(a1, f1)

# 2) chama a versão nova, alinhada, depois que a pauta (out.svg) já existe
a2 = '''  }catch(err){
    av.innerHTML='<span class="err">Erro na gravura: '+err.message+"</span>";return;
  }'''
f2 = a2 + '''

  try{
    desenhaTabInline(out.svg, mkEl, events, out.anchors, out.measureBoxes, out.perLine, out.rowH, out.TAB_H, out.top, tonicaPc(key), Object.assign({compasso: ts, armadura: armaduraLabel}, getTabOpts()));
  }catch(err){
    console.error("Real Tablatura:", err);
  }'''
assert s.count(a2)==1, f"a2: {s.count(a2)}x"
s = s.replace(a2, f2)

open(p, "w", encoding="utf-8").write(s)
print("app.js: desenhaTabInline() agora roda DEPOIS da pauta, usando anchors/measureBoxes reais.")
