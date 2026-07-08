import { NavLink } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useTheme } from "../../lib/theme";

const sections = [
  {
    label: "CRIAÇÃO",
    links: [
      { to: "/app/nfp",       label: "Editor RNG" },
      { to: "/app/tablatura", label: "Real Tablatura" },
    ],
  },
  {
    label: "GESTÃO",
    links: [
      { to: "/app/dashboard", label: "Dashboard" },
      { to: "/app/booklets",  label: "Booklets" },
      { to: "/app/campanhas", label: "Campanhas" },
      { to: "/app/calendar",  label: "Calendário" },
    ],
  },
  {
    label: "ECOSSISTEMA",
    links: [
      { to: "/app/references",label: "Referências" },
      { to: "/app/brand",     label: "Identidade" },
    ],
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const { vars } = useTheme();

  return (
    <aside
      className="w-64 flex flex-col h-screen sticky top-0 select-none"
      style={{ background: vars["--surface"], borderRight: `1px solid ${vars["--border"]}` }}
    >
      <div className="p-4 flex flex-col items-center border-b" style={{ borderColor: vars["--border"] }}>
        <img src="/logo.png" alt="Note Form Pro" className="h-32 w-auto" />
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {sections.map((sec) => (
          <div key={sec.label}>
            <div className="text-[10px] font-semibold tracking-widest uppercase px-3 mb-1"
              style={{ color: vars["--textMuted"] }}
            >
              {sec.label}
            </div>
            {sec.links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/app/nfp"}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150"
                style={({ isActive }) => ({
                  color: isActive ? vars["--accent"] : vars["--textDim"],
                  background: isActive ? vars["--accentGlow"] : "transparent",
                })}
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: vars["--border"] }}>
        <ThemeSwitcher />
      </div>

      <div className="px-4 py-2 space-y-1 border-t" style={{ borderColor: vars["--border"] }}>
        <div className="flex items-center justify-between">
          <span className="text-xs truncate" style={{ color: vars["--textMuted"] }}>{user?.email}</span>
          <button onClick={logout} className="text-xs shrink-0 ml-2" style={{ color: "#C0001A" }}>
            Sair
          </button>
        </div>
        {user?.plan === "free" && (
          <div className="text-[10px] px-2 py-1 rounded" style={{ background: "#A69B8520", color: "#A69B85" }}>
            Free · <a href="/app/perfil" className="underline" style={{ color: "#E8A820" }}>Upgrade</a>
          </div>
        )}
        {user?.plan === "essencial" && (
          <div className="text-[10px] px-2 py-1 rounded" style={{ background: "#E8A82020", color: "#E8A820" }}>
            Essencial
          </div>
        )}
      </div>
    </aside>
  );
}
