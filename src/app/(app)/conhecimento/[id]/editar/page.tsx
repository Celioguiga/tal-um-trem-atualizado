"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { atualizarArtigo } from "../../actions";
import { PageHeader, FormActions } from "@/components/ui";
import { useEffect, useState } from "react";
import prisma from "@/lib/prisma";

interface Artigo {
  id: string;
  titulo: string;
  categoria: string | null;
  conteudo: string;
  tags: string | null;
}

const schema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  categoria: z.string().optional(),
  conteudo: z.string().min(1, "Conteúdo é obrigatório"),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-900 mb-1";

export default function EditarArtigo() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [artigo, setArtigo] = useState<Artigo | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    async function loadData() {
      const artigoData = await prisma.conhecimentoArtigo.findUnique({
        where: { id },
      });

      if (artigoData) {
        setArtigo(artigoData);
        reset({
          titulo: artigoData.titulo,
          categoria: artigoData.categoria || "",
          conteudo: artigoData.conteudo,
          tags: artigoData.tags || "",
        });
      }
    }
    loadData();
  }, [id, reset]);

  async function onSubmit(data: FormData) {
    await atualizarArtigo(id, data);
    router.push(`/conhecimento/${id}`);
  }

  if (!artigo) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <PageHeader title={`Editar: ${artigo.titulo}`} />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className={labelClass}>Título *</label>
            <input
              type="text"
              {...register("titulo")}
              className={inputClass}
              placeholder="Título do artigo ou recurso"
            />
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-600">{errors.titulo.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Categoria</label>
            <input
              type="text"
              {...register("categoria")}
              className={inputClass}
              placeholder="Ex: Pedagogia, Artes, Movimento, Desenvolvimento"
            />
          </div>

          <div>
            <label className={labelClass}>Conteúdo *</label>
            <textarea
              {...register("conteudo")}
              className={inputClass}
              rows={8}
              placeholder="Conteúdo completo do artigo, recurso ou conhecimento pedagógico"
            />
            {errors.conteudo && (
              <p className="mt-1 text-sm text-red-600">{errors.conteudo.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Tags (separadas por vírgula)</label>
            <input
              type="text"
              {...register("tags")}
              className={inputClass}
              placeholder="Ex: waldorf, ritmo, natureza, desenvolvimento-infantil"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use vírgulas para separar múltiplas tags
            </p>
          </div>

          <FormActions
            isSubmitting={isSubmitting}
            submitLabel="Salvar Mudanças"
            cancelHref={`/conhecimento/${id}`}
          />
        </div>
      </form>
    </div>
  );
}
