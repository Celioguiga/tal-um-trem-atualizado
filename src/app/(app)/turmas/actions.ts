"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function parseTurma(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const anoLetivo = Number(formData.get("anoLetivo"));

  if (!nome) throw new Error("Nome da turma é obrigatório.");
  if (!Number.isInteger(anoLetivo)) throw new Error("Ano letivo inválido.");

  return { nome, anoLetivo };
}

export async function criarTurma(formData: FormData) {
  const dados = parseTurma(formData);
  await prisma.turma.create({ data: dados });
  revalidatePath("/turmas");
  redirect("/turmas");
}

export async function atualizarTurma(id: string, formData: FormData) {
  const dados = parseTurma(formData);
  await prisma.turma.update({ where: { id }, data: dados });
  revalidatePath("/turmas");
  redirect("/turmas");
}

export async function excluirTurma(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.turma.delete({ where: { id } });
  revalidatePath("/turmas");
}
