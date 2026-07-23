import Link from "next/link";
import prisma from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";

export default async function ConhecimentoPage() {
  const artigos = await prisma.conhecimentoArtigo.findMany({
    orderBy: { criadoEm: "desc" },
  });

  if (artigos.length === 0) {
    return (
      <div>
        <PageHeader title="Conhecimento Waldorf" />
        <EmptyState
          title="Nenhum artigo cadastrado"
          description="Comece adicionando recursos pedagógicos ao seu banco de conhecimento"
          actionHref="/conhecimento/novo"
          actionLabel="Novo Artigo"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Conhecimento Waldorf" />

      <div className="flex justify-end mb-6">
        <Link
          href="/conhecimento/novo"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Novo Artigo
        </Link>
      </div>

      <div className="space-y-4">
        {artigos.map((artigo) => {
          const tags = artigo.tags
            ? artigo.tags.split(",").map((tag) => tag.trim())
            : [];

          return (
            <div
              key={artigo.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link
                    href={`/conhecimento/${artigo.id}`}
                    className="text-lg font-semibold text-blue-600 hover:underline"
                  >
                    {artigo.titulo}
                  </Link>

                  {artigo.categoria && (
                    <p className="mt-1 text-sm text-gray-600">
                      <span className="inline-block bg-gray-100 px-2 py-1 rounded">
                        {artigo.categoria}
                      </span>
                    </p>
                  )}

                  <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                    {artigo.conteudo}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-gray-500">
                    Criado em{" "}
                    {new Date(artigo.criadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <Link
                  href={`/conhecimento/${artigo.id}/editar`}
                  className="ml-4 text-blue-600 hover:underline text-sm font-medium"
                >
                  Editar
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
