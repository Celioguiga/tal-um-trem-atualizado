import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { api, type Campaign } from "../../lib/api";
import { CampaignCreator } from "./CampaignCreator";
import { useTheme } from "../../lib/theme";

export function CampaignsPage() {
  const { vars } = useTheme();
  const [campanhas, setCampanhas] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [msg, setMsg] = useState("");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [searchParams] = useSearchParams();

  const load = () =>
    api.campanhas().then(setCampanhas).catch(console.error).finally(() => setLoading(false));

  useEffect(() => {
    load().then(() => {
      const open = searchParams.get("open");
      if (open) openCampanha(open);
    });
  }, []);

  const openCampanha = async (name: string) => {
    setSelected(name);
    setEditing(false);
    const data = await api.getCampanha(name);
    setContent(data.content);
    setEditContent(data.content);
  };

  const handleEdit = () => {
    setEditing(true);
    setEditContent(content);
    setTimeout(() => editorRef.current?.focus(), 100);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.saveCampanha(selected, editContent);
      setContent(editContent);
      setEditing(false);
      setMsg("Salvo!");
      setTimeout(() => setMsg(""), 2000);
    } catch {
      setMsg("Erro ao salvar");
    }
    setSaving(false);
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Deletar ${name}?`)) return;
    await api.deleteCampanha(name);
    if (selected === name) { setSelected(null); setContent(""); }
    load();
  };

  if (loading) return <div style={{ color: vars["--textDim"] }}>Carregando...</div>;

  return (
    <div className="space-y-6 p-8" style={{ color: vars["--text"] }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campanhas</h2>
          <p className="mt-1" style={{ color: vars["--textDim"] }}>Gerencie campanhas multicanal do Funil Synemusic</p>
        </div>
        <button
          onClick={() => setShowCreator(!showCreator)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: vars["--accent"], color: "#fff" }}
        >
          {showCreator ? "Fechar" : "+ Nova Campanha"}
        </button>
      </div>

      {showCreator && <CampaignCreator />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {campanhas.length === 0 && (
            <p className="py-4 text-sm" style={{ color: vars["--textMuted"] }}>Nenhuma campanha ainda. Crie a primeira!</p>
          )}
          {campanhas.map((c) => (
            <div
              key={c.name}
              className="group rounded-lg border transition-colors"
              style={{
                background: selected === c.name ? vars["--accentGlow"] : vars["--surface"],
                borderColor: selected === c.name ? vars["--accent"] : vars["--border"],
              }}
            >
              <button
                onClick={() => openCampanha(c.name)}
                className="w-full text-left px-4 py-3"
              >
                <div className="text-sm font-medium">
                  {c.name.replace(".md", "").replace(/_/g, " ")}
                </div>
                <div className="text-xs mt-0.5" style={{ color: vars["--textMuted"] }}>
                  {new Date(c.mtime * 1000).toLocaleDateString("pt-BR")} · {(c.size / 1024).toFixed(0)}KB
                </div>
              </button>
              <div className="px-4 pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDelete(c.name)}
                  className="text-xs transition-colors"
                  style={{ color: "#C0001A" }}
                >
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          {msg && (
            <div className="mb-3 px-4 py-2 rounded-lg text-sm" style={{ background: "#00B05020", color: "#00B050" }}>
              {msg}
            </div>
          )}
          {selected ? (
            <div className="rounded-xl overflow-hidden" style={{ background: vars["--surface"], border: `1px solid ${vars["--border"]}` }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${vars["--border"]}` }}>
                <h3 className="font-semibold">{selected.replace(".md", "").replace(/_/g, " ")}</h3>
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-3 py-1.5 text-xs rounded-lg disabled:opacity-50"
                        style={{ background: "#00B050", color: "#fff" }}
                      >
                        {saving ? "Salvando..." : "Salvar"}
                      </button>
                      <button
                        onClick={() => { setEditing(false); setEditContent(content); }}
                        className="px-3 py-1.5 text-xs rounded-lg"
                        style={{ background: vars["--surface2"], color: vars["--textDim"] }}
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="px-3 py-1.5 text-xs rounded-lg"
                      style={{ background: vars["--surface2"], color: vars["--textDim"] }}
                    >
                      Editar
                    </button>
                  )}
                </div>
              </div>
              {editing ? (
                <textarea
                  ref={editorRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-[65vh] text-sm font-mono p-6 focus:outline-none resize-none border-0"
                  style={{ background: vars["--bg"], color: vars["--text"] }}
                />
              ) : (
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed p-6 max-h-[70vh] overflow-y-auto" style={{ color: vars["--text"] }}>
                  {content}
                </pre>
              )}
            </div>
          ) : (
            <div
              className="rounded-xl flex items-center justify-center h-64"
              style={{ background: vars["--surface"], border: `1px solid ${vars["--border"]}` }}
            >
              <p style={{ color: vars["--textDim"] }}>Selecione uma campanha ao lado ou crie uma nova</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
