import { useEffect, useState } from "react";
import { api, type Campaign } from "../../lib/api";

const WEEK = [
  { dia: "Segunda", pilar: "Avaliação / Planejamento", canal: "Interno", cor: "bg-zinc-800" },
  { dia: "Terça", pilar: "RNFG Decodifica", canal: "Instagram (Reels) + YouTube", cor: "bg-rng-si/20 text-rng-si" },
  { dia: "Quarta", pilar: "Sala de Aula / Por Que Funciona", canal: "Instagram (Carrossel)", cor: "bg-zinc-800" },
  { dia: "Quinta", pilar: "O Que É RNFG / Bastidores", canal: "Facebook + Newsletter", cor: "bg-zinc-800" },
  { dia: "Sexta", pilar: "Lançamentos e Produtos", canal: "Instagram + Blog", cor: "bg-rng-fa/20 text-rng-fa" },
  { dia: "Sábado", pilar: "Engajamento", canal: "Instagram Stories", cor: "bg-zinc-800" },
];

export function CalendarPage() {
  const [campanhas, setCampanhas] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.campanhas().then(setCampanhas).catch(console.error).finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);
  const weekDates = WEEK.map((_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Calendário de Conteúdo</h2>
        <p className="text-zinc-500 mt-1">
          Semana de {weekDates[0]?.toLocaleDateString("pt-BR")} — {weekDates[4]?.toLocaleDateString("pt-BR")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {WEEK.map((day, i) => {
          const date = weekDates[i];
          const isToday = date?.toDateString() === today.toDateString();
          return (
            <div
              key={day.dia}
              className={`rounded-xl border ${
                isToday ? "border-rng-sol/50 bg-rng-sol/5" : "border-zinc-800 bg-zinc-900"
              } p-4`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  {day.dia.slice(0, 3)}
                </span>
                {date && (
                  <span className={`text-xs ${isToday ? "text-rng-sol font-bold" : "text-zinc-600"}`}>
                    {date.getDate()}/{date.getMonth() + 1}
                  </span>
                )}
              </div>

              <div className={`text-sm font-medium mb-1 ${isToday ? "text-white" : "text-zinc-200"}`}>
                {day.pilar}
              </div>

              <div className="text-xs text-zinc-500 mb-4">{day.canal}</div>

              <div className="text-xs text-zinc-600">
                {day.dia === "Terça" && (
                  <span className="text-rng-si">Série: RNFG Decodifica</span>
                )}
                {day.dia === "Sexta" && campanhas.length > 0 && (
                  <div>
                    <div className="text-zinc-500 mb-1">Campanhas:</div>
                    {campanhas.slice(0, 2).map((c) => (
                      <div key={c.name} className="text-zinc-400 truncate">
                        • {c.name.replace(".md", "").replace(/_/g, " ")}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h3 className="font-semibold mb-4">Horário Fixo de Criação</h3>
        <div className="flex items-center gap-4">
          <div className="bg-zinc-800 px-4 py-2 rounded-lg text-rng-sol font-bold">08:00 — 09:00</div>
          <span className="text-sm text-zinc-400">Produção diária de conteúdo</span>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Próximas Campanhas na Grade</h3>
        </div>
        {loading ? (
          <p className="text-zinc-600 text-sm">Carregando...</p>
        ) : campanhas.length === 0 ? (
          <p className="text-zinc-600 text-sm">Nenhuma campanha ainda. Crie uma na aba Campanhas.</p>
        ) : (
          <div className="space-y-2">
            {campanhas.map((c) => (
              <div key={c.name} className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-2.5">
                <div>
                  <div className="text-sm text-zinc-200">{c.name.replace(".md", "").replace(/_/g, " ")}</div>
                  <div className="text-xs text-zinc-600">
                    Criada em {new Date(c.mtime * 1000).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">Pronta</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
