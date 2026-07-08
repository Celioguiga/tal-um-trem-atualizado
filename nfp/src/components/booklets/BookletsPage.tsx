import { useEffect, useState } from "react";
import { api, type Booklet } from "../../lib/api";
import { useTheme } from "../../lib/theme";

export function BookletsPage() {
  const { vars } = useTheme();
  const [booklets, setBooklets] = useState<Booklet[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [msg, setMsg] = useState("");

  const load = () =>
    api.booklets().then(setBooklets).catch(console.error).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    setMsg("");
    const res = await api.regenerateBooklets();
    if (res.success) {
      setMsg("Booklets regenerados com sucesso!");
      load();
    } else {
      setMsg(`Erro: ${res.stderr || res.error || "desconhecido"}`);
    }
    setRegenerating(false);
  };

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    return `${(bytes / 1024).toFixed(0)}KB`;
  }

  function formatDate(ts: number): string {
    return new Date(ts * 1000).toLocaleDateString("pt-BR");
  }

  if (loading) return <div style={{ color: vars["--textDim"] }}>Carregando...</div>;

  return (
    <div className="space-y-6 p-8" style={{ color: vars["--text"] }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Booklets</h2>
          <p className="mt-1" style={{ color: vars["--textDim"] }}>Gerencie os booklets RNFG</p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          style={{ background: vars["--accent"], color: "#fff" }}
        >
          {regenerating ? "Regenerando..." : "Regenerar Todos"}
        </button>
      </div>

      {msg && (
        <div className="px-4 py-3 rounded-lg text-sm"
          style={{
            background: msg.startsWith("Erro") ? "#C0001A20" : "#00B05020",
            color: msg.startsWith("Erro") ? "#C0001A" : "#00B050"
          }}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {booklets.map((b) => (
          <div key={b.slug} className="rounded-xl overflow-hidden"
            style={{ background: vars["--surface"], border: `1px solid ${vars["--border"]}` }}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg">{b.name}</h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: b.free ? "#F0730020" : "#00B05020", color: b.free ? "#F07300" : "#00B050" }}>
                  {b.price}
                </span>
              </div>
              <div className="text-sm space-y-1" style={{ color: vars["--textDim"] }}>
                <div>{formatSize(b.size)} · {formatDate(b.mtime)}</div>
              </div>
            </div>
            <div className="px-6 py-3 flex gap-3" style={{ borderTop: `1px solid ${vars["--border"]}` }}>
              <a
                href={api.pdfUrl(b.filename)}
                target="_blank"
                className="text-sm hover:underline"
                style={{ color: vars["--accent"] }}
              >
                Abrir PDF →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
