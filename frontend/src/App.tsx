import React, { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './routes/router';
import { ErrorBoundary } from '@/components/shared';
import { useThemeStore } from '@/stores/themeStore';
import { registerEventHandlers } from '@/bootstrap/eventHandlers';
import { migrateExistingProjects } from '@/features/procurement/procurementService';
import { useProjectStore } from '@/stores/projectStore';
import { useProcurementStore } from '@/features/procurement/procurementStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  useEffect(() => {
    const unsub = useThemeStore.subscribe((s) =>
      document.documentElement.classList.toggle('dark', s.dark),
    );
    if (useThemeStore.getState().dark) {
      document.documentElement.classList.add('dark');
    }
    return unsub;
  }, []);

  // Register domain event handlers once at startup
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    registerEventHandlers();

    // Wait for Zustand persist hydration before migrating
    const tryMigrate = () => {
      if (useProjectStore.persist.hasHydrated() && useProcurementStore.persist.hasHydrated()) {
        const projects = useProjectStore.getState().projects;
        migrateExistingProjects(projects);
        return true;
      }
      return false;
    };

    if (!tryMigrate()) {
      const unsub1 = useProjectStore.persist.onFinishHydration(() => tryMigrate());
      const unsub2 = useProcurementStore.persist.onFinishHydration(() => tryMigrate());
      return () => { unsub1(); unsub2(); };
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <AppRouter />
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
