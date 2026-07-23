import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { excluirAvaliacao } from "./actions";

export default async function AvaliacoesPage() {
  const avaliacoes = await prisma.avaliacao.findMany({
    include: { turma: true, epoca: true },
    orderBy: { data: "desc" },
  });

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
        title="Avaliações"
        description="Relatórios e avaliações periódicas das turmas"
        actionHref="/avaliacoes/nova"
        actionLabel="Nova Avaliação"
      />

      {avaliacoes.length === 0 ? (
        <EmptyState
          title="Nenhuma avaliação criada"
          description="Crie sua primeira avaliação pedagógica"
          actionHref="/avaliacoes/nova"
          actionLabel="Criar Avaliação"
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Turma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Época
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {avaliacoes.map((avaliacao) => (
                <tr key={avaliacao.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/avaliacoes/${avaliacao.id}`}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      {avaliacao.titulo}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {avaliacao.turma.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {avaliacao.epoca?.titulo || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatarData(avaliacao.data)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Link
                      href={`/avaliacoes/${avaliacao.id}/editar`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </Link>
                    <ConfirmDeleteButton
                      id={avaliacao.id}
                      action={excluirAvaliacao}
                      itemName={avaliacao.titulo}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
