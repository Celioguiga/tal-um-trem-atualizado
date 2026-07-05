import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { PrivacyBanner } from "./PrivacyBanner";
import { Logo } from "../brand/Logo";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate("/app", { replace: true });
    return null;
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center flex flex-col items-center">
            <Logo size="lg" showTagline />
          </div>

          <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl p-8 space-y-6 border border-zinc-800">
            <h2 className="text-xl font-semibold text-white">Entrar</h2>

            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg px-4 py-2 text-sm">
                {error}
              </div>
            )}

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
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rng-sol"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rng-sol"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-rng-sol text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Entrar
            </button>

            <p className="text-center text-sm text-zinc-400">
              Ainda não tem conta?{" "}
              <Link to="/registrar" className="text-rng-sol hover:underline">
                Cadastre-se
              </Link>
            </p>
          </form>

          <p className="text-xs text-zinc-500 text-center">
            Ao usar o Note Form Pro, você concorda com a{" "}
            <Link to="/consentimento" className="underline hover:text-zinc-400">
              Política de Privacidade
            </Link>{" "}
            da Synemusic em conformidade com a LGPD.
          </p>
        </div>
      </div>
    </PrivacyBanner>
  );
}
