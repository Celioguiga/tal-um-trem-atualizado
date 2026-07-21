import { PageHeader, inputClass, labelClass, FormActions } from "@/components/ui";
import { criarEpoca } from "../actions";

export default function NovaEpocaPage() {
  return (
    <div>
      <PageHeader title="Nova época" />
      <form action={criarEpoca} className="max-w-md space-y-4">
        <div>
          <label htmlFor="titulo" className={labelClass}>
            Título
          </label>
          <input id="titulo" name="titulo" required className={inputClass} placeholder="Ex: Época de Música I" />
        </div>

        <div>
          <label htmlFor="tema" className={labelClass}>
            Tema
          </label>
          <input id="tema" name="tema" className={inputClass} placeholder="Ex: Flauta doce e ritmo" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="dataInicio" className={labelClass}>
              Início
            </label>
            <input id="dataInicio" name="dataInicio" type="date" required className={inputClass} />
          </div>
          <div>
            <label htmlFor="dataFim" className={labelClass}>
              Fim
            </label>
            <input id="dataFim" name="dataFim" type="date" required className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="descricao" className={labelClass}>
            Descrição
          </label>
          <textarea id="descricao" name="descricao" rows={3} className={inputClass} />
        </div>

        <FormActions cancelHref="/epocas" />
      </form>
    </div>
  );
}
