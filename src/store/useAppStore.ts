import { create } from "zustand";
import type { User } from "@/lib/types";

// Simple global store example
// Extend this interface with your app's state
interface AppState {
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

type Setter = (
  updater: Partial<AppState> | ((state: AppState) => Partial<AppState>),
) => void;

export const useAppStore = create<AppState>((set: Setter) => ({
  theme: "light",
  setTheme: (t: "light" | "dark") => set({ theme: t }),
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));
