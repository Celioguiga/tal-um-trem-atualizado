import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, inputClass, labelClass, FormActions } from "@/components/ui";
import { atualizarAluno } from "../../actions";

function paraDataInput(data: Date | null) {
  if (!data) return "";
  return data.toISOString().slice(0, 10);
}

export default async function EditarAlunoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [aluno, turmas] = await Promise.all([
    prisma.aluno.findUnique({ where: { id } }),
    prisma.turma.findMany({ orderBy: { nome: "asc" } }),
  ]);
  if (!aluno) notFound();

  const atualizarComId = atualizarAluno.bind(null, aluno.id);

  return (
    <div>
      <PageHeader title="Editar aluno" />
      <form action={atualizarComId} className="max-w-md space-y-4">
        <div>
          <label htmlFor="nome" className={labelClass}>
            Nome do aluno
          </label>
          <input id="nome" name="nome" required defaultValue={aluno.nome} className={inputClass} />
        </div>

        <div>
          <label htmlFor="turmaId" className={labelClass}>
            Turma
          </label>
          <select id="turmaId" name="turmaId" required defaultValue={aluno.turmaId} className={inputClass}>
            {turmas.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nome} ({turma.anoLetivo})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="dataNasc" className={labelClass}>
            Data de nascimento
          </label>
          <input
            id="dataNasc"
            name="dataNasc"
            type="date"
            defaultValue={paraDataInput(aluno.dataNasc)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="responsavel" className={labelClass}>
            Responsável
          </label>
          <input id="responsavel" name="responsavel" defaultValue={aluno.responsavel ?? ""} className={inputClass} />
        </div>

        <div>
          <label htmlFor="contato" className={labelClass}>
            Contato
          </label>
          <input id="contato" name="contato" defaultValue={aluno.contato ?? ""} className={inputClass} />
        </div>

        <div>
          <label htmlFor="observacoesGerais" className={labelClass}>
            Observações gerais
          </label>
          <textarea
            id="observacoesGerais"
            name="observacoesGerais"
            rows={3}
            defaultValue={aluno.observacoesGerais ?? ""}
            className={inputClass}
          />
        </div>

        <FormActions cancelHref="/alunos" />
      </form>
    </div>
  );
}
