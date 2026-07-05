import { NavLink } from "react-router-dom";
import { useAuth } from "../../lib/auth";

const links = [
  { to: "/app", label: "Início", icon: "◈" },
  { to: "/app/nfp", label: "Note Form Pro", icon: "♩" },
  { to: "/app/maestro", label: "Maestro IA", icon: "◆" },
  { to: "/app/salier", label: "SalierIA", icon: "✦" },
  { to: "/app/transcribe", label: "Transcrever", icon: "⇄" },
  { to: "/app/game", label: "Pássaro Mágico", icon: "▶" },
  { to: "/app/perfil", label: "Perfil e Privacidade", icon: "⚙" },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col z-40">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-white">Note Form Pro</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Synemusic — RNG</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-rng-sol/10 text-rng-sol font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`
            }
          >
            <span className="text-base w-5 text-center">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-zinc-800 space-y-2">
        <div className="px-3 py-2 text-sm text-zinc-400 truncate">
          {user?.name}
        </div>
        <button
          onClick={logout}
          className="w-full px-3 py-2 text-sm text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors text-left"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
