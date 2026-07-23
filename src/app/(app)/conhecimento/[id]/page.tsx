import Link from "next/link";
import prisma from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import ConfirmDeleteButton from "@/components/confirm-delete-button";
import { excluirArtigo } from "../actions";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetalheArtigo({ params }: Props) {
  const { id } = await params;

  const artigo = await prisma.conhecimentoArtigo.findUnique({
    where: { id },
  });

  if (!artigo) {
    notFound();
  }

  const tags = artigo.tags
    ? artigo.tags.split(",").map((tag) => tag.trim())
    : [];

  return (
    <div>
      <PageHeader title={artigo.titulo} />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            {artigo.categoria && (
              <div className="mb-4">
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {artigo.categoria}
                </span>
              </div>
            )}

            <div className="prose prose-sm max-w-none">
              <div className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                {artigo.conteudo}
              </div>
            </div>

            {tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-600 mb-3">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Informações</h3>

            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-1">Criado em</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(artigo.criadoEm).toLocaleDateString("pt-BR")}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-1">Atualizado em</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(artigo.atualizadoEm).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              💡 <span className="font-medium">Dica:</span> Use este artigo como
              referência pedagógica em seu planejamento de aulas.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <Link
              href={`/conhecimento/${artigo.id}/editar`}
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ✏️ Editar
            </Link>

            <ConfirmDeleteButton
              action={excluirArtigo.bind(null, artigo.id)}
              redirectTo="/conhecimento"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
