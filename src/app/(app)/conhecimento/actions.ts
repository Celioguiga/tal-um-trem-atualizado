"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";

const artigoSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  categoria: z.string().optional(),
  conteudo: z.string().min(1, "Conteúdo é obrigatório"),
  tags: z.string().optional(),
});

export async function criarArtigo(data: unknown) {
  const validado = artigoSchema.parse(data);

  const artigo = await prisma.conhecimentoArtigo.create({
    data: validado,
  });

  revalidatePath("/conhecimento");
  return artigo;
}

export async function atualizarArtigo(id: string, data: unknown) {
  const validado = artigoSchema.parse(data);

  const artigo = await prisma.conhecimentoArtigo.update({
    where: { id },
    data: validado,
  });

  revalidatePath("/conhecimento");
  revalidatePath(`/conhecimento/${id}`);
  return artigo;
}

export async function excluirArtigo(id: string) {
  await prisma.conhecimentoArtigo.delete({
    where: { id },
  });

  revalidatePath("/conhecimento");
}
