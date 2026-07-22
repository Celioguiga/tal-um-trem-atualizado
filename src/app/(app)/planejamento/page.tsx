import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { excluirPlano } from "./actions";

export default async function PlanejamentoPage() {
  const planos = await prisma.planoDeAula.findMany({
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
        title="Planejamento de Aula"
        description="Organize seus planos pedagógicos por turma e época"
        actionHref="/planejamento/novo"
        actionLabel="Novo Plano"
      />

      {planos.length === 0 ? (
        <EmptyState
          title="Nenhum plano criado"
          description="Comece criando seu primeiro plano de aula"
          actionHref="/planejamento/novo"
          actionLabel="Criar Plano"
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
              {planos.map((plano) => (
                <tr key={plano.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/planejamento/${plano.id}`}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      {plano.titulo}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {plano.turma.nome}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {plano.epoca?.titulo || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatarData(plano.data)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <Link
                      href={`/planejamento/${plano.id}/editar`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Editar
                    </Link>
                    <ConfirmDeleteButton
                      id={plano.id}
                      action={excluirPlano}
                      itemName={plano.titulo}
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
