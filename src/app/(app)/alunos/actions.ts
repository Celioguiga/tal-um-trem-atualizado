"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

function parseAluno(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const turmaId = String(formData.get("turmaId") ?? "");
  const dataNascRaw = String(formData.get("dataNasc") ?? "");
  const responsavel = String(formData.get("responsavel") ?? "").trim() || null;
  const contato = String(formData.get("contato") ?? "").trim() || null;
  const observacoesGerais = String(formData.get("observacoesGerais") ?? "").trim() || null;

  if (!nome) throw new Error("Nome do aluno é obrigatório.");
  if (!turmaId) throw new Error("Selecione uma turma.");

  return {
    nome,
    turmaId,
    dataNasc: dataNascRaw ? new Date(dataNascRaw) : null,
    responsavel,
    contato,
    observacoesGerais,
  };
}

export async function criarAluno(formData: FormData) {
  const dados = parseAluno(formData);
  await prisma.aluno.create({ data: dados });
  revalidatePath("/alunos");
  revalidatePath(`/turmas/${dados.turmaId}`);
  redirect("/alunos");
}

export async function atualizarAluno(id: string, formData: FormData) {
  const dados = parseAluno(formData);
  await prisma.aluno.update({ where: { id }, data: dados });
  revalidatePath("/alunos");
  revalidatePath(`/turmas/${dados.turmaId}`);
  redirect("/alunos");
}

export async function excluirAluno(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.aluno.delete({ where: { id } });
  revalidatePath("/alunos");
}
