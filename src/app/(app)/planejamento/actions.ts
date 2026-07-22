"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const planoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  data: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
  objetivos: z.string().optional(),
  conteudo: z.string().optional(),
  materiais: z.string().optional(),
  turmaId: z.string().min(1, "Turma é obrigatória"),
  epocaId: z.string().optional().nullable(),
});

export async function criarPlano(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = planoSchema.parse(data);

  await prisma.planoDeAula.create({
    data: {
      titulo: parsed.titulo,
      data: new Date(parsed.data),
      objetivos: parsed.objetivos || null,
      conteudo: parsed.conteudo || null,
      materiais: parsed.materiais || null,
      turmaId: parsed.turmaId,
      epocaId: parsed.epocaId || null,
    },
  });

  revalidatePath("/planejamento");
  return { success: true };
}

export async function atualizarPlano(id: string, formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = planoSchema.parse(data);

  await prisma.planoDeAula.update({
    where: { id },
    data: {
      titulo: parsed.titulo,
      data: new Date(parsed.data),
      objetivos: parsed.objetivos || null,
      conteudo: parsed.conteudo || null,
      materiais: parsed.materiais || null,
      turmaId: parsed.turmaId,
      epocaId: parsed.epocaId || null,
    },
  });

  revalidatePath("/planejamento");
  revalidatePath(`/planejamento/${id}`);
  return { success: true };
}

export async function excluirPlano(id: string) {
  await prisma.planoDeAula.delete({ where: { id } });
  revalidatePath("/planejamento");
  return { success: true };
}
