import { useCallback, useState } from 'react';
import { mobileApi } from '../services';
import type { LoginPayload, MobileUser } from '../types';

export function useAuth() {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mobileApi.login(payload);
      setUser(response.user);
      setToken(response.token);
      return response;
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Login failed';
      setError(message);
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  return { user, token, loading, error, isAuthenticated: Boolean(token), login, logout };
}
