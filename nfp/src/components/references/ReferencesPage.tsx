import { useEffect, useState } from "react";
import { api, type Reference } from "../../lib/api";
import { useTheme } from "../../lib/theme";

export function ReferencesPage() {
  const { vars } = useTheme();
  const [refs, setRefs] = useState<Reference[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.references().then(setRefs).catch(console.error).finally(() => setLoading(false));
  }, []);

  const openRef = async (name: string) => {
    setSelected(name);
    const data = await api.getReference(name);
    setContent(data.content);
  };

  if (loading) return <div style={{ color: vars["--textDim"] }}>Carregando...</div>;

  return (
    <div className="space-y-6 p-8" style={{ color: vars["--text"] }}>
      <div>
        <h2 className="text-2xl font-bold">Referências</h2>
        <p className="mt-1" style={{ color: vars["--textDim"] }}>Pilares, ângulos, canais e cadência</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {refs.map((r) => (
            <button
              key={r.name}
              onClick={() => openRef(r.name)}
              className="w-full text-left px-4 py-3 rounded-lg text-sm transition-colors"
              style={{
                background: selected === r.name ? vars["--surface2"] : vars["--surface"],
                color: selected === r.name ? vars["--accent"] : vars["--textDim"],
                border: `1px solid ${selected === r.name ? vars["--accent"] : vars["--border"]}`,
              }}
            >
              <div className="font-medium">{r.name.replace(".md", "")}</div>
              <div className="text-xs mt-0.5" style={{ color: vars["--textMuted"] }}>
                {new Date(r.mtime * 1000).toLocaleDateString("pt-BR")}
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="rounded-xl p-6" style={{ background: vars["--surface"], border: `1px solid ${vars["--border"]}` }}>
              <h3 className="font-semibold mb-4 text-lg">{selected.replace(".md", "")}</h3>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed" style={{ color: vars["--textDim"] }}>
                {content}
              </pre>
            </div>
          ) : (
            <div className="rounded-xl flex items-center justify-center h-64" style={{ background: vars["--surface"], border: `1px solid ${vars["--border"]}` }}>
              <p style={{ color: vars["--textMuted"] }}>Selecione um arquivo ao lado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
