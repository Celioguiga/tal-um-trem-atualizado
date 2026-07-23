import Link from "next/link";
import prisma from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import ConfirmDeleteButton from "@/components/confirm-delete-button";
import { excluirMusica } from "../actions";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DetalheMusica({ params }: Props) {
  const { id } = await params;

  const musica = await prisma.musica.findUnique({
    where: { id },
    include: { turma: true, epoca: true },
  });

  if (!musica) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={musica.titulo} />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            {musica.autor && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Compositor/Arranjador
                </h3>
                <p className="text-gray-900">{musica.autor}</p>
              </div>
            )}

            {musica.notacaoCromus && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Notação Cromus (RNFG)
                </h3>
                <pre className="bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto text-sm font-mono">
                  {musica.notacaoCromus}
                </pre>
              </div>
            )}

            {musica.lilypond && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Código LilyPond
                </h3>
                <pre className="bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto text-sm font-mono">
                  {musica.lilypond}
                </pre>
              </div>
            )}

            {musica.partituraPdf && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Partitura
                </h3>
                <a
                  href={musica.partituraPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                >
                  📄 Abrir PDF
                </a>
              </div>
            )}

            {musica.observacoes && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Observações
                </h3>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {musica.observacoes}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Informações</h3>

            {musica.turma && (
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-1">Turma</p>
                <p className="text-sm font-medium text-gray-900">
                  {musica.turma.nome}
                </p>
              </div>
            )}

            {musica.epoca && (
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-1">Época</p>
                <p className="text-sm font-medium text-gray-900">
                  {musica.epoca.titulo}
                </p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-1">Criada em</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(musica.criadoEm).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <Link
              href={`/musicas/${musica.id}/editar`}
              className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              ✏️ Editar
            </Link>

            <ConfirmDeleteButton
              action={excluirMusica.bind(null, musica.id)}
              redirectTo="/musicas"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
