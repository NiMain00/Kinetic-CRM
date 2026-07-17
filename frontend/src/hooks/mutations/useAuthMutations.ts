import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';

export function useLoginMutation() {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (data: { username: string; password: string }) => authService.login(data),
    onSuccess: (res) => {
      // Backend returns the payload directly at res.data ({ token, user }),
      // matching LoginPage. Fall back to a nested envelope defensively.
      const payload = (res.data?.data ?? res.data) as { token: string; user: any };
      const { token, user } = payload;
      login(token, user);
    },
  });
}

export function useLogoutMutation() {
  const logout = useAuthStore((s) => s.logout);

  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => logout(),
  });
}
