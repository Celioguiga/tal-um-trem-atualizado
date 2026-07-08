import { BRAND, RNFG_ARRAY, BRAND_COLORS, BRAND_GRADIENT, TYPOGRAPHY, SHAPE_CLIP } from "../../lib/brand";
import { useTheme } from "../../lib/theme";

function Swatch({ hex, nome }: { hex: string; nome: string }) {
  const { vars } = useTheme();
  return (
    <div className="flex items-center gap-3 rounded-lg px-4 py-3 border" style={{ background: vars["--surface"], borderColor: vars["--border"] }}>
      <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: hex }} />
      <div>
        <div className="text-sm font-medium" style={{ color: vars["--text"] }}>{nome}</div>
        <div className="text-xs font-mono" style={{ color: vars["--textMuted"] }}>{hex}</div>
      </div>
    </div>
  );
}

function FormaCard({ nome, hex, grau, forma, clip }: { nome: string; hex: string; grau: string; forma: string; clip: string }) {
  const { vars } = useTheme();
  return (
    <div className="rounded-xl border p-5 text-center space-y-3" style={{ background: vars["--surface"], borderColor: vars["--border"] }}>
      <div className="w-14 h-14 mx-auto" style={{ background: hex, clipPath: clip }} />
      <div>
        <div className="text-sm font-bold" style={{ color: vars["--text"] }}>{nome}</div>
        <div className="text-xs" style={{ color: vars["--textMuted"] }}>{grau} · {forma}</div>
      </div>
    </div>
  );
}

const CANAIS_BRAND = [
  { nome: "Instagram", papel: "Topo — descoberta", cor: BRAND_COLORS.accent },
  { nome: "Facebook", papel: "Topo/Meio — comunidade", cor: BRAND_COLORS.primary },
  { nome: "YouTube", papel: "Meio — autoridade", cor: BRAND_COLORS.error },
  { nome: "Blog/Newsletter", papel: "Base — conversão", cor: BRAND_COLORS.success },
];

