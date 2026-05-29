import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="w-full max-w-[1400px] flex-1 px-4 py-5 md:px-8 md:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
