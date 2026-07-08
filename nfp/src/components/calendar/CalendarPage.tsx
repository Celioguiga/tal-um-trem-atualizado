import { useEffect, useState } from "react";
import { api, type Campaign } from "../../lib/api";
import { useTheme } from "../../lib/theme";

const WEEK = [
  { dia: "Segunda", pilar: "Avaliação / Planejamento", canal: "Interno", cor: "surface" },
  { dia: "Terça", pilar: "RNFG Decodifica", canal: "Instagram (Reels) + YouTube", cor: "si" },
  { dia: "Quarta", pilar: "Sala de Aula / Por Que Funciona", canal: "Instagram (Carrossel)", cor: "surface" },
  { dia: "Quinta", pilar: "O Que É RNFG / Bastidores", canal: "Facebook + Newsletter", cor: "surface" },
  { dia: "Sexta", pilar: "Lançamentos e Produtos", canal: "Instagram + Blog", cor: "fa" },
  { dia: "Sábado", pilar: "Engajamento", canal: "Instagram Stories", cor: "surface" },
];

export function CalendarPage() {
  const { vars } = useTheme();
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
    <div className="space-y-6 p-8" style={{ color: vars["--text"] }}>
      <div>
        <h2 className="text-2xl font-bold">Calendário de Conteúdo</h2>
        <p className="mt-1" style={{ color: vars["--textDim"] }}>
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
              className="rounded-xl border p-4"
              style={{
                background: isToday ? vars["--surface2"] : vars["--surface"],
                borderColor: isToday ? vars["--accent"] : vars["--border"],
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: vars["--textDim"] }}>
                  {day.dia.slice(0, 3)}
                </span>
                {date && (
                  <span className="text-xs" style={{ color: isToday ? vars["--accent"] : vars["--textMuted"] }}>
                    {date.getDate()}/{date.getMonth() + 1}
                  </span>
                )}
              </div>

              <div className="text-sm font-medium mb-1" style={{ color: isToday ? vars["--text"] : vars["--textDim"] }}>
                {day.pilar}
              </div>

              <div className="text-xs mb-4" style={{ color: vars["--textMuted"] }}>{day.canal}</div>

              <div className="text-xs" style={{ color: vars["--textMuted"] }}>
                {day.dia === "Terça" && (
                  <span style={{ color: vars["--accent"] }}>Série: RNFG Decodifica</span>
                )}
                {day.dia === "Sexta" && campanhas.length > 0 && (
                  <div>
                    <div className="mb-1" style={{ color: vars["--textDim"] }}>Campanhas:</div>
                    {campanhas.slice(0, 2).map((c) => (
                      <div key={c.name} className="truncate" style={{ color: vars["--textMuted"] }}>
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

      <div className="rounded-xl p-6" style={{ background: vars["--surface"], border: `1px solid ${vars["--border"]}` }}>
        <h3 className="font-semibold mb-4">Horário Fixo de Criação</h3>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-lg font-bold" style={{ background: vars["--surface2"], color: vars["--accent"] }}>
            08:00 — 09:00
          </div>
          <span className="text-sm" style={{ color: vars["--textDim"] }}>Produção diária de conteúdo</span>
        </div>
      </div>

      <div className="rounded-xl p-6" style={{ background: vars["--surface"], border: `1px solid ${vars["--border"]}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Próximas Campanhas na Grade</h3>
        </div>
        {loading ? (
          <p className="text-sm" style={{ color: vars["--textMuted"] }}>Carregando...</p>
        ) : campanhas.length === 0 ? (
          <p className="text-sm" style={{ color: vars["--textMuted"] }}>Nenhuma campanha ainda. Crie uma na aba Campanhas.</p>
        ) : (
          <div className="space-y-2">
            {campanhas.map((c) => (
              <div key={c.name} className="flex items-center justify-between rounded-lg px-4 py-2.5" style={{ background: vars["--surface2"] }}>
                <div>
                  <div className="text-sm" style={{ color: vars["--textDim"] }}>{c.name.replace(".md", "").replace(/_/g, " ")}</div>
                  <div className="text-xs" style={{ color: vars["--textMuted"] }}>
                    Criada em {new Date(c.mtime * 1000).toLocaleDateString("pt-BR")}
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded" style={{ background: vars["--surface"], color: vars["--textMuted"] }}>Pronta</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
