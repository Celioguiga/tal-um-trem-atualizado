import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, FormActions, inputClass, labelClass } from "@/components/ui";
import { criarPlano } from "../actions";

export default async function NovoPlanejamentoPage() {
  const turmas = await prisma.turma.findMany({
    orderBy: { nome: "asc" },
  });

  const epocas = await prisma.epoca.findMany({
    orderBy: { dataInicio: "desc" },
  });

  if (turmas.length === 0) {
    return (
      <>
        <PageHeader title="Novo Plano de Aula" description="Preencha os dados do plano" />
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Você precisa criar pelo menos uma turma antes de criar um plano de aula.
          </p>
          <Link href="/turmas/nova" className="text-yellow-900 underline font-medium mt-2 inline-block">
            Criar Turma
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Novo Plano de Aula" description="Preencha os dados do plano" />

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form action={criarPlano} className="space-y-4">
          <div>
            <label className={labelClass}>Título</label>
            <input type="text" name="titulo" className={inputClass} required />
          </div>

          <div>
            <label className={labelClass}>Data</label>
            <input type="date" name="data" className={inputClass} required />
          </div>

          <div>
            <label className={labelClass}>Turma</label>
            <select name="turmaId" className={inputClass} required>
              <option value="">Selecione uma turma</option>
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Época (opcional)</label>
            <select name="epocaId" className={inputClass}>
              <option value="">Nenhuma época</option>
              {epocas.map((epoca) => (
                <option key={epoca.id} value={epoca.id}>
                  {epoca.titulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Objetivos</label>
            <textarea
              name="objetivos"
              className={inputClass}
              rows={3}
              placeholder="O que você quer que os alunos aprendam?"
            />
          </div>

          <div>
            <label className={labelClass}>Conteúdo</label>
            <textarea
              name="conteudo"
              className={inputClass}
              rows={3}
              placeholder="Qual é o conteúdo abordado?"
            />
          </div>

          <div>
            <label className={labelClass}>Materiais</label>
            <textarea
              name="materiais"
              className={inputClass}
              rows={2}
              placeholder="Que materiais você vai usar?"
            />
          </div>

          <FormActions cancelHref="/planejamento" />
        </form>
      </div>
    </>
  );
}
