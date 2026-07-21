import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, inputClass, labelClass, FormActions } from "@/components/ui";
import { atualizarEpoca } from "../../actions";

function paraDataInput(data: Date) {
  return data.toISOString().slice(0, 10);
}

export default async function EditarEpocaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const epoca = await prisma.epoca.findUnique({ where: { id } });
  if (!epoca) notFound();

  const atualizarComId = atualizarEpoca.bind(null, epoca.id);

  return (
    <div>
      <PageHeader title="Editar época" />
      <form action={atualizarComId} className="max-w-md space-y-4">
        <div>
          <label htmlFor="titulo" className={labelClass}>
            Título
          </label>
          <input id="titulo" name="titulo" required defaultValue={epoca.titulo} className={inputClass} />
        </div>

        <div>
          <label htmlFor="tema" className={labelClass}>
            Tema
          </label>
          <input id="tema" name="tema" defaultValue={epoca.tema ?? ""} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dataInicio" className={labelClass}>
              Início
            </label>
            <input
              id="dataInicio"
              name="dataInicio"
              type="date"
              required
              defaultValue={paraDataInput(epoca.dataInicio)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="dataFim" className={labelClass}>
              Fim
            </label>
            <input
              id="dataFim"
              name="dataFim"
              type="date"
              required
              defaultValue={paraDataInput(epoca.dataFim)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="descricao" className={labelClass}>
            Descrição
          </label>
          <textarea id="descricao" name="descricao" rows={3} defaultValue={epoca.descricao ?? ""} className={inputClass} />
        </div>

        <FormActions cancelHref="/epocas" />
      </form>
    </div>
  );
}
