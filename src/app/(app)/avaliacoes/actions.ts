"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const avaliacaoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  data: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
  instrucoes: z.string().optional(),
  turmaId: z.string().min(1, "Turma é obrigatória"),
  epocaId: z.string().optional().nullable(),
});

export async function criarAvaliacao(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = avaliacaoSchema.parse(data);

  await prisma.avaliacao.create({
    data: {
      titulo: parsed.titulo,
      data: new Date(parsed.data),
      instrucoes: parsed.instrucoes || null,
      turmaId: parsed.turmaId,
      epocaId: parsed.epocaId || null,
    },
  });

  revalidatePath("/avaliacoes");
  return { success: true };
}

export async function atualizarAvaliacao(id: string, formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = avaliacaoSchema.parse(data);

  await prisma.avaliacao.update({
    where: { id },
    data: {
      titulo: parsed.titulo,
      data: new Date(parsed.data),
      instrucoes: parsed.instrucoes || null,
      turmaId: parsed.turmaId,
      epocaId: parsed.epocaId || null,
    },
  });

  revalidatePath("/avaliacoes");
  revalidatePath(`/avaliacoes/${id}`);
  return { success: true };
}

export async function excluirAvaliacao(id: string) {
  await prisma.avaliacao.delete({ where: { id } });
  revalidatePath("/avaliacoes");
  return { success: true };
}
