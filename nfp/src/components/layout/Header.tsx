import { useAuth } from "../../lib/auth";
import { useTheme } from "../../lib/theme";

type Props = {
  title?: string;
};

export function Header({ title }: Props) {
  const { user } = useAuth();
  const { vars } = useTheme();

  return (
    <header className="h-16 flex items-center justify-between px-8"
      style={{
        background: vars["--surface"],
        borderBottom: `1px solid ${vars["--border"]}`,
      }}
    >
      <h2 className="text-lg font-semibold" style={{ color: vars["--text"], fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        {title ?? "Dashboard"}
      </h2>
      <div className="flex items-center gap-4">
        {user?.plan === "free" ? (
          <span className="text-xs px-2.5 py-1 rounded-full"
            style={{ color: "#F07300", background: "#F0730020", border: "1px solid #F0730040" }}
          >
            Free · <span className="underline cursor-pointer">Upgrade</span>
          </span>
        ) : (
          <span className="text-xs px-2.5 py-1 rounded-full"
            style={{ color: "#00B050", background: "#00B05020", border: "1px solid #00B05040" }}
          >
            Essencial
          </span>
        )}
      </div>
    </header>
  );
}
