"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";

const musicaSchema = z.object({
  titulo: z.string().min(1, "Título é obrigatório"),
  autor: z.string().optional(),
  notacaoCromus: z.string().optional(),
  lilypond: z.string().optional(),
  partituraPdf: z.string().optional(),
  observacoes: z.string().optional(),
  turmaId: z.string().optional(),
  epocaId: z.string().optional(),
});

export async function criarMusica(data: unknown) {
  const validado = musicaSchema.parse(data);

  const musica = await prisma.musica.create({
    data: {
      ...validado,
      turmaId: validado.turmaId || null,
      epocaId: validado.epocaId || null,
    },
  });

  revalidatePath("/musicas");
  return musica;
}

export async function atualizarMusica(id: string, data: unknown) {
  const validado = musicaSchema.parse(data);

  const musica = await prisma.musica.update({
    where: { id },
    data: {
      ...validado,
      turmaId: validado.turmaId || null,
      epocaId: validado.epocaId || null,
    },
  });

  revalidatePath("/musicas");
  revalidatePath(`/musicas/${id}`);
  return musica;
}

export async function excluirMusica(id: string) {
  await prisma.musica.delete({
    where: { id },
  });

  revalidatePath("/musicas");
}
