import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, FormActions, inputClass, labelClass } from "@/components/ui";
import { criarObservacao } from "../../../actions";

export default async function NovaObservacaoPage({ params }: { params: { id: string } }) {
  const aluno = await prisma.aluno.findUnique({
    where: { id: params.id },
  });

  if (!aluno) {
    notFound();
  }

  const criarObservacaoComAluno = criarObservacao.bind(null);

  return (
    <>
      <PageHeader
        title={`Adicionar Observação de ${aluno.nome}`}
        description="Registre uma observação pedagógica"
      />

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <form action={criarObservacaoComAluno} className="space-y-4">
          <input type="hidden" name="alunoId" value={aluno.id} />

          <div>
            <label className={labelClass}>Observação</label>
            <textarea
              name="conteudo"
              className={inputClass}
              rows={6}
              placeholder="Registre observações sobre o comportamento, aprendizado, relacionamento com colegas, etc."
              required
            />
          </div>

          <FormActions cancelHref={`/registros/${aluno.id}`} />
        </form>
      </div>
    </>
  );
}
