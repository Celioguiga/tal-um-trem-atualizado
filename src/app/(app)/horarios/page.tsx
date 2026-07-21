import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { diasDaSemana } from "@/lib/constants";
import { excluirHorario } from "./actions";

export default async function HorariosPage() {
  const horarios = await prisma.horario.findMany({
    orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }],
    include: { turma: true },
  });

  return (
    <div>
      <PageHeader
        title="Horários"
        description="Grade horária das turmas."
        action={{ href: "/horarios/novo", label: "Novo horário" }}
      />

      {horarios.length === 0 ? (
        <EmptyState message="Nenhum horário cadastrado ainda." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Turma</th>
                <th className="px-4 py-3 font-medium">Dia</th>
                <th className="px-4 py-3 font-medium">Horário</th>
                <th className="px-4 py-3 font-medium">Local</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {horarios.map((horario) => (
                <tr key={horario.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-stone-900">{horario.turma.nome}</td>
                  <td className="px-4 py-3 text-stone-600">{diasDaSemana[horario.diaSemana]}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {horario.horaInicio}–{horario.horaFim}
                  </td>
                  <td className="px-4 py-3 text-stone-600">{horario.local ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/horarios/${horario.id}/editar`}
                        className="text-sm font-medium text-stone-600 hover:text-stone-900"
                      >
                        Editar
                      </Link>
                      <form action={excluirHorario}>
                        <input type="hidden" name="id" value={horario.id} />
                        <ConfirmDeleteButton confirmMessage="Excluir este horário?" />
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
