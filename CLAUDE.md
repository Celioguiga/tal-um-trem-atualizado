# Pro Studio — regras do projeto

## Build
- NUNCA editar pro_studio.html diretamente. É gerado por build.py.
- Fonte de verdade: src/. Build: `python3 build.py`.
- VexFlow 4.2.2 com fonte Bravura (vendor/vexflow-bravura.js).
- _legacy/ contém scripts de patch antigos e .bak. NÃO ler, NÃO usar como referência.

## Regras anti-erro RNFG
- R1: nunca alterar notas musicais em edição de layout/render. Cirurgia estrita no que foi pedido.
- R2: nunca assumir cor ou forma de grau. Consultar o mapeamento canônico.
- R3: cores e formas nunca hardcoded fora do mapeador canônico.
- Grau 5 (Sol) = estrela #0066FF. Não é círculo.
- Ritmo é acromático: sem altura, sem cor, sem forma.

## Fluxo de trabalho
- Antes de implementar, mapear o código existente e explicar. Só codar após aprovação.
- Toda decisão arquitetural relevante vira handoff antes de encerrar a sessão (R5).
- Ver HANDOFF_PRO_STUDIO_V3.md para o estado anterior do projeto.
