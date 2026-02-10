'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  emailConfirmed?: boolean;
  roles?: string[];
}


interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; emailConfirmed?: boolean }>;
  register: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; error?: string; emailConfirmed?: boolean }>;
  loginWithGoogle: () => void;
  loginWithFacebook: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// TODO: Look at this API_URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 
  (typeof window !== 'undefined' && process.env.services__apiservice__https__0) ||
  'https://localhost:7360';

const TOKEN_KEY = 'xuthi_auth_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  // Check URL for token (OAuth callback)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      
      if (urlToken) {
        localStorage.setItem(TOKEN_KEY, urlToken);
        setToken(urlToken);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const currentToken = token || localStorage.getItem(TOKEN_KEY);
    if (!currentToken) return;
    
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else if (response.status === 401) {
        // Token expired
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  }, [token]);

  // Fetch user when token changes
  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setUser(null);
    }
  }, [token, refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser({
          id: data.userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          emailConfirmed: data.emailConfirmed,
        });
        return { success: true, emailConfirmed: data.emailConfirmed };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.message || 'Invalid credentials' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
        setUser({
          id: data.userId,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          emailConfirmed: data.emailConfirmed,
        });
        return { success: true, emailConfirmed: data.emailConfirmed };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.errors?.join(', ') || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const loginWithGoogle = () => {
    const returnUrl = encodeURIComponent(window.location.origin + '/auth/callback');
    window.location.href = `${API_URL}/api/auth/login-google?returnUrl=${returnUrl}`;
  };

  const loginWithFacebook = () => {
    const returnUrl = encodeURIComponent(window.location.origin + '/auth/callback');
    window.location.href = `${API_URL}/api/auth/login-facebook?returnUrl=${returnUrl}`;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, error: errorData.error || 'Failed to send verification email' };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        loginWithFacebook,
        logout,
        refreshUser,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
