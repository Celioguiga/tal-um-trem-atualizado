"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const faltaSchema = z.object({
  alunoId: z.string().min(1, "Aluno é obrigatório"),
  data: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
  justificada: z.enum(["true", "false"]).transform((v) => v === "true"),
  motivo: z.string().optional(),
});

const notaSchema = z.object({
  alunoId: z.string().min(1, "Aluno é obrigatório"),
  data: z.string().refine((val) => !isNaN(Date.parse(val)), "Data inválida"),
  conceito: z.string().optional(),
  valor: z.string().optional().transform((v) => (v ? parseFloat(v) : null)),
  observacao: z.string().optional(),
});

const observacaoSchema = z.object({
  alunoId: z.string().min(1, "Aluno é obrigatório"),
  conteudo: z.string().min(1, "Observação é obrigatória"),
});

export async function criarFalta(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = faltaSchema.parse(data);

  await prisma.falta.create({
    data: {
      alunoId: parsed.alunoId,
      data: new Date(parsed.data),
      justificada: parsed.justificada,
      motivo: parsed.motivo || null,
    },
  });

  revalidatePath("/registros");
  return { success: true };
}

export async function atualizarFalta(id: string, formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = faltaSchema.parse(data);

  await prisma.falta.update({
    where: { id },
    data: {
      alunoId: parsed.alunoId,
      data: new Date(parsed.data),
      justificada: parsed.justificada,
      motivo: parsed.motivo || null,
    },
  });

  revalidatePath("/registros");
  return { success: true };
}

export async function excluirFalta(id: string) {
  await prisma.falta.delete({ where: { id } });
  revalidatePath("/registros");
  return { success: true };
}

export async function criarNota(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = notaSchema.parse(data);

  await prisma.nota.create({
    data: {
      alunoId: parsed.alunoId,
      data: new Date(parsed.data),
      conceito: parsed.conceito || null,
      valor: parsed.valor,
      observacao: parsed.observacao || null,
    },
  });

  revalidatePath("/registros");
  return { success: true };
}

export async function atualizarNota(id: string, formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = notaSchema.parse(data);

  await prisma.nota.update({
    where: { id },
    data: {
      alunoId: parsed.alunoId,
      data: new Date(parsed.data),
      conceito: parsed.conceito || null,
      valor: parsed.valor,
      observacao: parsed.observacao || null,
    },
  });

  revalidatePath("/registros");
  return { success: true };
}

export async function excluirNota(id: string) {
  await prisma.nota.delete({ where: { id } });
  revalidatePath("/registros");
  return { success: true };
}

export async function criarObservacao(formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = observacaoSchema.parse(data);

  await prisma.observacao.create({
    data: {
      alunoId: parsed.alunoId,
      conteudo: parsed.conteudo,
    },
  });

  revalidatePath("/registros");
  return { success: true };
}

export async function atualizarObservacao(id: string, formData: FormData) {
  const data = Object.fromEntries(formData);
  const parsed = observacaoSchema.parse(data);

  await prisma.observacao.update({
    where: { id },
    data: {
      conteudo: parsed.conteudo,
    },
  });

  revalidatePath("/registros");
  return { success: true };
}

export async function excluirObservacao(id: string) {
  await prisma.observacao.delete({ where: { id } });
  revalidatePath("/registros");
  return { success: true };
}
