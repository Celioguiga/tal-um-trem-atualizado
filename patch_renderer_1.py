p = "/root/pro_studio_deploy/src/renderer.js"
s = open(p, encoding="utf-8").read()

a1 = '''  const perLine=width<620?2:4;
  const lines=Math.ceil(nMeasures/perLine);
  const titleH=opts.title?64:14;
  const lineH=126, top=titleH, mX=4;
  const H=top+lines*lineH+30;'''
f1 = '''  const perLine=width<620?2:4;
  const lines=Math.ceil(nMeasures/perLine);
  const titleH=opts.title?64:14;
  const lineH=126, top=titleH, mX=4;
  const TAB_H=110, rowH=lineH+TAB_H;  // TAB_H: faixa reservada pra Real Tablatura acima de cada sistema
  const H=top+lines*rowH+30;'''
assert s.count(a1)==1, f"a1: {s.count(a1)}x"
s=s.replace(a1,f1)

a2='    const stave=new VF.Stave(mX+col*stW, top+line*lineH, stW);'
f2='    const stave=new VF.Stave(mX+col*stW, top+line*rowH+TAB_H, stW);'
assert s.count(a2)==1, f"a2: {s.count(a2)}x"
s=s.replace(a2,f2)

a3='  return {svg,anchors,warns,height:H};'
f3='''  const measureBoxes=measureStaves.map(st=>({x:st.getX(),y:st.getY(),width:st.getWidth()}));
  return {svg,anchors,warns,height:H,measureBoxes,perLine,rowH,TAB_H,top};'''
assert s.count(a3)==1, f"a3: {s.count(a3)}x"
s=s.replace(a3,f3)

open(p,"w",encoding="utf-8").write(s)
print("renderer.js: faixa de tab reservada por sistema + measureBoxes/perLine/rowH/TAB_H/top expostos.")
