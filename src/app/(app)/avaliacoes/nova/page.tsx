import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, FormActions, inputClass, labelClass } from "@/components/ui";
import { criarAvaliacao } from "../actions";

export default async function NovaAvaliacaoPage() {
  const turmas = await prisma.turma.findMany({
    orderBy: { nome: "asc" },
  });

  const epocas = await prisma.epoca.findMany({
    orderBy: { dataInicio: "desc" },
  });

  if (turmas.length === 0) {
    return (
      <>
        <PageHeader title="Nova Avaliação" description="Crie uma avaliação pedagógica" />
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Você precisa criar pelo menos uma turma antes de criar uma avaliação.
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
      <PageHeader title="Nova Avaliação" description="Crie uma avaliação pedagógica" />

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form action={criarAvaliacao} className="space-y-4">
          <div>
            <label className={labelClass}>Título</label>
            <input
              type="text"
              name="titulo"
              className={inputClass}
              placeholder="Ex: Avaliação de Desempenho - Primeira Época"
              required
            />
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
            <label className={labelClass}>Instruções para Avaliação (opcional)</label>
            <textarea
              name="instrucoes"
              className={inputClass}
              rows={4}
              placeholder="Descreva como a avaliação será realizada, critérios, metodologia, etc."
            />
          </div>

          <FormActions cancelHref="/avaliacoes" />
        </form>
      </div>
    </>
  );
}
