"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { atualizarMusica } from "../../actions";
import { PageHeader, FormActions } from "@/components/ui";
import { useEffect, useState } from "react";
import prisma from "@/lib/prisma";

interface Turma {
  id: string;
  nome: string;
}

interface Epoca {
  id: string;
  titulo: string;
}

interface Musica {
  id: string;
  titulo: string;
  autor: string | null;
  notacaoCromus: string | null;
  lilypond: string | null;
  partituraPdf: string | null;
  observacoes: string | null;
  turmaId: string | null;
  epocaId: string | null;
}

const schema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  autor: z.string().optional(),
  notacaoCromus: z.string().optional(),
  lilypond: z.string().optional(),
  partituraPdf: z.string().optional(),
  observacoes: z.string().optional(),
  turmaId: z.string().optional(),
  epocaId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelClass = "block text-sm font-medium text-gray-900 mb-1";

export default function EditarMusica() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [musica, setMusica] = useState<Musica | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [epocas, setEpocas] = useState<Epoca[]>([]);

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
      const [musicaData, turmasData, epocasData] = await Promise.all([
        prisma.musica.findUnique({ where: { id } }),
        prisma.turma.findMany({ orderBy: { nome: "asc" } }),
        prisma.epoca.findMany({ orderBy: { dataInicio: "desc" } }),
      ]);

      if (musicaData) {
        setMusica(musicaData);
        reset({
          titulo: musicaData.titulo,
          autor: musicaData.autor || "",
          notacaoCromus: musicaData.notacaoCromus || "",
          lilypond: musicaData.lilypond || "",
          partituraPdf: musicaData.partituraPdf || "",
          observacoes: musicaData.observacoes || "",
          turmaId: musicaData.turmaId || "",
          epocaId: musicaData.epocaId || "",
        });
      }

      setTurmas(turmasData);
      setEpocas(epocasData);
    }
    loadData();
  }, [id, reset]);

  async function onSubmit(data: FormData) {
    await atualizarMusica(id, data);
    router.push(`/musicas/${id}`);
  }

  if (!musica) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <PageHeader title={`Editar: ${musica.titulo}`} />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className={labelClass}>Título *</label>
            <input
              type="text"
              {...register("titulo")}
              className={inputClass}
              placeholder="Nome da música"
            />
            {errors.titulo && (
              <p className="mt-1 text-sm text-red-600">{errors.titulo.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Autor</label>
            <input
              type="text"
              {...register("autor")}
              className={inputClass}
              placeholder="Compositor ou arranjador"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Turma</label>
              <select {...register("turmaId")} className={inputClass}>
                <option value="">Selecione uma turma...</option>
                {turmas.map((turma) => (
                  <option key={turma.id} value={turma.id}>
                    {turma.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Época</label>
              <select {...register("epocaId")} className={inputClass}>
                <option value="">Selecione uma época...</option>
                {epocas.map((epoca) => (
                  <option key={epoca.id} value={epoca.id}>
                    {epoca.titulo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Notação Cromus (RNFG)</label>
            <textarea
              {...register("notacaoCromus")}
              className={inputClass}
              rows={3}
              placeholder="Sintaxe de graus numéricos (ex: 1 2 3 4 5...)"
            />
          </div>

          <div>
            <label className={labelClass}>Código LilyPond</label>
            <textarea
              {...register("lilypond")}
              className={inputClass}
              rows={4}
              placeholder="Código LilyPond para partituras"
            />
          </div>

          <div>
            <label className={labelClass}>Partitura PDF</label>
            <input
              type="text"
              {...register("partituraPdf")}
              className={inputClass}
              placeholder="Caminho ou URL da partitura em PDF"
            />
          </div>

          <div>
            <label className={labelClass}>Observações</label>
            <textarea
              {...register("observacoes")}
              className={inputClass}
              rows={3}
              placeholder="Notas adicionais sobre a música"
            />
          </div>

          <FormActions
            isSubmitting={isSubmitting}
            submitLabel="Salvar Mudanças"
            cancelHref={`/musicas/${id}`}
          />
        </div>
      </form>
    </div>
  );
}
