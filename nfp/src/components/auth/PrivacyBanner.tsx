import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { LGPD_VERSION, LGPD_TERMS } from "../../lib/lgpd";

const STORAGE_KEY = "synemusic_consent";

type ConsentStore = {
  accepted: boolean;
  version: string;
  accepted_at: string;
  consented_types: string[];
};

function loadConsent(): ConsentStore | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveConsent(consentedTypes: string[]) {
  const record: ConsentStore = {
    accepted: true,
    version: LGPD_VERSION,
    accepted_at: new Date().toISOString(),
    consented_types: consentedTypes,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  return record;
}

export function useConsent() {
  const [store, setStore] = useState<ConsentStore | null>(loadConsent);
  const [showModal, setShowModal] = useState(!store?.accepted);
  const [checked, setChecked] = useState<string[]>(() => store?.consented_types ?? []);

  useEffect(() => {
    if (store?.accepted) {
      setShowModal(false);
    }
  }, [store]);

  const accept = () => {
    const newStore = saveConsent(checked);
    setStore(newStore);
    setShowModal(false);
  };

  const decline = () => {
    const newStore = saveConsent([]);
    setStore(newStore);
    setShowModal(true);
  };

  const toggleCheck = (key: string) => {
    setChecked((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return { showModal, checked, toggleCheck, accept, decline };
}

export function PrivacyBanner({ children }: { children: ReactNode }) {
  const { showModal, checked, toggleCheck, accept } = useConsent();

  const mandatoryKeys = Object.entries(LGPD_TERMS)
    .filter(([_, v]) => v.obrigatorio)
    .map(([k]) => k);

  const hasMandatory = mandatoryKeys.every((k) => checked.includes(k));

  if (!showModal) return <>{children}</>;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-8 space-y-6 shadow-2xl">
          <div className="text-center">
            <div className="w-12 h-12 bg-rng-sol/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-rng-sol text-2xl">🔒</span>
            </div>
            <h2 className="text-xl font-bold text-white">Privacidade e Proteção de Dados</h2>
            <p className="text-sm text-zinc-400 mt-1">
              A Synemusic trata seus dados pessoais conforme a LGPD (Lei 13.709/2018)
            </p>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 space-y-2 text-sm text-zinc-300">
            <p>
              <strong className="text-white">Dados coletados:</strong> nome, email, progresso
              pedagógico. Pagamentos processados exclusivamente pelo Stripe — nunca
              armazenamos dados de cartão.
            </p>
            <p>
              <strong className="text-white">Seus direitos:</strong> acessar, corrigir, eliminar
              e portar seus dados a qualquer momento.
            </p>
            <p className="text-xs text-zinc-500">
              DPO: Célio Guiga — privacidade@synemusic.com.br
            </p>
          </div>

          <div className="space-y-3">
            {Object.entries(LGPD_TERMS).map(([key, term]) => {
              const isChecked = checked.includes(key);
              return (
                <label key={key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCheck(key)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-rng-sol focus:ring-rng-sol"
                  />
                  <div>
                    <span className="text-sm text-zinc-200">
                      {term.titulo}
                      {term.obrigatorio && <span className="text-rng-do ml-1">*</span>}
                    </span>
                    <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                      {term.texto.slice(0, 120)}…
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="text-xs text-zinc-500 text-center">
            <Link to="/consentimento" className="underline hover:text-zinc-300">
              Política de Privacidade completa
            </Link>
          </div>

          <button
            onClick={accept}
            disabled={!hasMandatory}
            className="w-full py-3 px-4 bg-rng-sol text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {hasMandatory ? "Aceitar e continuar" : "Aceite os termos obrigatórios (*) para continuar"}
          </button>

          <p className="text-xs text-zinc-500 text-center leading-relaxed">
            Ao aceitar, você concorda com a coleta e tratamento dos seus dados pessoais
            conforme descrito acima. Você pode revogar seu consentimento a qualquer momento
            nas configurações da conta.
          </p>
        </div>
      </div>
      {children}
    </>
  );
}
