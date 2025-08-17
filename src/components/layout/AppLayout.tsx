import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "../theme/ThemeToggle";

export function AppLayout() {
  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="bg-background/60 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
          <div className="flex items-center justify-end px-4 py-2">
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
