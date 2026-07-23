import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [totalTurmas, totalAlunos, totalEpocas, totalHorarios, totalPlanos, totalFaltas] = await Promise.all([
    prisma.turma.count(),
    prisma.aluno.count(),
    prisma.epoca.count(),
    prisma.horario.count(),
    prisma.planoDeAula.count(),
    prisma.falta.count(),
  ]);

  const cartoes = [
    { href: "/turmas", label: "Turmas", valor: totalTurmas },
    { href: "/alunos", label: "Alunos", valor: totalAlunos },
    { href: "/epocas", label: "Épocas", valor: totalEpocas },
    { href: "/horarios", label: "Horários", valor: totalHorarios },
    { href: "/planejamento", label: "Planos", valor: totalPlanos },
    { href: "/registros", label: "Registros", valor: totalFaltas },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900">Painel</h1>
        <p className="mt-1 text-sm text-stone-500">Visão geral da sua escola.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
        {cartoes.map((cartao) => (
          <Link
            key={cartao.href}
            href={cartao.href}
            className="rounded-lg border border-stone-200 bg-white p-5 hover:border-stone-300"
          >
            <p className="text-2xl font-semibold text-stone-900">{cartao.valor}</p>
            <p className="mt-1 text-sm text-stone-500">{cartao.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
