"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { criarMusica } from "../actions";
import { PageHeader, FormActions } from "@/components/ui";
import { useEffect, useState } from "react";

interface Turma {
  id: string;
  nome: string;
}

interface Epoca {
  id: string;
  titulo: string;
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

export default function NovaMusica() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [epocas, setEpocas] = useState<Epoca[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    async function loadData() {
      const [turmasData, epocasData] = await Promise.all([
        prisma.turma.findMany({ orderBy: { nome: "asc" } }),
        prisma.epoca.findMany({ orderBy: { dataInicio: "desc" } }),
      ]);
      setTurmas(turmasData);
      setEpocas(epocasData);
    }
    loadData();
  }, []);

  async function onSubmit(data: FormData) {
    await criarMusica(data);
    router.push("/musicas");
  }

  return (
    <div>
      <PageHeader title="Nova Música" />

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
            submitLabel="Criar Música"
            cancelHref="/musicas"
          />
        </div>
      </form>
    </div>
  );
}
