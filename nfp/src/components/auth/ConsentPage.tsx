import { Link } from "react-router-dom";
import { LGPD_VERSION } from "../../lib/lgpd";

export function ConsentPage() {
  return (
    <div className="min-h-screen flex items-start justify-center px-4 py-12"
      style={{ background: "#141009" }}
    >
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold" style={{ color: "#F5F2EA", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Privacidade e Dados
          </h1>
          <p style={{ color: "#A69B85", marginTop: "0.5rem" }}>
            Synemusic — Transparência com você
          </p>
        </div>

        <div className="rounded-xl p-8 space-y-6"
          style={{ background: "#1A1610", border: "1px solid #2A241A" }}
        >
          <div className="pb-4" style={{ borderBottom: "1px solid #2A241A" }}>
            <h2 className="text-lg font-semibold" style={{ color: "#F5F2EA" }}>
              Política de Privacidade (v{LGPD_VERSION})
            </h2>
          </div>

          <div className="space-y-6 text-sm leading-relaxed" style={{ color: "#D4CDBF" }}>
            <section>
              <h3 className="font-medium mb-2" style={{ color: "#F5F2EA" }}>1. Quem somos</h3>
              <p>
                A Synemusic é uma plataforma de edutainment musical que opera sob a
                Metodologia Real Nota Grau (RNG). Nossos serviços incluem o Note Form Pro,
                o Cromus Studio e demais ativos do ecossistema Synemusic.
              </p>
            </section>
            <section>
              <h3 className="font-medium mb-2" style={{ color: "#F5F2EA" }}>2. Dados que coletamos</h3>
              <p>
                Nome, email, dados de pagamento (processados exclusivamente pelo Stripe),
                registros de consentimento LGPD com hash de IP e timestamp. Não coletamos
                dados de navegação além do estritamente necessário para o funcionamento
                da plataforma.
              </p>
            </section>
            <section>
              <h3 className="font-medium mb-2" style={{ color: "#F5F2EA" }}>3. Como usamos seus dados</h3>
              <p>
                Para autenticação, cobrança (Stripe), melhoria dos serviços educacionais
                e cumprimento de obrigações legais. Nunca vendemos dados pessoais a
                terceiros.
              </p>
            </section>
            <section>
              <h3 className="font-medium mb-2" style={{ color: "#F5F2EA" }}>4. Seus direitos (LGPD)</h3>
              <p>
                Você tem direito a: confirmar a existência de tratamento, acessar seus
                dados, corrigir dados incompletos, anonimizar ou eliminar dados
                desnecessários, portabilidade, revogar consentimento a qualquer momento.
              </p>
            </section>
            <section>
              <h3 className="font-medium mb-2" style={{ color: "#F5F2EA" }}>5. Segurança</h3>
              <p>
                Utilizamos criptografia TLS para todas as transmissões e hash de senhas
                com bcrypt. Pagamentos são processados pelo Stripe, que mantém nível 1
                de certificação PCI DSS.
              </p>
            </section>
            <section>
              <h3 className="font-medium mb-2" style={{ color: "#F5F2EA" }}>6. Contato</h3>
              <p>
                DPO: Célio Guiga — privacidade@synemusic.com.br.
                Synemusic — Itacaré, Bahia.
              </p>
            </section>
          </div>
        </div>

        <p className="text-center" style={{ color: "#6F664F" }}>
          <Link to="/registrar" style={{ color: "#E8A820" }}>
            Voltar ao cadastro
          </Link>
        </p>
      </div>
    </div>
  );
}
