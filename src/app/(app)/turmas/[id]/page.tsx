import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { diasDaSemana } from "@/lib/constants";

export default async function TurmaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const turma = await prisma.turma.findUnique({
    where: { id },
    include: {
      alunos: { orderBy: { nome: "asc" } },
      horarios: { orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }] },
    },
  });

  if (!turma) notFound();

  return (
    <div>
      <PageHeader
        title={turma.nome}
        description={`Ano letivo ${turma.anoLetivo}`}
        action={{ href: `/turmas/${turma.id}/editar`, label: "Editar turma" }}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">Alunos</h2>
            <Link href={`/alunos/novo?turmaId=${turma.id}`} className="text-sm font-medium text-stone-600 hover:text-stone-900">
              + adicionar
            </Link>
          </div>
          {turma.alunos.length === 0 ? (
            <EmptyState message="Nenhum aluno nesta turma ainda." />
          ) : (
            <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
              {turma.alunos.map((aluno) => (
                <li key={aluno.id} className="px-4 py-3 text-sm">
                  <Link href={`/alunos/${aluno.id}/editar`} className="text-stone-900 hover:underline">
                    {aluno.nome}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">Horários</h2>
            <Link href={`/horarios/novo?turmaId=${turma.id}`} className="text-sm font-medium text-stone-600 hover:text-stone-900">
              + adicionar
            </Link>
          </div>
          {turma.horarios.length === 0 ? (
            <EmptyState message="Nenhum horário cadastrado ainda." />
          ) : (
            <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
              {turma.horarios.map((horario) => (
                <li key={horario.id} className="px-4 py-3 text-sm text-stone-700">
                  {diasDaSemana[horario.diaSemana]} · {horario.horaInicio}–{horario.horaFim}
                  {horario.local && ` · ${horario.local}`}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
