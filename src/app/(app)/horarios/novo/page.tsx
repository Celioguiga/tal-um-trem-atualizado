import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState, inputClass, labelClass, FormActions } from "@/components/ui";
import { diasDaSemana } from "@/lib/constants";
import { criarHorario } from "../actions";

export default async function NovoHorarioPage({
  searchParams,
}: {
  searchParams: Promise<{ turmaId?: string }>;
}) {
  const { turmaId } = await searchParams;
  const turmas = await prisma.turma.findMany({ orderBy: { nome: "asc" } });

  if (turmas.length === 0) {
    return (
      <div>
        <PageHeader title="Novo horário" />
        <EmptyState message="Cadastre uma turma antes de adicionar horários." />
        <Link href="/turmas/nova" className="mt-4 inline-block text-sm font-medium text-stone-900 hover:underline">
          Ir para cadastro de turma →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Novo horário" />
      <form action={criarHorario} className="max-w-md space-y-4">
        <div>
          <label htmlFor="turmaId" className={labelClass}>
            Turma
          </label>
          <select id="turmaId" name="turmaId" required defaultValue={turmaId ?? ""} className={inputClass}>
            <option value="" disabled>
              Selecione a turma
            </option>
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nome} ({turma.anoLetivo})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="diaSemana" className={labelClass}>
            Dia da semana
          </label>
          <select id="diaSemana" name="diaSemana" required defaultValue="1" className={inputClass}>
            {diasDaSemana.map((dia, indice) => (
              <option key={dia} value={indice}>
                {dia}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="horaInicio" className={labelClass}>
              Início
            </label>
            <input id="horaInicio" name="horaInicio" type="time" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="horaFim" className={labelClass}>
              Fim
            </label>
            <input id="horaFim" name="horaFim" type="time" required className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="local" className={labelClass}>
            Local
          </label>
          <input id="local" name="local" className={inputClass} placeholder="Ex: Sala de música" />
        </div>

        <FormActions cancelHref="/horarios" />
      </form>
    </div>
  );
}
