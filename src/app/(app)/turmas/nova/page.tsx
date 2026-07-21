import { PageHeader, inputClass, labelClass, FormActions } from "@/components/ui";
import { criarTurma } from "../actions";

export default function NovaTurmaPage() {
  const anoAtual = new Date().getFullYear();

  return (
    <div>
      <PageHeader title="Nova turma" />
      <form action={criarTurma} className="max-w-md space-y-4">
        <div>
          <label htmlFor="nome" className={labelClass}>
            Nome da turma
          </label>
          <input id="nome" name="nome" required className={inputClass} placeholder="Ex: 5º ano" />
        </div>

        <div>
          <label htmlFor="anoLetivo" className={labelClass}>
            Ano letivo
          </label>
          <input
            id="anoLetivo"
            name="anoLetivo"
            type="number"
            required
            defaultValue={anoAtual}
            className={inputClass}
          />
        </div>

        <FormActions cancelHref="/turmas" />
      </form>
    </div>
  );
}
