import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { excluirFalta, excluirNota, excluirObservacao } from "../actions";

export default async function RegistrosAlunoPage({ params }: { params: { id: string } }) {
  const aluno = await prisma.aluno.findUnique({
    where: { id: params.id },
    include: {
      turma: true,
      faltas: { orderBy: { data: "desc" } },
      notas: { orderBy: { data: "desc" } },
      observacoes: { orderBy: { data: "desc" } },
    },
  });

  if (!aluno) {
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
        title={aluno.nome}
        description={`${aluno.turma.nome} • Registros do dia a dia`}
      />

      <div className="space-y-6">
        {/* FALTAS */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Faltas ({aluno.faltas.length})</h2>
            <Link
              href={`/registros/${aluno.id}/falta/nova`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-900"
            >
              + Adicionar Falta
            </Link>
          </div>

          {aluno.faltas.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma falta registrada</p>
          ) : (
            <div className="space-y-2">
              {aluno.faltas.map((falta) => (
                <div key={falta.id} className="flex justify-between items-start p-3 border border-gray-200 rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{formatarData(falta.data)}</span>
                      {falta.justificada && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          Justificada
                        </span>
                      )}
                    </div>
                    {falta.motivo && <p className="text-sm text-gray-600 mt-1">{falta.motivo}</p>}
                  </div>
                  <ConfirmDeleteButton
                    id={falta.id}
                    action={excluirFalta}
                    itemName="falta"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NOTAS */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Notas ({aluno.notas.length})</h2>
            <Link
              href={`/registros/${aluno.id}/nota/nova`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-900"
            >
              + Adicionar Nota
            </Link>
          </div>

          {aluno.notas.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma nota registrada</p>
          ) : (
            <div className="space-y-2">
              {aluno.notas.map((nota) => (
                <div key={nota.id} className="flex justify-between items-start p-3 border border-gray-200 rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">{formatarData(nota.data)}</span>
                      {nota.conceito && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded font-semibold">
                          {nota.conceito}
                        </span>
                      )}
                      {nota.valor !== null && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded font-semibold">
                          {nota.valor.toFixed(1)}
                        </span>
                      )}
                    </div>
                    {nota.observacao && <p className="text-sm text-gray-600 mt-1">{nota.observacao}</p>}
                  </div>
                  <ConfirmDeleteButton
                    id={nota.id}
                    action={excluirNota}
                    itemName="nota"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* OBSERVAÇÕES */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Observações ({aluno.observacoes.length})</h2>
            <Link
              href={`/registros/${aluno.id}/observacao/nova`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-900"
            >
              + Adicionar Obs.
            </Link>
          </div>

          {aluno.observacoes.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhuma observação registrada</p>
          ) : (
            <div className="space-y-2">
              {aluno.observacoes.map((obs) => (
                <div key={obs.id} className="flex justify-between items-start p-3 border border-gray-200 rounded">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">{formatarData(obs.data)}</p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{obs.conteudo}</p>
                  </div>
                  <ConfirmDeleteButton
                    id={obs.id}
                    action={excluirObservacao}
                    itemName="observação"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/registros"
          className="block text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
        >
          Voltar
        </Link>
      </div>
    </>
  );
}
