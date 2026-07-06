import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  dark: boolean;
  toggle: () => void;
  setDark: (v: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      dark: false,
      toggle: () => set((s) => ({ dark: !s.dark })),
      setDark: (v) => set({ dark: v }),
    }),
    {
      name: 'kinetic-theme',
      version: 1,
      partialize: (state) => ({ dark: state.dark }),
      merge: (persisted, current) => ({ ...current, ...(persisted as Partial<ThemeState>) }),
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        return { dark: current.dark || false } as ThemeState;
      },
    },
  ),
);
