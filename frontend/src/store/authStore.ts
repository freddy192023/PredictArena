import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================
// Types
// ============================================================
export interface User {
  id: string;
  email: string;
  username: string;
  arenaCoins: number;
  avatarUrl?: string;
  role: 'USER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateCoins: (newBalance: number) => void;
}

// ============================================================
// Auth Store (persisted in localStorage)
// ============================================================
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user, token) =>
        set({ user, token, isAuthenticated: true, error: null }),

      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, error: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      updateCoins: (newBalance) =>
        set((state) => ({
          user: state.user ? { ...state.user, arenaCoins: newBalance } : null,
        })),
    }),
    {
      name: 'predictarena-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
