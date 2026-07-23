import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, FormActions, inputClass, labelClass } from "@/components/ui";
import { atualizarAvaliacao } from "../../actions";

export default async function EditarAvaliacaoPage({ params }: { params: { id: string } }) {
  const avaliacao = await prisma.avaliacao.findUnique({
    where: { id: params.id },
    include: { turma: true },
  });

  if (!avaliacao) {
    notFound();
  }

  const turmas = await prisma.turma.findMany({
    orderBy: { nome: "asc" },
  });

  const epocas = await prisma.epoca.findMany({
    orderBy: { dataInicio: "desc" },
  });

  const atualizarComId = atualizarAvaliacao.bind(null, avaliacao.id);

  const dataFormatada = avaliacao.data.toISOString().split("T")[0];

  return (
    <>
      <PageHeader title={`Editar: ${avaliacao.titulo}`} description="Atualize os dados da avaliação" />

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form action={atualizarComId} className="space-y-4">
          <div>
            <label className={labelClass}>Título</label>
            <input
              type="text"
              name="titulo"
              className={inputClass}
              defaultValue={avaliacao.titulo}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Data</label>
            <input
              type="date"
              name="data"
              className={inputClass}
              defaultValue={dataFormatada}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Turma</label>
            <select
              name="turmaId"
              className={inputClass}
              defaultValue={avaliacao.turmaId}
              required
            >
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
            <select
              name="epocaId"
              className={inputClass}
              defaultValue={avaliacao.epocaId || ""}
            >
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
              defaultValue={avaliacao.instrucoes || ""}
              placeholder="Descreva como a avaliação será realizada, critérios, metodologia, etc."
            />
          </div>

          <FormActions cancelHref={`/avaliacoes/${avaliacao.id}`} />
        </form>
      </div>
    </>
  );
}
