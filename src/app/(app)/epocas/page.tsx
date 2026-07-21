import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState } from "@/components/ui";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { excluirEpoca } from "./actions";

const formatador = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default async function EpocasPage() {
  const epocas = await prisma.epoca.findMany({ orderBy: { dataInicio: "desc" } });

  return (
    <div>
      <PageHeader
        title="Épocas"
        description="Blocos temáticos (épocas) do currículo Waldorf."
        action={{ href: "/epocas/nova", label: "Nova época" }}
      />

      {epocas.length === 0 ? (
        <EmptyState message="Nenhuma época cadastrada ainda." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Tema</th>
                <th className="px-4 py-3 font-medium">Período</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {epocas.map((epoca) => (
                <tr key={epoca.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-stone-900">{epoca.titulo}</td>
                  <td className="px-4 py-3 text-stone-600">{epoca.tema ?? "—"}</td>
                  <td className="px-4 py-3 text-stone-600">
                    {formatador.format(epoca.dataInicio)} – {formatador.format(epoca.dataFim)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/epocas/${epoca.id}/editar`}
                        className="text-sm font-medium text-stone-600 hover:text-stone-900"
                      >
                        Editar
                      </Link>
                      <form action={excluirEpoca}>
                        <input type="hidden" name="id" value={epoca.id} />
                        <ConfirmDeleteButton confirmMessage={`Excluir a época "${epoca.titulo}"?`} />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
