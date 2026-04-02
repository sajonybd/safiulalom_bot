// src/hooks/useAuth.ts
import { useQuery } from '@tanstack/react-query';

interface User {
  first_name: string;
  last_name: string;
  provider: string;
  email: string | null;
  username: string | null;
}

interface AuthResponse {
  ok: boolean;
  authenticated: boolean;
  userId?: string;
  user?: User;
}

export function useAuth() {
  const { data, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ['auth'],
    queryFn: async () => {
      const res = await fetch('/api/session');
      if (!res.ok) throw new Error('Failed to fetch session');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  return {
    isAuthenticated: data?.authenticated ?? false,
    user: data?.user ?? null,
    userId: data?.userId ?? null,
    isLoading,
    error,
  };
}
