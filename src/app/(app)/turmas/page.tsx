import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { excluirTurma } from "./actions";

export default async function TurmasPage() {
  const turmas = await prisma.turma.findMany({
    orderBy: [{ anoLetivo: "desc" }, { nome: "asc" }],
    include: { _count: { select: { alunos: true, horarios: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Turmas"
        description="Turmas cadastradas na escola."
        action={{ href: "/turmas/nova", label: "Nova turma" }}
      />

      {turmas.length === 0 ? (
        <EmptyState message="Nenhuma turma cadastrada ainda." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Ano letivo</th>
                <th className="px-4 py-3 font-medium">Alunos</th>
                <th className="px-4 py-3 font-medium">Horários</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {turmas.map((turma) => (
                <tr key={turma.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/turmas/${turma.id}`} className="font-medium text-stone-900 hover:underline">
                      {turma.nome}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{turma.anoLetivo}</td>
                  <td className="px-4 py-3 text-stone-600">{turma._count.alunos}</td>
                  <td className="px-4 py-3 text-stone-600">{turma._count.horarios}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/turmas/${turma.id}/editar`}
                        className="text-sm font-medium text-stone-600 hover:text-stone-900"
                      >
                        Editar
                      </Link>
                      <form action={excluirTurma}>
                        <input type="hidden" name="id" value={turma.id} />
                        <ConfirmDeleteButton confirmMessage={`Excluir a turma "${turma.nome}"? Alunos e horários vinculados também serão removidos.`} />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
