import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/api';
import { useAuthStore } from '../store/authStore';
import type { LoginCredentials } from '../types/user';

export const useAuth = () => {
  const { user, login: storeLogin, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      storeLogin(data.user, data.token, data.refreshToken);
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: any) => authService.register(data),
    onSuccess: (data) => {
      storeLogin(data.user, data.token, data.refreshToken);
    },
  });

  return {
    user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoading: loginMutation.isPending || registerMutation.isPending,
    error: loginMutation.error || registerMutation.error,
  };
};
