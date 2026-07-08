import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useTheme } from "../../lib/theme";

export function DashboardLayout() {
  const { vars } = useTheme();
  return (
    <div className="flex min-h-screen" style={{ background: vars["--bg"], color: vars["--text"] }}>
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
