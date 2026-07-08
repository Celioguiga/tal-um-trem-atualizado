import { useTheme } from "../../lib/theme";

const cards = [
  {
    title: "Note Form Pro",
    desc: "Editor RNG com projeção em sala, ditado ao vivo e modo expositivo.",
    icon: "♩",
    color: "text-rng-sol",
    bg: "bg-rng-sol/5",
    border: "border-rng-sol/20",
  },
  {
    title: "Maestro IA",
    desc: "Tutor socrático — nunca dá respostas, guia por perguntas.",
    icon: "◆",
    color: "text-rng-do",
    bg: "bg-rng-do/5",
    border: "border-rng-do/20",
  },
  {
    title: "SalierIA",
    desc: "Co-criador musical — cantarole uma ideia e ganhe a partitura.",
    icon: "✦",
    color: "text-rng-mi",
    bg: "bg-rng-mi/5",
    border: "border-rng-mi/20",
  },
  {
    title: "Transcrição Universal",
    desc: "Converta PDF/imagem (OMR) ou áudio (AMT) para Sintaxe Cromus.",
    icon: "⇄",
    color: "text-rng-fa",
    bg: "bg-rng-fa/5",
    border: "border-rng-fa/20",
  },
  {
    title: "O Pássaro Mágico",
    desc: "Jogo de ritmo tipo Highway com as Rainhas Fadas da RNG.",
    icon: "▶",
    color: "text-rng-la",
    bg: "bg-rng-la/5",
    border: "border-rng-la/20",
  },
  {
    title: "Ativos Presenciais",
    desc: "Roda Música (13+) e Clube da Música (5-12) — Camada IX.",
    icon: "♫",
    color: "text-rng-si",
    bg: "bg-rng-si/5",
    border: "border-rng-si/20",
  },
];

export function DashboardPage() {
  const { vars } = useTheme();
  return (
    <div className="space-y-8 p-8" style={{ color: vars["--text"] }}>
      <div>
        <h2 className="text-2xl font-bold">Bem-vindo ao Note Form Pro</h2>
        <p className="mt-1" style={{ color: vars["--textDim"] }}>
          Ecossistema Synemusic — Metodologia Real Nota Grau
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`${card.bg} ${card.border} border rounded-xl p-6 space-y-3`}
          >
            <div className={`w-10 h-10 rounded-lg ${card.bg} border ${card.border} flex items-center justify-center`}>
              <span className={`text-lg ${card.color}`}>{card.icon}</span>
            </div>
            <h3 className="font-semibold" style={{ color: vars["--text"] }}>{card.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: vars["--textDim"] }}>{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-6" style={{ background: vars["--surface"], border: `1px solid ${vars["--border"]}` }}>
        <h3 className="font-semibold mb-2" style={{ color: vars["--text"] }}>Metodologia RNG</h3>
        <p className="text-sm leading-relaxed" style={{ color: vars["--textDim"] }}>
          <strong style={{ color: vars["--text"] }}>Real Nota Forma Grau.</strong>{" "}
          Cada nota tem cor fixa, cada grau tem forma geométrica fixa.
          Com a tonalidade, as formas rotacionam e as cores acompanham as notas.
          O Note Form Pro é o grimório digital da RNG — o instrumento de
          trabalho do professor em sala de aula ao vivo.
        </p>
      </div>
    </div>
  );
}
