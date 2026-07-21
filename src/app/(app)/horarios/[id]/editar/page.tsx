import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, inputClass, labelClass, FormActions } from "@/components/ui";
import { diasDaSemana } from "@/lib/constants";
import { atualizarHorario } from "../../actions";

export default async function EditarHorarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [horario, turmas] = await Promise.all([
    prisma.horario.findUnique({ where: { id } }),
    prisma.turma.findMany({ orderBy: { nome: "asc" } }),
  ]);
  if (!horario) notFound();

  const atualizarComId = atualizarHorario.bind(null, horario.id);

  return (
    <div>
      <PageHeader title="Editar horário" />
      <form action={atualizarComId} className="max-w-md space-y-4">
        <div>
          <label htmlFor="turmaId" className={labelClass}>
            Turma
          </label>
          <select id="turmaId" name="turmaId" required defaultValue={horario.turmaId} className={inputClass}>
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
          <select id="diaSemana" name="diaSemana" required defaultValue={horario.diaSemana} className={inputClass}>
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
            <input
              id="horaInicio"
              name="horaInicio"
              type="time"
              required
              defaultValue={horario.horaInicio}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="horaFim" className={labelClass}>
              Fim
            </label>
            <input
              id="horaFim"
              name="horaFim"
              type="time"
              required
              defaultValue={horario.horaFim}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="local" className={labelClass}>
            Local
          </label>
          <input id="local" name="local" defaultValue={horario.local ?? ""} className={inputClass} />
        </div>

        <FormActions cancelHref="/horarios" />
      </form>
    </div>
  );
}
