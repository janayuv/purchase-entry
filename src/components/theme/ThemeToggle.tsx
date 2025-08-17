import { useAppStore } from "../../store/useAppStore";

export function ThemeToggle() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      className="hover:bg-accent rounded border px-3 py-1.5 text-sm"
      onClick={() => setTheme(next)}
      title="Toggle theme"
    >
      {theme === "dark" ? "Light" : "Dark"} Mode
    </button>
  );
}
