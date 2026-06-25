import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

type ShowNotification = (message: string, type: 'success' | 'warning' | 'error') => void;

interface PageProps {
  onShowNotification?: ShowNotification;
  onNavigatePage?: (page: string) => void;
  onSelectProject?: (id: string) => void;
  onOpenApproval?: (item: unknown) => void;
  onLoginSuccess?: (userData?: unknown) => void;
  projects?: unknown[];
}

export function withPageProps<T extends PageProps>(
  Component: React.ComponentType<T>,
): React.ComponentType<Omit<T, keyof PageProps>> {
  return function PageWithProps(props: Omit<T, keyof PageProps>) {
    const navigate = useNavigate();
    const login = useAuthStore((s) => s.login);

    const injectedProps: PageProps = {
      onShowNotification: (message, type) => {
        if (type === 'success') toast.success(message);
        else if (type === 'error') toast.error(message);
        else toast(message, { icon: '⚠️' });
      },
      onNavigatePage: (page) => {
        const pathMap: Record<string, string> = {
          dashboard: '/dashboard',
          prospects: '/prospects',
          projects: '/projects',
          approvals: '/approvals',
        };
        navigate(pathMap[page] || `/${page}`);
      },
      onSelectProject: (id) => navigate(`/projects/${id}/overview`),
      onOpenApproval: () => navigate('/approvals'),
      onLoginSuccess: (userData) => {
        login('mock-token', userData || { name: 'User' });
        navigate('/dashboard');
      },
      projects: [],
    };

    return <Component {...(props as T)} {...injectedProps} />;
  };
}
