export type ConsentType =
  | "termos_de_uso"
  | "politica_privacidade"
  | "comunicacao_marketing"
  | "dados_menores";

export type ConsentRecord = {
  user_id?: string;
  consent_type: ConsentType;
  granted_at: string;
  ip_hash: string;
  version: string;
};

export function hashIp(ip: string): string {
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(16);
}

export const LGPD_VERSION = "v1.0-2026-07";

export const LGPD_TERMS = {
  termos_de_uso: {
    titulo: "Termos de Uso",
    texto: `Ao utilizar o Note Form Pro, você concorda com os Termos de Uso da Synemusic.
    Estes termos regem o acesso e uso da plataforma, incluindo a Metodologia RNG,
    o conteúdo pedagógico e as ferramentas de IA disponibilizadas.`,
    obrigatorio: true,
  },
  politica_privacidade: {
    titulo: "Política de Privacidade (LGPD)",
    texto: `Seus dados pessoais serão tratados conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018).
    A Synemusic coleta apenas os dados mínimos necessários para o funcionamento da plataforma.
    Pagamentos são processados exclusivamente pelo Stripe — nunca armazenamos dados de cartão.
    Você tem direito a acesso, correção, eliminação e portabilidade dos seus dados em até 15 dias.`,
    obrigatorio: true,
  },
  comunicacao_marketing: {
    titulo: "Comunicação e Marketing",
    texto: `Autoriza a Synemusic a enviar comunicações sobre novidades, dicas pedagógicas
    e ofertas especiais relacionadas ao ecossistema Synemusic. Você pode cancelar
    a qualquer momento.`,
    obrigatorio: false,
  },
  dados_menores: {
    titulo: "Dados de Menores (ECA Digital)",
    texto: `Se você é responsável legal por um menor de 16 anos, declara que a conta
    estará vinculada ao seu CPF e que o menor não receberá comunicação direta
    da plataforma. Conforme o Art. 24 da Lei 15.211/2025 (ECA Digital).`,
    obrigatorio: false,
  },
} as const;
