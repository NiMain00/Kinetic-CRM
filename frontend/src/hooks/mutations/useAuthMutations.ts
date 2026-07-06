import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';

export function useLoginMutation() {
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (data: { username: string; password: string }) => authService.login(data),
    onSuccess: (res) => {
      const { token, user } = res.data.data;
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
