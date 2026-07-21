import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, inputClass, labelClass, FormActions } from "@/components/ui";
import { atualizarTurma } from "../../actions";

export default async function EditarTurmaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const turma = await prisma.turma.findUnique({ where: { id } });
  if (!turma) notFound();

  const atualizarComId = atualizarTurma.bind(null, turma.id);

  return (
    <div>
      <PageHeader title="Editar turma" />
      <form action={atualizarComId} className="max-w-md space-y-4">
        <div>
          <label htmlFor="nome" className={labelClass}>
            Nome da turma
          </label>
          <input id="nome" name="nome" required defaultValue={turma.nome} className={inputClass} />
        </div>

        <div>
          <label htmlFor="anoLetivo" className={labelClass}>
            Ano letivo
          </label>
          <input
            id="anoLetivo"
            name="anoLetivo"
            type="number"
            required
            defaultValue={turma.anoLetivo}
            className={inputClass}
          />
        </div>

        <FormActions cancelHref="/turmas" />
      </form>
    </div>
  );
}
