import { BRAND, RNFG_ARRAY, BRAND_COLORS, BRAND_GRADIENT, TYPOGRAPHY, SHAPE_CLIP } from "../../lib/brand";

function Swatch({ hex, nome }: { hex: string; nome: string }) {
  return (
    <div className="flex items-center gap-3 bg-zinc-900 rounded-lg px-4 py-3 border border-zinc-800">
      <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: hex }} />
      <div>
        <div className="text-sm font-medium text-white">{nome}</div>
        <div className="text-xs text-zinc-500 font-mono">{hex}</div>
      </div>
    </div>
  );
}

function FormaCard({ nome, hex, grau, forma, clip }: { nome: string; hex: string; grau: string; forma: string; clip: string }) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 text-center space-y-3">
      <div className="w-14 h-14 mx-auto" style={{ background: hex, clipPath: clip }} />
      <div>
        <div className="text-sm font-bold text-white">{nome}</div>
        <div className="text-xs text-zinc-500">{grau} · {forma}</div>
      </div>
    </div>
  );
}

const CANAIS_BRAND = [
  { nome: "Instagram", papel: "Topo — descoberta", cor: BRAND_COLORS.accent, icone: "📸" },
  { nome: "Facebook", papel: "Topo/Meio — comunidade", cor: BRAND_COLORS.primary, icone: "📘" },
  { nome: "YouTube", papel: "Meio — autoridade", cor: BRAND_COLORS.error, icone: "🎬" },
  { nome: "Blog/Newsletter", papel: "Base — conversão", cor: BRAND_COLORS.success, icone: "📝" },
];

