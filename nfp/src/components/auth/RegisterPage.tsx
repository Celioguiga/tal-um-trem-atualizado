import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { LGPD_TERMS, LGPD_VERSION, hashIp } from "../../lib/lgpd";
import { Logo } from "../brand/Logo";

type ConsentState = {
  termos_de_uso: boolean;
  politica_privacidade: boolean;
  comunicacao_marketing: boolean;
  dados_menores: boolean;
};

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [consent, setConsent] = useState<ConsentState>({
    termos_de_uso: false,
    politica_privacidade: false,
    comunicacao_marketing: false,
    dados_menores: false,
  });
  const [showTerms, setShowTerms] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleConsentToggle = (key: keyof ConsentState) => {
    setConsent((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!consent.termos_de_uso || !consent.politica_privacidade) {
      setError("Você precisa aceitar os Termos de Uso e a Política de Privacidade.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    const ipHash = hashIp("0.0.0.0"); // TODO: capturar IP real via serviço

    const consentData = {
      user_id: email,
      granted_at: new Date().toISOString(),
      ip_hash: ipHash,
      version: LGPD_VERSION,
      consents: Object.entries(consent)
        .filter(([_, v]) => v)
        .map(([k]) => k),
    };

    console.log("LGPD Consent:", consentData);
    // TODO: persistir consent_records no Supabase

    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Erro ao criar conta. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
          <div className="text-center flex flex-col items-center">
            <Logo size="lg" showTagline />
            <p className="text-zinc-400 mt-4">Crie sua conta Synemusic</p>
          </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl p-8 space-y-6 border border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Cadastro</h2>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg px-4 py-2 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1">
              Nome completo
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rng-sol"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rng-sol"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1">
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rng-sol"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300 mb-1">
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-rng-sol"
              placeholder="Repita a senha"
            />
          </div>

          {/* LGPD Consent Block */}
          <div className="border-t border-zinc-700 pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
              Consentimento LGPD · Lei 13.709/2018
            </h3>

            {Object.entries(LGPD_TERMS).map(([key, term]) => (
              <div key={key} className="space-y-1">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent[key as keyof ConsentState]}
                    onChange={() => handleConsentToggle(key as keyof ConsentState)}
                    className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-rng-sol focus:ring-rng-sol"
                  />
                  <div>
                    <span className="text-sm text-zinc-200">
                      {term.titulo}
                      {term.obrigatorio && (
                        <span className="text-rng-do ml-1">*</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTerms(showTerms === key ? null : key)}
                      className="block text-xs text-zinc-500 hover:text-zinc-300 mt-0.5"
                    >
                      {showTerms === key ? "Esconder" : "Ler na íntegra"}
                    </button>
                  </div>
                </label>
                {showTerms === key && (
                  <div className="ml-7 p-3 bg-zinc-800 rounded-lg text-xs text-zinc-400 leading-relaxed border border-zinc-700">
                    {term.texto}
                  </div>
                )}
              </div>
            ))}

            <p className="text-xs text-zinc-500">
              * Campos obrigatórios. Você pode revogar seu consentimento a qualquer
              momento nas configurações da conta.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-rng-sol text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Criar conta
          </button>

          <p className="text-center text-sm text-zinc-400">
            Já tem conta?{" "}
            <Link to="/" className="text-rng-sol hover:underline">
              Faça login
            </Link>
          </p>
        </form>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 leading-relaxed">
            <strong className="text-zinc-400">Synemusic — Proteção de Dados.</strong>{" "}
            Seus dados pessoais são tratados conforme a LGPD (Lei 13.709/2018) e o
            ECA Digital (Lei 15.211/2025). Pagamentos são processados exclusivamente
            pelo Stripe. Você tem direito a acesso, correção, eliminação e portabilidade
            dos seus dados. DPO: Célio Guiga — privacidade@synemusic.com.br.
          </p>
        </div>
      </div>
    </div>
  );
}
