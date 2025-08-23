import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../utils/api';

// Define the authentication context type
interface AuthContextType {
  currentUser: any | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: { name: string; username?: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Create a hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load current session from backend
  const loadSession = async () => {
    try {
      setLoading(true);
      const me = await api.noCache.get('/auth/me');
      setCurrentUser(me?.user || null);
    } catch (e: any) {
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      await api.post('/auth/login', { email, password });
      await loadSession();
    } catch (err: any) {
      setError(err?.message || 'نەتوانرا بچیتە ژوورەوە');
      throw err;
    }
  };

  // Sign up function
  const signUp = async (params: { name: string; username?: string; email: string; password: string }) => {
    setError(null);
    try {
      await api.post('/auth/signup', params);
      // After signup, auto-login might be set via cookie by backend; refresh session
      await loadSession();
    } catch (err: any) {
      setError(err?.message || 'سەرکەوتوو نەبوو لە دروستکردنی هەژمار');
      throw err;
    }
  };

  // Sign out function
  const signOut = async () => {
    setError(null);
    try {
      await api.post('/auth/logout', {});
      setCurrentUser(null);
    } catch (err: any) {
      setError(err.message || 'سەرکەوتوو نەبوو لە دەرچوون');
      throw err;
    }
  };

  const refresh = async () => {
    await loadSession();
  };

  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated: !!currentUser,
    signIn,
    signUp,
    signOut,
    refresh
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 