import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { PrivacyBanner } from "./PrivacyBanner";
import { SYMUSIC } from "../../lib/brand";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/app");
    } catch {
      setError("Email ou senha inválidos.");
    }
  };

  return (
    <PrivacyBanner>
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#FFFFFF" }}
      >
        <div className="w-full max-w-md space-y-8">
          {/* Synemusic — marca-mãe do ecossistema */}
          <div className="flex justify-center">
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full"
              style={{ background: "#E8A82008", border: "1px solid #E8A82020" }}
            >
              <svg width="18" height="18" viewBox="0 0 100 100">
                <path d="M 20 60 C 31.11 42.2 42.22 26 53.33 26 C 64.44 26 75.56 42.2 86.67 60 C 97.78 77.8 108.89 94 120 94 C 131.11 94 142.22 77.8 153.33 60 C 164.44 42.2 175.56 26 186.67 26 C 197.78 26 208.89 42.2 220 60"
                  fill="none" stroke="#E8A820" strokeWidth="6" transform="scale(0.4) translate(-10,-10)" />
              </svg>
              <span className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: "#E8A820" }}
              >Synemusic</span>
            </div>
          </div>

          <div className="text-center flex flex-col items-center gap-5">
            <img src="/logo.png" alt="Note Form Pro" className="h-36 w-auto" />

            <div>
              <div className="text-3xl font-semibold tracking-tight" style={{ color: "#1A2A3A", fontFamily: "'DM Sans', sans-serif" }}>
                synemusic
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", fontSize: "1.4rem", color: "#E8A820" }}>
                {SYMUSIC.tagline}
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full"
              style={{ background: "#E8A82015", border: "1px solid #E8A82030" }}
            >
              <svg width="16" height="16" viewBox="0 0 100 100" style={{ color: "#E8A820" }}>
                <polygon points="50,10 59.4,37.06 88.04,37.64 65.22,54.94 73.51,82.36 50,66 26.49,82.36 34.78,54.94 11.96,37.64 40.6,37.06" fill="currentColor" />
              </svg>
              <span className="text-[11px] font-medium tracking-wider uppercase"
                style={{ color: "#E8A820" }}
              >Christicho — o som dourado</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-xl p-8 space-y-6"
            style={{ background: "#F5F7FA", border: "1px solid #D0D8E0" }}
          >
            <h2 className="text-xl font-semibold" style={{ color: "#1A2A3A", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Entrar no Note Form Pro
            </h2>

            {error && (
              <div className="rounded-lg px-4 py-2 text-sm" style={{ background: "#C0001A15", border: "1px solid #C0001A30", color: "#C0001A" }}>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: "#556677" }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:ring-2"
                style={{ background: "#FFFFFF", border: "1px solid #D0D8E0", color: "#1A2A3A" }}
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: "#556677" }}>
                Senha
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg text-sm placeholder-zinc-500 focus:outline-none focus:ring-2"
                style={{ background: "#FFFFFF", border: "1px solid #D0D8E0", color: "#1A2A3A" }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 font-medium rounded-lg transition-colors text-sm"
              style={{ background: "#E8A820", color: "#141009" }}
            >
              Entrar
            </button>

            <p className="text-center text-sm" style={{ color: "#8899AA" }}>
              Ainda não tem conta?{" "}
              <Link to="/registrar" style={{ color: "#E8A820" }}>
                Cadastre-se
              </Link>
            </p>
          </form>

          <div className="rounded-lg p-3" style={{ background: "#3399EE10", border: "1px solid #3399EE25" }}>
            <p className="text-xs leading-relaxed text-center" style={{ color: "#556677" }}>
              <strong style={{ color: "#1A2A3A" }}>Plano Free:</strong> 10 compassos · uma cantiga ·
              sem exportação. <strong style={{ color: "#1A2A3A" }}>Essencial R$97/mês:</strong> ilimitado.
            </p>
          </div>

          <p className="text-xs text-center" style={{ color: "#8899AA" }}>
            Ao usar o Note Form Pro, você concorda com a{" "}
            <Link to="/consentimento" className="underline hover:opacity-80" style={{ color: "#556677" }}>
              Política de Privacidade
            </Link>{" "}
            da Synemusic em conformidade com a LGPD.
          </p>
        </div>
      </div>
    </PrivacyBanner>
  );
}
