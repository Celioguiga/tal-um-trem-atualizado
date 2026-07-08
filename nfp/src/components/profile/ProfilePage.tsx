import { useState } from "react";
import { AppLayout } from "../layout/AppLayout";
import { useAuth } from "../../lib/auth";
import { LGPD_TERMS, LGPD_VERSION } from "../../lib/lgpd";

export function ProfilePage() {
  const { user, togglePlan } = useAuth();

  const [consentEnabled, setConsentEnabled] = useState({
    comunicacao_marketing: true,
    dados_menores: false,
  });

  const handleToggle = (key: keyof typeof consentEnabled) => {
    setConsentEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AppLayout title="Perfil e Privacidade">
      <div className="max-w-2xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Perfil</h2>
          <p className="text-zinc-400 mt-1">Suas informações e preferências</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Dados da conta</h3>
          <div className="text-sm space-y-3">
            <div>
              <span className="text-zinc-500">Nome</span>
              <p className="text-zinc-200">{user?.name}</p>
            </div>
            <div>
              <span className="text-zinc-500">Email</span>
              <p className="text-zinc-200">{user?.email}</p>
            </div>
            <div>
              <span className="text-zinc-500">Plano</span>
              <p className="text-zinc-200 capitalize">{user?.plan}</p>
            </div>
            {user?.plan === "free" && (
              <div className="pt-2">
                <a href="#" onClick={(e) => { e.preventDefault(); togglePlan(); }}
                  className="inline-block text-xs px-3 py-1.5 rounded font-medium transition-colors"
                  style={{ background: "#0066FF20", color: "#0066FF" }}
                >
                  ⚡ Ativar Essencial (Hotmart — em breve)
                </a>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  Plano Essencial: R$97/mês · compassos ilimitados · todas as cantigas ·
                  exportação MIDI/WAV · prioridade em novas features.
                </p>
              </div>
            )}
            {user?.plan === "essencial" && (
              <div className="pt-2">
                <a href="#" onClick={(e) => { e.preventDefault(); togglePlan(); }}
                  className="inline-block text-xs px-3 py-1.5 rounded font-medium transition-colors"
                  style={{ background: "#00B05020", color: "#00B050" }}
                >
                  🔄 Voltar para Free (dev toggle)
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="text-white font-semibold">Gestão de Consentimento LGPD</h3>
          <p className="text-xs text-zinc-500">
            Versão {LGPD_VERSION} · Você pode revogar ou ajustar seu consentimento
            a qualquer momento.
          </p>

          <div className="space-y-3">
            {Object.entries(LGPD_TERMS).map(([key, term]) => {
              if (key === "termos_de_uso" || key === "politica_privacidade") {
                return (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-zinc-800">
                    <div>
                      <span className="text-sm text-zinc-300">{term.titulo}</span>
                      <p className="text-xs text-zinc-600">Aceito — obrigatório</p>
                    </div>
                    <span className="text-xs text-rng-fa bg-rng-fa/10 px-2.5 py-1 rounded-full">
                      Ativo
                    </span>
                  </div>
                );
              }

              const isChecked = consentEnabled[key as keyof typeof consentEnabled];

              return (
                <label
                  key={key}
                  className="flex items-center justify-between py-2 border-b border-zinc-800 cursor-pointer"
                >
                  <div className="flex-1">
                    <span className="text-sm text-zinc-300">{term.titulo}</span>
                    <p className="text-xs text-zinc-500 mt-0.5">{term.texto.slice(0, 80)}…</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isChecked}
                    onClick={() => handleToggle(key as keyof typeof consentEnabled)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      isChecked ? "bg-rng-sol" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        isChecked ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </label>
              );
            })}
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 text-xs text-zinc-400 leading-relaxed">
            <strong className="text-zinc-300">Seus direitos LGPD:</strong><br />
            • Acessar, corrigir e solicitar exclusão dos seus dados<br />
            • Revogar o consentimento a qualquer momento<br />
            • Solicitar portabilidade dos dados<br />
            • DPO: Célio Guiga — privacidade@synemusic.com.br
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
