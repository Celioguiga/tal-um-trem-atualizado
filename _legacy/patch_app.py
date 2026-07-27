p = "/root/pro_studio_deploy/src/app.js"
s = open(p, encoding="utf-8").read()

# 1) funções novas — logo após a definição de mkEl
anchor_a = '''const mkEl=(t,a)=>{const e=document.createElementNS("http://www.w3.org/2000/svg",t);
  for(const k in a)e.setAttribute(k,a[k]);return e;};'''
insert_a = anchor_a + '''

/* ---- Real Tablatura: tom -> pitch class da tônica, e leitura do <select> ---- */
function tonicaPc(key){
  return (SEMI[key.tonicLetter] + sigAlter(key.tonicLetter, key.sig) + 12) % 12;
}
function getTabOpts(){
  const v=$("selModoTab").value;
  return v==='proxima' ? {modo:'proxima'} : {modo:'caged', shape:v};
}'''
assert s.count(anchor_a) == 1, f"anchor_a encontrado {s.count(anchor_a)}x (esperado 1)"
s = s.replace(anchor_a, insert_a)

# 2) chamada de desenhaTab() dentro de render(), logo após checar que há eventos
anchor_b = '''  lastEvents=events;
  if(!events.length){av.innerHTML='<span class="err">Nada para renderizar — confira a sintaxe.</span>';return;}'''
insert_b = anchor_b + '''

  const elTab=$("tab");
  try{
    desenhaTab(elTab, events, tonicaPc(key), Object.assign({claro:document.body.classList.contains('claro')}, getTabOpts()));
  }catch(err){
    console.error("Real Tablatura:", err);
  }'''
assert s.count(anchor_b) == 1, f"anchor_b encontrado {s.count(anchor_b)}x (esperado 1)"
s = s.replace(anchor_b, insert_b)

# 3) listener do select — acrescentado no final do arquivo, sem precisar de âncora
s += '''

/* listener do seletor de tablatura (Real Tablatura) */
document.getElementById("selModoTab").addEventListener("change", render);
'''

open(p, "w", encoding="utf-8").write(s)
print("app.js corrigido: tonicaPc/getTabOpts + chamada desenhaTab() em render() + listener do select.")
