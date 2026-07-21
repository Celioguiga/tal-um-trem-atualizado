"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function parseHorario(formData: FormData) {
  const turmaId = String(formData.get("turmaId") ?? "");
  const diaSemana = Number(formData.get("diaSemana"));
  const horaInicio = String(formData.get("horaInicio") ?? "");
  const horaFim = String(formData.get("horaFim") ?? "");
  const local = String(formData.get("local") ?? "").trim() || null;

  if (!turmaId) throw new Error("Selecione uma turma.");
  if (!Number.isInteger(diaSemana) || diaSemana < 0 || diaSemana > 6) {
    throw new Error("Dia da semana inválido.");
  }
  if (!horaInicio || !horaFim) throw new Error("Horário de início e fim são obrigatórios.");

  return { turmaId, diaSemana, horaInicio, horaFim, local };
}

export async function criarHorario(formData: FormData) {
  const dados = parseHorario(formData);
  await prisma.horario.create({ data: dados });
  revalidatePath("/horarios");
  revalidatePath(`/turmas/${dados.turmaId}`);
  redirect("/horarios");
}

export async function atualizarHorario(id: string, formData: FormData) {
  const dados = parseHorario(formData);
  await prisma.horario.update({ where: { id }, data: dados });
  revalidatePath("/horarios");
  revalidatePath(`/turmas/${dados.turmaId}`);
  redirect("/horarios");
}

export async function excluirHorario(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.horario.delete({ where: { id } });
  revalidatePath("/horarios");
}
