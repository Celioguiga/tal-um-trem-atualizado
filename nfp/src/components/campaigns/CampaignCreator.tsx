import { useState } from "react";
import { api } from "../../lib/api";
import { useNavigate } from "react-router-dom";

const PILLARS = [
  "O Que É RNFG", "RNFG Decodifica", "Na Sala de Aula",
  "Por Que Funciona", "Nos Bastidores", "Lançamentos e Produtos",
];

export function CampaignCreator() {
  const [theme, setTheme] = useState("");
  const [pillar, setPillar] = useState(PILLARS[0]);
  const [target, setTarget] = useState("A Dona Aranha (grátis)");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!theme.trim()) { setError("Digite o tema-âncora da campanha"); return; }
    setError("");
    setGenerating(true);
    try {
      const result = await api.generateCampanha(theme.trim(), pillar, target);
      if (result.saved) {
        navigate(`/app/campanhas?open=${result.name}`);
      }
    } catch (e) {
      setError("Erro ao gerar campanha");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 space-y-5">
      <div>
        <h3 className="font-semibold text-lg">Criar Nova Campanha</h3>
        <p className="text-sm text-zinc-500 mt-1">Um insight → várias peças, cada canal no seu formato e papel de funil</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tema-âncora</label>
        <input
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="Ex: RNFG decodifica Asa Branca"
          className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rng-sol"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Pilar RNFG</label>
          <select
            value={pillar}
            onChange={(e) => setPillar(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rng-sol"
          >
            {PILLARS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Lead / Produto</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rng-sol"
          >
            <option>A Dona Aranha (grátis)</option>
            <option>Peixe Vivo (Hotmart R$17)</option>
            <option>Caranguejo (Hotmart R$17)</option>
            <option>Newsletter Synemusic</option>
            <option>Curso RNFG (em breve)</option>
          </select>
        </div>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full py-2.5 bg-rng-sol text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {generating ? "Gerando campanha..." : "Gerar Campanha"}
      </button>

      <div className="text-xs text-zinc-600 leading-relaxed border-t border-zinc-800 pt-4">
        <strong className="text-zinc-400">O que será gerado:</strong><br />
        Base (Blog/SEO) → YouTube → Facebook → Instagram (Carrossel + Reels + Stories)<br />
        Cada peça com CTA encadeado no funil. Arquivo salvo em campanhas/.
      </div>
    </div>
  );
}
