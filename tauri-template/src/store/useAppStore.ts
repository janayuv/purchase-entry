import { create } from "zustand";

// Simple global store example
// Extend this interface with your app's state
interface AppState {
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  counter: number;
  inc: () => void;
  reset: () => void;
}

type Setter = (
  updater: Partial<AppState> | ((state: AppState) => Partial<AppState>),
) => void;

export const useAppStore = create<AppState>((set: Setter) => ({
  theme: "light",
  setTheme: (t: "light" | "dark") => set({ theme: t }),
  counter: 0,
  inc: () => set((s: AppState) => ({ counter: s.counter + 1 })),
  reset: () => set({ counter: 0 }),
}));
