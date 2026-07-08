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

    const ipHash = hashIp("0.0.0.0");
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

    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Erro ao criar conta. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-12"
      style={{ background: "#141009" }}
    >
      <div className="w-full max-w-md space-y-8">
        <div className="text-center flex flex-col items-center gap-2">
          <Logo size="lg" showTagline />
          <p style={{ color: "#A69B85", fontSize: "0.9rem" }}>Crie sua conta Synemusic</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl p-8 space-y-6"
          style={{ background: "#1A1610", border: "1px solid #2A241A" }}
        >
          <h2 className="text-xl font-semibold" style={{ color: "#F5F2EA", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Cadastro
          </h2>

          {error && (
            <div className="rounded-lg px-4 py-2 text-sm" style={{ background: "#C0001A20", border: "1px solid #C0001A40", color: "#C0001A" }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#A69B85" }}>
              Nome completo
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ background: "#141009", border: "1px solid #2A241A", color: "#F5F2EA" }}
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#A69B85" }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ background: "#141009", border: "1px solid #2A241A", color: "#F5F2EA" }}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#A69B85" }}>
              Senha
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ background: "#141009", border: "1px solid #2A241A", color: "#F5F2EA" }}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "#A69B85" }}>
              Confirmar senha
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
              style={{ background: "#141009", border: "1px solid #2A241A", color: "#F5F2EA" }}
              placeholder="Repita a senha"
            />
          </div>

          <div className="pt-6 space-y-4" style={{ borderTop: "1px solid #2A241A" }}>
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "#A69B85" }}>
              Consentimento LGPD · Lei 13.709/2018
            </h3>

            {Object.entries(LGPD_TERMS).map(([key, term]) => (
              <div key={key} className="space-y-1">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent[key as keyof ConsentState]}
                    onChange={() => handleConsentToggle(key as keyof ConsentState)}
                    className="mt-0.5 h-4 w-4 rounded"
                    style={{ accentColor: "#0066FF" }}
                  />
                  <div>
                    <span className="text-sm" style={{ color: "#D4CDBF" }}>
                      {term.titulo}
                      {term.obrigatorio && (
                        <span style={{ color: "#C0001A" }} className="ml-1">*</span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTerms(showTerms === key ? null : key)}
                      className="block text-xs mt-0.5"
                      style={{ color: "#6F664F" }}
                    >
                      {showTerms === key ? "Esconder" : "Ler na íntegra"}
                    </button>
                  </div>
                </label>
                {showTerms === key && (
                  <div className="ml-7 p-3 rounded-lg text-xs leading-relaxed"
                    style={{ background: "#141009", border: "1px solid #2A241A", color: "#A69B85" }}
                  >
                    {term.texto}
                  </div>
                )}
              </div>
            ))}

            <p className="text-xs" style={{ color: "#6F664F" }}>
              * Campos obrigatórios. Você pode revogar seu consentimento a qualquer
              momento nas configurações da conta.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 font-medium rounded-lg transition-colors text-sm"
            style={{ background: "#0066FF", color: "#F5F2EA" }}
          >
            Criar conta
          </button>

          <p className="text-center text-sm" style={{ color: "#6F664F" }}>
            Já tem conta?{" "}
            <Link to="/" style={{ color: "#0066FF" }}>
              Faça login
            </Link>
          </p>
        </form>

        <div className="rounded-lg p-4" style={{ background: "#1A1610", border: "1px solid #2A241A" }}>
          <p className="text-xs leading-relaxed" style={{ color: "#6F664F" }}>
            <strong style={{ color: "#A69B85" }}>Synemusic — Proteção de Dados.</strong>{" "}
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
