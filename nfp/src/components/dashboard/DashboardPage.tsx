import { AppLayout } from "../layout/AppLayout";

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
  return (
    <AppLayout title="Dashboard">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Bem-vindo ao Note Form Pro
          </h2>
          <p className="text-zinc-400 mt-1">
            Ecossistema Synemusic — Metodologia Real Nota Grau
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className={`${card.bg} ${card.border} border rounded-xl p-6 space-y-3 hover:brightness-110 transition-all`}
            >
              <div className={`w-10 h-10 rounded-lg ${card.bg} border ${card.border} flex items-center justify-center`}>
                <span className={`text-lg ${card.color}`}>{card.icon}</span>
              </div>
              <h3 className="font-semibold text-white">{card.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-2">Metodologia RNG</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            <strong className="text-zinc-300">Real Nota Forma Grau.</strong>{" "}
            Cada nota tem cor fixa, cada grau tem forma geométrica fixa.
            Com a tonalidade, as formas rotacionam e as cores acompanham as notas.
            O Note Form Pro é o grimório digital da RNG — o instrumento de
            trabalho do professor em sala de aula ao vivo.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
