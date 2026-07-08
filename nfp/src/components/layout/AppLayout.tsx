import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useTheme } from "../../lib/theme";

type Props = {
  children: ReactNode;
  title?: string;
};

export function AppLayout({ children, title }: Props) {
  const { vars } = useTheme();
  return (
    <div className="min-h-screen flex" style={{ background: vars["--bg"], color: vars["--text"] }}>
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={title} />
        <main className="flex-1 p-8 pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
