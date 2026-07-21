"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function parseEpoca(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const tema = String(formData.get("tema") ?? "").trim() || null;
  const dataInicioRaw = String(formData.get("dataInicio") ?? "");
  const dataFimRaw = String(formData.get("dataFim") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim() || null;

  if (!titulo) throw new Error("Título da época é obrigatório.");
  if (!dataInicioRaw || !dataFimRaw) throw new Error("Datas de início e fim são obrigatórias.");

  return {
    titulo,
    tema,
    dataInicio: new Date(dataInicioRaw),
    dataFim: new Date(dataFimRaw),
    descricao,
  };
}

export async function criarEpoca(formData: FormData) {
  const dados = parseEpoca(formData);
  await prisma.epoca.create({ data: dados });
  revalidatePath("/epocas");
  redirect("/epocas");
}

export async function atualizarEpoca(id: string, formData: FormData) {
  const dados = parseEpoca(formData);
  await prisma.epoca.update({ where: { id }, data: dados });
  revalidatePath("/epocas");
  redirect("/epocas");
}

export async function excluirEpoca(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.epoca.delete({ where: { id } });
  revalidatePath("/epocas");
}
