import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

const modulosAtivos = [
  { href: "/", label: "Painel" },
  { href: "/turmas", label: "Turmas" },
  { href: "/alunos", label: "Alunos" },
  { href: "/epocas", label: "Épocas" },
  { href: "/horarios", label: "Horários" },
  { href: "/planejamento", label: "Planejamento" },
  { href: "/registros", label: "Registros" },
  { href: "/avaliacoes", label: "Avaliações" },
  { href: "/musicas", label: "Banco de Músicas" },
];

const modulosEmBreve = [
  "Conhecimento Waldorf",
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      <aside className="flex w-64 shrink-0 flex-col border-r border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-5 py-4">
          <p className="text-sm font-semibold text-stone-900">Escola Waldorf</p>
          <p className="text-xs text-stone-500">Gestão pedagógica</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {modulosAtivos.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              {item.label}
            </Link>
          ))}

          <p className="mt-4 px-3 text-xs font-semibold uppercase tracking-wide text-stone-400">
            Em breve
          </p>
          {modulosEmBreve.map((label) => (
            <span
              key={label}
              className="cursor-not-allowed rounded-md px-3 py-2 text-sm text-stone-400"
            >
              {label}
            </span>
          ))}
        </nav>

        <div className="border-t border-stone-200 px-5 py-4">
          <p className="truncate text-sm text-stone-700">{session.user.name}</p>
          <p className="truncate text-xs text-stone-400">{session.user.email}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className="mt-2 text-xs font-medium text-stone-500 hover:text-stone-800">
              Sair
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
