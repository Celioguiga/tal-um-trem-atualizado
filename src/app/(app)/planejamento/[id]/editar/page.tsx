import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, FormActions, inputClass, labelClass } from "@/components/ui";
import { atualizarPlano } from "../../actions";

export default async function EditarPlanejamentoPage({ params }: { params: { id: string } }) {
  const plano = await prisma.planoDeAula.findUnique({
    where: { id: params.id },
    include: { turma: true },
  });

  if (!plano) {
    notFound();
  }

  const turmas = await prisma.turma.findMany({
    orderBy: { nome: "asc" },
  });

  const epocas = await prisma.epoca.findMany({
    orderBy: { dataInicio: "desc" },
  });

  const atualizarComId = atualizarPlano.bind(null, plano.id);

  const dataFormatada = plano.data.toISOString().split("T")[0];

  return (
    <>
      <PageHeader title={`Editar: ${plano.titulo}`} description="Atualize os dados do plano" />

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form action={atualizarComId} className="space-y-4">
          <div>
            <label className={labelClass}>Título</label>
            <input
              type="text"
              name="titulo"
              className={inputClass}
              defaultValue={plano.titulo}
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
              defaultValue={plano.turmaId}
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
              defaultValue={plano.epocaId || ""}
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
            <label className={labelClass}>Objetivos</label>
            <textarea
              name="objetivos"
              className={inputClass}
              rows={3}
              defaultValue={plano.objetivos || ""}
              placeholder="O que você quer que os alunos aprendam?"
            />
          </div>

          <div>
            <label className={labelClass}>Conteúdo</label>
            <textarea
              name="conteudo"
              className={inputClass}
              rows={3}
              defaultValue={plano.conteudo || ""}
              placeholder="Qual é o conteúdo abordado?"
            />
          </div>

          <div>
            <label className={labelClass}>Materiais</label>
            <textarea
              name="materiais"
              className={inputClass}
              rows={2}
              defaultValue={plano.materiais || ""}
              placeholder="Que materiais você vai usar?"
            />
          </div>

          <FormActions cancelHref={`/planejamento/${plano.id}`} />
        </form>
      </div>
    </>
  );
}
