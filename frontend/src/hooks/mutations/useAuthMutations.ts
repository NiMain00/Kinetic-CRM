import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/auth';
import { useAuthStore } from '../../stores/authStore';

export function useAuthMutations() {
  const queryClient = useQueryClient();
  const storeLogin = useAuthStore((s) => s.login);
  const storeLogout = useAuthStore((s) => s.logout);

  const login = useMutation({
    mutationFn: (data: { username: string; password: string }) => authService.login(data),
    onSuccess: (res) => {
      const { accessToken, refreshToken, user } = res.data.data;
      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      storeLogin(accessToken, user);
    },
  });

  const logout = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      storeLogout();
      queryClient.clear();
    },
  });

  const changePassword = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data),
  });

  return { login, logout, changePassword };
}
