import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  phone: string;
  fullName: string;
  role: 'RIDER' | 'DRIVER' | 'ADMIN';
  isDriver?: boolean;
  wallet?: { balance: number; currency: string };
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  updateWalletBalance: (balance: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      login: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      setUser: (user) => set({ user }),
      updateWalletBalance: (balance) =>
        set((state) => ({
          user: state.user ? { ...state.user, wallet: { ...state.user.wallet!, balance } } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);