import { NavLink } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "../ui/button";

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded px-3 py-2 text-sm ${
    isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
  }`;

export function Sidebar() {
  const { user, logout } = useAppStore();

  return (
    <aside className="w-60 shrink-0 border-r h-svh sticky top-0 flex flex-col">
      <div className="p-3 text-lg font-semibold">Inventory</div>
      <nav className="p-2 space-y-1 flex-1">
        <NavLink to="/" className={linkCls}>Dashboard</NavLink>
        <NavLink to="/purchases" className={linkCls}>Purchases</NavLink>
        <NavLink to="/suppliers" className={linkCls}>Suppliers</NavLink>
        <NavLink to="/items" className={linkCls}>Items</NavLink>
        <NavLink to="/reports" className={linkCls}>Reports</NavLink>
        <NavLink to="/settings" className={linkCls}>Settings</NavLink>
        {user?.role === "admin" && (
          <NavLink to="/users" className={linkCls}>Users</NavLink>
        )}
      </nav>
      <div className="p-2">
        <Button onClick={logout} variant="outline" className="w-full">
          Logout
        </Button>
      </div>
    </aside>
  );
}