export function BrandPage() {
  const { vars } = useTheme();

  return (
    <div className="space-y-12 max-w-4xl pb-20 p-8" style={{ color: vars["--text"] }}>
      <div className="space-y-6">
        <div className="inline-flex items-center gap-4 rounded-2xl px-6 py-4 border" style={{ background: vars["--surface"], borderColor: vars["--border"] }}>
          <svg width="48" height="48" viewBox="0 0 48 48">
            {RNFG_ARRAY.map((c, i) => {
              const paths = ["M12,0A12,12 0 1,0 12,24A12,12 0 1,0 12,0Z","M12,0 L24,12 L12,24 L0,12 Z","M12,0 L24,21 L0,21 Z","M0,0 L24,0 L24,24 L0,24 Z","M12,0 L14.8,9 L24,9 L16.4,14.5 L19.2,24 L12,18.5 L4.8,24 L7.6,14.5 L0,9 L9.2,9 Z","M12,0 L22,6 L22,18 L12,24 L2,18 L2,6 Z","M12,0 L24,9.4 L24,24 L0,24 L0,9.4 Z"];
              return <path key={c.nome} d={paths[i]} fill={c.hex} opacity={0.9} transform={`translate(${i * 7}, 12) scale(0.8)`} />;
            })}
          </svg>
          <div>
            <div className="text-xl font-bold">{BRAND.name}</div>
            <div className="text-xs uppercase tracking-wider" style={{ color: vars["--textMuted"] }}>{BRAND.tagline}</div>
          </div>
        </div>
        <p className="text-lg leading-relaxed max-w-2xl" style={{ color: vars["--textDim"] }}>
          {BRAND.name} é a plataforma SaaS da <strong style={{ color: vars["--text"] }}>Synemusic</strong> para a
          Metodologia <strong style={{ color: vars["--text"] }}>Real Nota Forma Grau</strong>.
          Cada nota tem uma cor fixa, cada grau tem uma forma fixa, e a tonalidade
          só decide qual forma cada nota recebe — as cores nunca mentem.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold mb-1" style={{ color: vars["--text"] }}>Voz da Marca</h2>
        <p className="text-sm mb-4" style={{ color: vars["--textMuted"] }}>Como a Note Form Pro fala</p>
        <div className="rounded-xl border p-6 space-y-4" style={{ background: vars["--surface"], borderColor: vars["--border"] }}>
          <div className="border-l-4 pl-4" style={{ borderColor: "#0066FF" }}>
            <div className="text-sm font-medium">Princípio</div>
            <div className="text-sm italic mt-1" style={{ color: vars["--textDim"] }}>
              "Música é uma língua, e a RNFG é o alfabeto que estava escondido embaixo dela."
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg p-4" style={{ background: vars["--surface2"] }}>
              <div className="font-medium mb-1" style={{ color: "#00B050" }}>✓ Autoridade acessível</div>
              <div style={{ color: vars["--textDim"] }}>Fala de professor para professor/músico. Sem jargão, sem tom corporativo.</div>
            </div>
            <div className="rounded-lg p-4" style={{ background: vars["--surface2"] }}>
              <div className="font-medium mb-1" style={{ color: "#C0001A" }}>✗ Evitar</div>
              <div style={{ color: vars["--textDim"] }}>"Ótima pergunta", "Absolutamente", "Com certeza". Vá direto ao gancho.</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-1">Cores</h2>
        <p className="text-sm mb-4" style={{ color: vars["--textMuted"] }}>Paleta RNFG + cores funcionais da marca</p>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: vars["--textDim"] }}>Cores RNFG (cada nota)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {RNFG_ARRAY.map((c) => (
                <Swatch key={c.nome} hex={c.hex} nome={`${c.nome} (${c.grau})`} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: vars["--textDim"] }}>Funcionais da Marca</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Swatch hex="#0066FF" nome="Primary (Sol)" />
              <Swatch hex="#9B5FC0" nome="Accent (Si)" />
              <Swatch hex="#00B050" nome="Success (Fá)" />
              <Swatch hex="#C0001A" nome="Error (Dó)" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-3" style={{ color: vars["--textDim"] }}>Gradiente da Marca</h3>
            <div className="h-12 rounded-xl" style={{ background: BRAND_GRADIENT }} />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-1">Formas</h2>
        <p className="text-sm mb-4" style={{ color: vars["--textMuted"] }}>Cada grau da escala tem uma forma geométrica fixa</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {RNFG_ARRAY.map((c, i) => (
            <FormaCard
              key={c.nome}
              nome={c.nome}
              hex={c.hex}
              grau={c.grau}
              forma={c.forma}
              clip={Object.values(SHAPE_CLIP)[i]}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-1">Tipografia</h2>
        <p className="text-sm mb-4" style={{ color: vars["--textMuted"] }}>Inter + JetBrains Mono</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border p-6 space-y-2" style={{ background: vars["--surface"], borderColor: vars["--border"] }}>
            <div className="text-xs uppercase tracking-wide" style={{ color: vars["--textMuted"] }}>Inter (principal)</div>
            <div className="text-2xl font-extrabold" style={{ fontFamily: TYPOGRAPHY.fontFamily }}>ABCDEFGHIJKLMNOP</div>
            <div className="text-xl font-bold" style={{ fontFamily: TYPOGRAPHY.fontFamily }}>abcdefghijklmnopqrstuvwxyz</div>
            <div className="text-sm" style={{ fontFamily: TYPOGRAPHY.fontFamily, color: vars["--textDim"] }}>0123456789 · !@#$%&amp;*()</div>
          </div>
          <div className="rounded-xl border p-6 space-y-2" style={{ background: vars["--surface"], borderColor: vars["--border"] }}>
            <div className="text-xs uppercase tracking-wide" style={{ color: vars["--textMuted"] }}>Mono (código)</div>
            <div className="text-xl font-bold" style={{ fontFamily: TYPOGRAPHY.fontMono }}>c'1 d'1 e'1 f'1 g'1 a'1 b'1</div>
            <div className="text-sm" style={{ fontFamily: TYPOGRAPHY.fontMono, color: vars["--textDim"] }}>!@#$% &amp;*() 0123456789</div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-1">Canais</h2>
        <p className="text-sm mb-4" style={{ color: vars["--textMuted"] }}>Papel de cada canal no funil</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CANAIS_BRAND.map((c) => (
            <div key={c.nome} className="rounded-xl border p-5 flex items-center gap-4" style={{ background: vars["--surface"], borderColor: vars["--border"] }}>
              <div>
                <div className="text-sm font-medium">{c.nome}</div>
                <div className="text-xs" style={{ color: vars["--textMuted"] }}>{c.papel}</div>
              </div>
              <div className="ml-auto w-3 h-3 rounded-full shrink-0" style={{ background: c.cor }} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-1">Aplicação</h2>
        <p className="text-sm mb-4" style={{ color: vars["--textMuted"] }}>Como usar a identidade nos materiais</p>
        <div className="rounded-xl border p-6" style={{ background: vars["--surface"], borderColor: vars["--border"] }}>
          <ul className="space-y-3 text-sm" style={{ color: vars["--textDim"] }}>
            <li className="flex gap-3">
              <span className="shrink-0" style={{ color: "#0066FF" }}>•</span>
              <span><strong style={{ color: vars["--text"] }}>Fundo temático</strong> com a cor da Rainha Fada ativa. Cards escuros para contraste.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0" style={{ color: "#0066FF" }}>•</span>
              <span><strong style={{ color: vars["--text"] }}>Cores RNFG</strong> são destaque — use com moderação. Uma cor por contexto.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0" style={{ color: "#0066FF" }}>•</span>
              <span><strong style={{ color: vars["--text"] }}>Gradiente</strong> reservado para o logo e elementos especiais.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0" style={{ color: "#0066FF" }}>•</span>
              <span><strong style={{ color: vars["--text"] }}>Formas geométricas</strong> como ícones decorativos nas bordas.</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0" style={{ color: "#0066FF" }}>•</span>
              <span>O <strong style={{ color: vars["--text"] }}>Sol azul (#0066FF)</strong> é a cor primária da marca — use em botões, links, destaques.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
