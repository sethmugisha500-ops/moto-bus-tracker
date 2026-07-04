// store/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'RIDER' | 'DRIVER' | 'ADMIN' | 'OPERATOR';
  isVerified: boolean;
  fullName?: string;
  wallet?: {
    balance: number;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { name: string; phone: string; password: string; email?: string; role?: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (phone: string, password: string) => {
        set({ isLoading: true });
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://moto-bus-backend.onrender.com/api';
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || 'Login failed');
          }

          if (data.data?.tokens?.accessToken) {
            const userData = data.data.user;
            set({
              user: userData,
              token: data.data.tokens.accessToken,
              isAuthenticated: true,
              isLoading: false,
            });
            
            localStorage.setItem('token', data.data.tokens.accessToken);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || 'Login failed');
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://moto-bus-backend.onrender.com/api';
          const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          const response = await res.json();

          if (!res.ok) {
            throw new Error(response.message || 'Registration failed');
          }

          if (response.data?.tokens?.accessToken) {
            const userData = response.data.user;
            set({
              user: userData,
              token: response.data.tokens.accessToken,
              isAuthenticated: true,
              isLoading: false,
            });
            
            localStorage.setItem('token', response.data.tokens.accessToken);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error: any) {
          set({ isLoading: false });
          throw new Error(error.message || 'Registration failed');
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      setUser: (user) => {
        set({ user });
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          localStorage.removeItem('user');
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);