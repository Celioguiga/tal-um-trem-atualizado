import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";

export default async function PlanejamentoDetailPage({ params }: { params: { id: string } }) {
  const plano = await prisma.planoDeAula.findUnique({
    where: { id: params.id },
    include: { turma: true, epoca: true },
  });

  if (!plano) {
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
        title={plano.titulo}
        description={`${plano.turma.nome} • ${formatarData(plano.data)}`}
        actionHref={`/planejamento/${plano.id}/editar`}
        actionLabel="Editar"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {plano.objetivos && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Objetivos</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{plano.objetivos}</p>
            </div>
          )}

          {plano.conteudo && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Conteúdo</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{plano.conteudo}</p>
            </div>
          )}

          {plano.materiais && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-3">Materiais</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{plano.materiais}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-4">Informações</h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Turma</p>
                <p className="text-lg font-semibold text-gray-900">{plano.turma.nome}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Data</p>
                <p className="text-lg font-semibold text-gray-900">{formatarData(plano.data)}</p>
              </div>

              {plano.epoca && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Época</p>
                  <Link
                    href={`/epocas/${plano.epocaId}`}
                    className="text-blue-600 hover:text-blue-900 font-semibold"
                  >
                    {plano.epoca.titulo}
                  </Link>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/planejamento"
            className="block text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
          >
            Voltar
          </Link>
        </div>
      </div>
    </>
  );
}
