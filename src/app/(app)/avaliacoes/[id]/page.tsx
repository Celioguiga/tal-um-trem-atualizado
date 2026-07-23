import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";

export default async function AvaliacaoDetailPage({ params }: { params: { id: string } }) {
  const avaliacao = await prisma.avaliacao.findUnique({
    where: { id: params.id },
    include: { turma: true, epoca: true },
  });

  if (!avaliacao) {
    notFound();
  }

  const formatarData = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  return (
    <>
      <PageHeader
        title={avaliacao.titulo}
        description={`${avaliacao.turma.nome} • ${formatarData(avaliacao.data)}`}
        actionHref={`/avaliacoes/${avaliacao.id}/editar`}
        actionLabel="Editar"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {avaliacao.instrucoes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Instruções</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{avaliacao.instrucoes}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Próximas Ações</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Coletar dados de desempenho dos alunos</li>
              <li>• Preparar feedback individual para cada aluno</li>
              <li>• Comunicar resultados às famílias</li>
              <li>• Registrar observações pedagógicas</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Informações</h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Turma</p>
                <p className="text-lg font-semibold text-gray-900">{avaliacao.turma.nome}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Data</p>
                <p className="text-lg font-semibold text-gray-900">{formatarData(avaliacao.data)}</p>
              </div>

              {avaliacao.epoca && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Época</p>
                  <Link
                    href={`/epocas/${avaliacao.epocaId}`}
                    className="text-blue-600 hover:text-blue-900 font-semibold"
                  >
                    {avaliacao.epoca.titulo}
                  </Link>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Alunos na Turma</p>
                <Link
                  href={`/alunos?turma=${avaliacao.turmaId}`}
                  className="text-blue-600 hover:text-blue-900 font-semibold"
                >
                  Ver Lista
                </Link>
              </div>
            </div>
          </div>

          <Link
            href="/avaliacoes"
            className="block text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
          >
            Voltar
          </Link>
        </div>
      </div>
    </>
  );
}
