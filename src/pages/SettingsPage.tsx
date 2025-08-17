import { ThemeToggle } from "../components/theme/ThemeToggle";

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>
      <div className="space-y-2 rounded border p-4">
        <div className="text-sm font-medium">Appearance</div>
        <ThemeToggle />
      </div>
    </div>
  );
}
