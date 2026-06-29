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
    },
  ),
);
