p = "/root/pro_studio_deploy/src/app.js"
s = open(p, encoding="utf-8").read()
anchor = 'desenhaTab(elTab, events, tonicaPc(key), Object.assign({claro:document.body.classList.contains(\'claro\')}, getTabOpts()));'
assert anchor in s, "chamada de desenhaTab não encontrada"
sinaisArmadura = "key.sig>0 ? key.sig+'♯' : key.sig<0 ? (-key.sig)+'♭' : 'sem alteração'"
fix = f'''const armaduraLabel = KEY_LABEL[$("tom").value] + " · " + ({sinaisArmadura});
    desenhaTab(elTab, events, tonicaPc(key), Object.assign({{compasso: ts, armadura: armaduraLabel}}, getTabOpts()));'''
s = s.replace(anchor, fix)
open(p, "w", encoding="utf-8").write(s)
print("app.js: compasso e armadura agora são passados pra desenhaTab().")
