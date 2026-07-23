import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";

export default async function RegistrosPage() {
  const alunos = await prisma.aluno.findMany({
    include: {
      turma: true,
      faltas: true,
      notas: true,
      observacoes: true,
    },
    orderBy: { turma: { nome: "asc" } },
  });

  if (alunos.length === 0) {
    return (
      <>
        <PageHeader
          title="Registros do Dia a Dia"
          description="Faltas, notas e observações dos alunos"
        />
        <EmptyState
          title="Nenhum aluno cadastrado"
          description="Crie alunos antes de registrar faltas, notas ou observações"
          actionHref="/alunos/novo"
          actionLabel="Criar Aluno"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Registros do Dia a Dia"
        description="Faltas, notas e observações dos alunos"
      />

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aluno
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Turma
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Faltas
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notas
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Obs.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {alunos.map((aluno) => (
              <tr key={aluno.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/registros/${aluno.id}`}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    {aluno.nome}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {aluno.turma.nome}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {aluno.faltas.length}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {aluno.notas.length}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {aluno.observacoes.length}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link
                    href={`/registros/${aluno.id}`}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    Ver Detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
