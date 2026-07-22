import React, { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import toast from 'react-hot-toast';
import AppRouter from './routes/router';
import { ErrorBoundary } from '@/components/shared';
import { useThemeStore } from '@/stores/themeStore';
import { registerEventHandlers } from '@/bootstrap/eventHandlers';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: any) => {
        const message = error?.message || 'Terjadi kesalahan. Silakan coba lagi.';
        toast.error(message);
      },
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



  // Register domain event handlers immediately (no race condition with user clicks)
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    registerEventHandlers();

    // Clean up old persisted data from localStorage (persist middleware removed)
    const oldKeys = ['kinetic-prospects', 'kinetic-master-data', 'kinetic-projects', 'kinetic-customers', 'kinetic-notifications', 'kinetic-input-config', 'kinetic-users', 'kinetic-categories', 'kinetic-competitors'];
    for (const key of oldKeys) {
      try { localStorage.removeItem(key); } catch {}
    }

    // Migrate existing projects to procurement (deferred after paint)
    const migrate = async () => {
      try {
        const [{ useProjectStore }, { useProcurementStore }, { migrateExistingProjects }] = await Promise.all([
          import('@/stores/projectStore'),
          import('@/features/procurement/procurementStore'),
          import('@/features/procurement/procurementService'),
        ]);
        const projects = useProjectStore.getState().projects;
        if (projects.length > 0) {
          migrateExistingProjects(projects);
        }
      } catch (err) {
        console.error('[App] Migration failed:', err);
      }
    };
    const timer = setTimeout(migrate, 100);
    return () => { clearTimeout(timer); };
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </BrowserRouter>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
