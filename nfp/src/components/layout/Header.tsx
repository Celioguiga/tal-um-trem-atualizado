import { useAuth } from "../../lib/auth";

type Props = {
  title?: string;
};

export function Header({ title }: Props) {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-8">
      <h2 className="text-lg font-semibold text-white">
        {title ?? "Dashboard"}
      </h2>
      <div className="flex items-center gap-4">
        <span className="text-xs text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-full">
          {user?.plan === "free" ? "Free" : "Essencial"}
        </span>
      </div>
    </header>
  );
}
