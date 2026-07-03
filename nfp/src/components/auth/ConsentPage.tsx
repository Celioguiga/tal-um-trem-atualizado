import { Link } from "react-router-dom";
import { LGPD_VERSION } from "../../lib/lgpd";

export function ConsentPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Privacidade e Dados</h1>
          <p className="text-zinc-400 mt-2">
            Synemusic — Transparência com você
          </p>
        </div>

        <div className="bg-zinc-900 rounded-xl p-8 space-y-6 border border-zinc-800">
          <div className="border-b border-zinc-700 pb-4">
            <h2 className="text-lg font-semibold text-white">
              Política de Privacidade (v{LGPD_VERSION})
            </h2>
          </div>

          <div className="space-y-6 text-sm text-zinc-300 leading-relaxed">
            <section>
              <h3 className="text-white font-medium mb-2">1. Quem somos</h3>
              <p>
                A Synemusic é uma plataforma de edutainment musical que opera sob a
                Metodologia Real Nota Grau (RNG). Nossos serviços incluem o Note Form Pro,
                o Cromus Studio e demais ativos do ecossistema Synemusic.
              </p>
            </section>

            <section>
              <h3 className="text-white font-medium mb-2">2. Dados que coletamos</h3>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li>Nome, email e país (obrigatórios para criação de conta)</li>
                <li>Dados de progresso pedagógico (sessões de estudo, partituras)</li>
                <li>Dados de uso da plataforma (interações com agentes de IA)</li>
                <li>Nunca armazenamos dados de cartão de crédito (processado pelo Stripe)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-white font-medium mb-2">3. Base legal (LGPD)</h3>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li>Consentimento (Art. 7º, I) — para dados pedagógicos e comunicação</li>
                <li>Execução de contrato (Art. 7º, V) — para funcionamento da plataforma</li>
                <li>Cumprimento de obrigação legal (Art. 7º, II) — para dados fiscais</li>
              </ul>
            </section>

            <section>
              <h3 className="text-white font-medium mb-2">4. Seus direitos</h3>
              <ul className="list-disc pl-5 space-y-1 text-zinc-400">
                <li>Acessar, corrigir e eliminar seus dados pessoais</li>
                <li>Portabilidade dos dados para outro fornecedor</li>
                <li>Revogar o consentimento a qualquer momento</li>
                <li>Solicitar revisão de decisões automatizadas (agentes de IA)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-white font-medium mb-2">5. Menores de idade</h3>
              <p>
                Em conformidade com o ECA Digital (Lei 15.211/2025), menores de 16 anos
                necessitam de conta vinculada ao responsável legal. Não realizamos
                perfilamento para publicidade de menores.
              </p>
            </section>

            <section>
              <h3 className="text-white font-medium mb-2">6. Contato</h3>
              <p>
                DPO: Célio Guiga<br />
                Email: privacidade@synemusic.com.br
              </p>
            </section>
          </div>

          <div className="border-t border-zinc-700 pt-6">
            <Link
              to="/registrar"
              className="inline-block w-full text-center py-2 px-4 bg-rng-sol text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voltar ao cadastro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
