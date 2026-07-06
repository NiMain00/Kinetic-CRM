import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  language: 'id' | 'en';
  timezone: string;
  notificationsEnabled: boolean;
  setLanguage: (lang: 'id' | 'en') => void;
  setTimezone: (tz: string) => void;
  setNotificationsEnabled: (v: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: 'id',
      timezone: 'Asia/Jakarta',
      notificationsEnabled: true,
      setLanguage: (language) => set({ language }),
      setTimezone: (timezone) => set({ timezone }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
    }),
    {
      name: 'kinetic-preferences',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const current = (persisted || {}) as any;
        // Version 0 → 1: gunakan default untuk field baru
        if (version === 0) {
          return {
            ...current,
            language: current.language || 'id',
            timezone: current.timezone || 'Asia/Jakarta',
            notificationsEnabled: current.notificationsEnabled !== undefined ? current.notificationsEnabled : true,
          };
        }
        return current as PreferencesState;
      },
    },
  ),
);
