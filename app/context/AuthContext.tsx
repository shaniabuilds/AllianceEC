import React, { createContext, useContext, useState, useEffect } from 'react';
import { setAuthToken, getAuthToken } from '../services/apiClient';
import { UserProfile, fetchUserProfile } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  selectedState: string;
  setSelectedState: (stateCode: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshProfile: async () => {},
  selectedState: 'GLOBAL',
  setSelectedState: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>('GLOBAL');

  const login = (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    setAuthToken(newToken);
    if (newUser.stateCode) {
      setSelectedState(newUser.stateCode);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
  };

  const refreshProfile = async () => {
    if (!token && !getAuthToken()) return;
    const res = await fetchUserProfile();
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      if (res.data.user.stateCode) {
        setSelectedState(res.data.user.stateCode);
      }
    }
  };

  useEffect(() => {
    // Initial check
    setIsLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        refreshProfile,
        selectedState,
        setSelectedState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
