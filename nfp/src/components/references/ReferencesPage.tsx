import { useEffect, useState } from "react";
import { api, type Reference } from "../../lib/api";

export function ReferencesPage() {
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

  if (loading) return <div className="text-zinc-500">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Referências</h2>
        <p className="text-zinc-500 mt-1">Pilares, ângulos, canais e cadência</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {refs.map((r) => (
            <button
              key={r.name}
              onClick={() => openRef(r.name)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                selected === r.name
                  ? "bg-rng-sol/10 text-rng-sol border border-rng-sol/30"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="font-medium">{r.name.replace(".md", "")}</div>
              <div className="text-xs text-zinc-600 mt-0.5">
                {new Date(r.mtime * 1000).toLocaleDateString("pt-BR")}
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h3 className="font-semibold mb-4 text-lg">{selected.replace(".md", "")}</h3>
              <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
                {content}
              </pre>
            </div>
          ) : (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 flex items-center justify-center h-64">
              <p className="text-zinc-600">Selecione um arquivo ao lado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
