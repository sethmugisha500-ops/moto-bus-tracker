// app/services/auth.service.ts
'use client';

/**
 * Auth Service - Frontend only
 * Handles authentication state management using localStorage
 * This is a client-side only service (uses 'use client' directive)
 */

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'RIDER' | 'DRIVER' | 'ADMIN';
  isActive: boolean;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

class AuthService {
  private static instance: AuthService;
  private tokenKey = 'token';
  private userKey = 'user';
  private refreshTokenKey = 'refreshToken';

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Check if code is running in browser
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  /**
   * Get the stored authentication token
   */
  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Set the authentication token
   */
  setToken(token: string): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Get the stored refresh token
   */
  getRefreshToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Set the refresh token
   */
  setRefreshToken(token: string): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.refreshTokenKey, token);
  }

  /**
   * Get the stored user data
   */
  getUser(): User | null {
    if (!this.isBrowser()) return null;
    try {
      const userData = localStorage.getItem(this.userKey);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  /**
   * Set the user data
   */
  setUser(user: User): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: User['role'] | User['role'][]): boolean {
    const user = this.getUser();
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }

  /**
   * Check if user is an admin
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Check if user is a driver
   */
  isDriver(): boolean {
    return this.hasRole('DRIVER');
  }

  /**
   * Check if user is a rider
   */
  isRider(): boolean {
    return this.hasRole('RIDER');
  }

  /**
   * Login - store tokens and user data
   */
  login(accessToken: string, user: User, refreshToken?: string): void {
    this.setToken(accessToken);
    this.setUser(user);
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
  }

  /**
   * Logout - clear all stored data
   */
  logout(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.refreshTokenKey);
    // Clear any other stored data
    sessionStorage.clear();
  }

  /**
   * Update user data
   */
  updateUser(user: Partial<User>): void {
    const currentUser = this.getUser();
    if (currentUser) {
      this.setUser({ ...currentUser, ...user });
    }
  }

  /**
   * Get authorization headers for API requests
   */
  getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Get authorization headers as URLSearchParams for GET requests
   */
  getAuthParams(): Record<string, string> {
    const token = this.getToken();
    return token ? { token } : {};
  }

  /**
   * Refresh token - call this when token is about to expire
   * Note: This requires a refresh token endpoint on your backend
   */
  async refreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      if (data.success && data.data?.tokens?.accessToken) {
        const newToken = data.data.tokens.accessToken;
        this.setToken(newToken);
        return newToken;
      }
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  /**
   * Get user ID from stored user data
   */
  getUserId(): string | null {
    const user = this.getUser();
    return user?.id || null;
  }

  /**
   * Get user name
   */
  getUserName(): string {
    const user = this.getUser();
    return user?.name || 'User';
  }

  /**
   * Get user phone
   */
  getUserPhone(): string | null {
    const user = this.getUser();
    return user?.phone || null;
  }

  /**
   * Get user email
   */
  getUserEmail(): string | null {
    const user = this.getUser();
    return user?.email || null;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Default export for convenience
export default authService;