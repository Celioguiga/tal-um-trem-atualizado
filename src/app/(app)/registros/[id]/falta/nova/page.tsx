import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, FormActions, inputClass, labelClass } from "@/components/ui";
import { criarFalta } from "../../../actions";

export default async function NovaFaltaPage({ params }: { params: { id: string } }) {
  const aluno = await prisma.aluno.findUnique({
    where: { id: params.id },
  });

  if (!aluno) {
    notFound();
  }

  const criarFaltaComAluno = criarFalta.bind(null);

  return (
    <>
      <PageHeader
        title={`Registrar Falta de ${aluno.nome}`}
        description="Preencha os dados da falta"
      />

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form action={criarFaltaComAluno} className="space-y-4">
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

          <div>
            <label className={labelClass}>Justificada?</label>
            <select name="justificada" className={inputClass} defaultValue="false">
              <option value="false">Não</option>
              <option value="true">Sim</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Motivo (opcional)</label>
            <textarea
              name="motivo"
              className={inputClass}
              rows={2}
              placeholder="Ex: Doença, consulta médica, etc."
            />
          </div>

          <FormActions cancelHref={`/registros/${aluno.id}`} />
        </form>
      </div>
    </>
  );
}
