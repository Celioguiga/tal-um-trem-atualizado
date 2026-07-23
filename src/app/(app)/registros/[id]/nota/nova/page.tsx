import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, FormActions, inputClass, labelClass } from "@/components/ui";
import { criarNota } from "../../../actions";

export default async function NovaNotaPage({ params }: { params: { id: string } }) {
  const aluno = await prisma.aluno.findUnique({
    where: { id: params.id },
  });

  if (!aluno) {
    notFound();
  }

  const criarNotaComAluno = criarNota.bind(null);

  return (
    <>
      <PageHeader
        title={`Registrar Nota de ${aluno.nome}`}
        description="Preencha os dados da nota"
      />

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form action={criarNotaComAluno} className="space-y-4">
          <input type="hidden" name="alunoId" value={aluno.id} />

          <div>
            <label className={labelClass}>Data</label>
            <input
              type="date"
              name="data"
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Conceito (opcional)</label>
              <input
                type="text"
                name="conceito"
                className={inputClass}
                placeholder="Ex: A, B, C, etc."
              />
            </div>

            <div>
              <label className={labelClass}>Valor (opcional)</label>
              <input
                type="number"
                name="valor"
                className={inputClass}
                step="0.1"
                min="0"
                placeholder="Ex: 8.5"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Observação (opcional)</label>
            <textarea
              name="observacao"
              className={inputClass}
              rows={3}
              placeholder="Detalhes sobre o desempenho"
            />
          </div>

          <FormActions cancelHref={`/registros/${aluno.id}`} />
        </form>
      </div>
    </>
  );
}
