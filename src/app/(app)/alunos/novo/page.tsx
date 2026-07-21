import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState, inputClass, labelClass, FormActions } from "@/components/ui";
import { criarAluno } from "../actions";

export default async function NovoAlunoPage({
  searchParams,
}: {
  searchParams: Promise<{ turmaId?: string }>;
}) {
  const { turmaId } = await searchParams;
  const turmas = await prisma.turma.findMany({ orderBy: { nome: "asc" } });

  if (turmas.length === 0) {
    return (
      <div>
        <PageHeader title="Novo aluno" />
        <EmptyState message="Cadastre uma turma antes de adicionar alunos." />
        <Link href="/turmas/nova" className="mt-4 inline-block text-sm font-medium text-stone-900 hover:underline">
          Ir para cadastro de turma →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Novo aluno" />
      <form action={criarAluno} className="max-w-md space-y-4">
        <div>
          <label htmlFor="nome" className={labelClass}>
            Nome do aluno
          </label>
          <input id="nome" name="nome" required className={inputClass} />
        </div>

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
          <label htmlFor="dataNasc" className={labelClass}>
            Data de nascimento
          </label>
          <input id="dataNasc" name="dataNasc" type="date" className={inputClass} />
        </div>

        <div>
          <label htmlFor="responsavel" className={labelClass}>
            Responsável
          </label>
          <input id="responsavel" name="responsavel" className={inputClass} />
        </div>

        <div>
          <label htmlFor="contato" className={labelClass}>
            Contato
          </label>
          <input id="contato" name="contato" className={inputClass} placeholder="Telefone ou e-mail" />
        </div>

        <div>
          <label htmlFor="observacoesGerais" className={labelClass}>
            Observações gerais
          </label>
          <textarea id="observacoesGerais" name="observacoesGerais" rows={3} className={inputClass} />
        </div>

        <FormActions cancelHref="/alunos" />
      </form>
    </div>
  );
}