export function BrandPage() {
  return (
    <div className="space-y-12 max-w-4xl pb-20">

      {/* HERO */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-4 bg-zinc-900 rounded-2xl px-6 py-4 border border-zinc-800">
          <svg width="48" height="48" viewBox="0 0 48 48">
            {RNFG_ARRAY.map((c, i) => {
              const paths = ["M12,0A12,12 0 1,0 12,24A12,12 0 1,0 12,0Z","M12,0 L24,12 L12,24 L0,12 Z","M12,0 L24,21 L0,21 Z","M0,0 L24,0 L24,24 L0,24 Z","M12,0 L14.8,9 L24,9 L16.4,14.5 L19.2,24 L12,18.5 L4.8,24 L7.6,14.5 L0,9 L9.2,9 Z","M12,0 L22,6 L22,18 L12,24 L2,18 L2,6 Z","M12,0 L24,9.4 L24,24 L0,24 L0,9.4 Z"];
              return <path key={c.nome} d={paths[i]} fill={c.hex} opacity={0.9} transform={`translate(${i * 7}, 12) scale(0.8)`} />;
            })}
          </svg>
          <div>
            <div className="text-xl font-bold text-white">{BRAND.name}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">{BRAND.tagline}</div>
          </div>
        </div>
        <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
          {BRAND.name} é a plataforma SaaS da <strong className="text-white">Synemusic</strong> para a
          Metodologia <strong className="text-white">Real Nota Forma Grau</strong>.
          Cada nota tem uma cor fixa, cada grau tem uma forma fixa, e a tonalidade
          só decide qual forma cada nota recebe — as cores nunca mentem.
        </p>
      </div>

      {/* VOICE */}
      <section>
        <h2 className="text-xl font-bold text-white mb-1">Voz da Marca</h2>
        <p className="text-sm text-zinc-500 mb-4">Como a Note Form Pro fala</p>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-4">
          <div className="border-l-4 border-rng-sol pl-4">
            <div className="text-sm font-medium text-white">Princípio</div>
            <div className="text-sm text-zinc-300 italic mt-1">
              "Música é uma língua, e a RNFG é o alfabeto que estava escondido embaixo dela."
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="text-rng-fa font-medium mb-1">✓ Autoridade acessível</div>
              <div className="text-zinc-400">Fala de professor para professor/músico. Sem jargão, sem tom corporativo.</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="text-rng-do font-medium mb-1">✗ Evitar</div>
              <div className="text-zinc-400">"Ótima pergunta", "Absolutamente", "Com certeza". Vá direto ao gancho.</div>
            </div>
          </div>
        </div>
      </section>

      {/* COLORS */}
      <section>
        <h2 className="text-xl font-bold text-white mb-1">Cores</h2>
        <p className="text-sm text-zinc-500 mb-4">Paleta RNFG + cores funcionais da marca</p>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Cores RNFG (cada nota)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {RNFG_ARRAY.map((c) => (
                <Swatch key={c.nome} hex={c.hex} nome={`${c.nome} (${c.grau})`} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Funcionais da Marca</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Swatch hex="#0066FF" nome="Primary (Sol)" />
              <Swatch hex="#9B5FC0" nome="Accent (Si)" />
              <Swatch hex="#00B050" nome="Success (Fá)" />
              <Swatch hex="#C0001A" nome="Error (Dó)" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Gradiente da Marca</h3>
            <div className="h-12 rounded-xl" style={{ background: BRAND_GRADIENT }} />
          </div>
        </div>
      </section>

      {/* SHAPES */}
      <section>
        <h2 className="text-xl font-bold text-white mb-1">Formas</h2>
        <p className="text-sm text-zinc-500 mb-4">Cada grau da escala tem uma forma geométrica fixa</p>
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

      {/* TYPOGRAPHY */}
      <section>
        <h2 className="text-xl font-bold text-white mb-1">Tipografia</h2>
        <p className="text-sm text-zinc-500 mb-4">Inter + JetBrains Mono</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-2">
            <div className="text-xs text-zinc-500 uppercase tracking-wide">Inter (principal)</div>
            <div className="text-2xl font-extrabold text-white" style={{ fontFamily: TYPOGRAPHY.fontFamily }}>
              ABCDEFGHIJKLMNOP
            </div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: TYPOGRAPHY.fontFamily }}>
              abcdefghijklmnopqrstuvwxyz
            </div>
            <div className="text-sm text-zinc-400" style={{ fontFamily: TYPOGRAPHY.fontFamily }}>
              0123456789 · !@#$%&amp;*()
            </div>
          </div>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-2">
            <div className="text-xs text-zinc-500 uppercase tracking-wide">Mono (código)</div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: TYPOGRAPHY.fontMono }}>
              c'1 d'1 e'1 f'1 g'1 a'1 b'1
            </div>
            <div className="text-sm text-zinc-400" style={{ fontFamily: TYPOGRAPHY.fontMono }}>
              !@#$% &amp;*() 0123456789
            </div>
          </div>
        </div>
      </section>

      {/* CHANNELS */}
      <section>
        <h2 className="text-xl font-bold text-white mb-1">Canais</h2>
        <p className="text-sm text-zinc-500 mb-4">Papel de cada canal no funil</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CANAIS_BRAND.map((c) => (
            <div key={c.nome} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex items-center gap-4">
              <div className="text-2xl">{c.icone}</div>
              <div>
                <div className="text-sm font-medium text-white">{c.nome}</div>
                <div className="text-xs text-zinc-500">{c.papel}</div>
              </div>
              <div className="ml-auto w-3 h-3 rounded-full shrink-0" style={{ background: c.cor }} />
            </div>
          ))}
        </div>
      </section>

      {/* USAGE */}
      <section>
        <h2 className="text-xl font-bold text-white mb-1">Aplicação</h2>
        <p className="text-sm text-zinc-500 mb-4">Como usar a identidade nos materiais</p>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-3">
              <span className="text-rng-sol shrink-0">•</span>
              <span><strong className="text-white">Fundo escuro</strong> como base (#0a0a0a). Toda interface em dark mode.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-rng-sol shrink-0">•</span>
              <span><strong className="text-white">Cores RNFG</strong> são destaque — use com moderação. Uma cor por contexto.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-rng-sol shrink-0">•</span>
              <span><strong className="text-white">Gradiente</strong> reservado para o logo e elementos especiais.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-rng-sol shrink-0">•</span>
              <span><strong className="text-white">Formas geométricas</strong> como ícones decorativos nas bordas.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-rng-sol shrink-0">•</span>
              <span>O <strong className="text-white">Sol azul (#0066FF)</strong> é a cor primária da marca — use em botões, links, destaques.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
