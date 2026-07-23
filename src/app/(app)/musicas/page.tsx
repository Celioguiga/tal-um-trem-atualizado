import Link from "next/link";
import prisma from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";

export default async function MusicasPage() {
  const musicas = await prisma.musica.findMany({
    include: { turma: true, epoca: true },
    orderBy: { criadoEm: "desc" },
  });

  if (musicas.length === 0) {
    return (
      <div>
        <PageHeader title="Banco de Músicas RNFG" />
        <EmptyState
          title="Nenhuma música cadastrada"
          description="Comece adicionando uma música ao seu repositório"
          actionHref="/musicas/nova"
          actionLabel="Nova Música"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Banco de Músicas RNFG" />

      <div className="flex justify-end mb-6">
        <Link
          href="/musicas/nova"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Nova Música
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Título
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Autor
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Turma
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Época
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {musicas.map((musica) => (
              <tr key={musica.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  <Link
                    href={`/musicas/${musica.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {musica.titulo}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {musica.autor || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {musica.turma?.nome || "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {musica.epoca?.titulo || "—"}
                </td>
                <td className="px-6 py-4 text-sm">
                  <Link
                    href={`/musicas/${musica.id}/editar`}
                    className="text-blue-600 hover:underline"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
