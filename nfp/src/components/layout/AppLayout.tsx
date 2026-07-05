import { type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

type Props = {
  children: ReactNode;
  title?: string;
};

export function AppLayout({ children, title }: Props) {
  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Header title={title} />
        <main className="flex-1 p-8 pt-6">
          {children}
        </main>
      </div>
    </div>
  );
}
