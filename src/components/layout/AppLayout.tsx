import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "../theme/ThemeToggle";

export function AppLayout() {
  return (
    <div className="min-h-svh flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-4 py-2 flex items-center justify-end">
            <ThemeToggle />
          </div>
        </header>
        <main className="px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
