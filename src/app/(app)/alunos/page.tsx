import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { excluirAluno } from "./actions";

export default async function AlunosPage() {
  const alunos = await prisma.aluno.findMany({
    orderBy: { nome: "asc" },
    include: { turma: true },
  });

  return (
    <div>
      <PageHeader
        title="Alunos"
        description="Alunos matriculados nas turmas."
        action={{ href: "/alunos/novo", label: "Novo aluno" }}
      />

      {alunos.length === 0 ? (
        <EmptyState message="Nenhum aluno cadastrado ainda." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Turma</th>
                <th className="px-4 py-3 font-medium">Responsável</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {alunos.map((aluno) => (
                <tr key={aluno.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-stone-900">{aluno.nome}</td>
                  <td className="px-4 py-3 text-stone-600">{aluno.turma.nome}</td>
                  <td className="px-4 py-3 text-stone-600">{aluno.responsavel ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-600">{aluno.contato ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/alunos/${aluno.id}/editar`}
                        className="text-sm font-medium text-stone-600 hover:text-stone-900"
                      >
                        Editar
                      </Link>
                      <form action={excluirAluno}>
                        <input type="hidden" name="id" value={aluno.id} />
                        <ConfirmDeleteButton confirmMessage={`Excluir o aluno "${aluno.nome}"?`} />
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
