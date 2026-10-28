import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiFetch } from '../services/apiClient';

export interface LearningPreference {
  stateCode?: string;
  categoryCode?: string;
  subCategory?: string;
  subCategoryTitle?: string;
  stream?: string;
  boardOrGrade?: string;
  isPreferenceSet?: boolean;
}

export interface UserProfile {
  _id: string;
  userId: string;
  name: string;
  mobile: string;
  email?: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'EXECUTIVE';
  referralCode: string;
  selectedState?: any;
  stateCode?: string;
  isMobileVerified?: boolean;
  learningPreference?: LearningPreference;
}

interface AuthContextType {
  user: UserProfile | null;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'EXECUTIVE';
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: UserProfile, token: string) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  hasRole: (...allowedRoles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await apiFetch<{ user: UserProfile }>('/auth/me');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
      }
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = (userData: UserProfile, token: string) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('accessToken', token);
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      // Ignore network errors on logout
    }
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const hasRole = (...allowedRoles: string[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  const role = user?.role || 'STUDENT';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshProfile,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
