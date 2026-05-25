'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { getDbService, forceReloadDbService } from './db';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  dbMode: 'supabase' | 'local_storage';
  login: (email: string, role: UserRole) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, name: string, role: UserRole, phone?: string, gender?: 'male' | 'female') => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const TEST_ACCOUNTS: { email: string; role: UserRole; name: string }[] = [
  { email: 'student@hostel.com', role: 'student', name: 'Rahul Sharma (Student)' },
  { email: 'student2@hostel.com', role: 'student', name: 'Sneha Reddy (Student)' },
  { email: 'warden@hostel.com', role: 'warden', name: 'Dr. K.P. Singh (Warden)' },
  { email: 'admin@hostel.com', role: 'admin', name: 'Alok Gupta (Admin)' },
  { email: 'security@hostel.com', role: 'security', name: 'Guard Ram Prasad' },
  { email: 'mess@hostel.com', role: 'mess_manager', name: 'Chef Ramesh (Mess Mgr)' },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbMode, setDbMode] = useState<'supabase' | 'local_storage'>('local_storage');
  const router = useRouter();

  const checkUser = async () => {
    try {
      setLoading(true);
      forceReloadDbService();
      const db = getDbService();
      setDbMode(db.isSupabaseActive() ? 'supabase' : 'local_storage');
      const currentUser = await db.getCurrentUser();
      setUser(currentUser);
    } catch (e) {
      console.error('Check user error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
    // Add custom listener for localStorage updates in case DB config changes
    const handleStorageChange = () => {
      checkUser();
    };
    window.addEventListener('shms_db_config_changed', handleStorageChange);
    return () => {
      window.removeEventListener('shms_db_config_changed', handleStorageChange);
    };
  }, []);

  const login = async (email: string, role: UserRole) => {
    setLoading(true);
    try {
      const db = getDbService();
      const res = await db.login(email, role);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'An error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, name: string, role: UserRole, phone?: string, gender?: 'male' | 'female') => {
    setLoading(true);
    try {
      const db = getDbService();
      const res = await db.register(email, name, role, phone, gender);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'An error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const db = getDbService();
      await db.signOut();
      setUser(null);
      router.push('/');
    } catch (e) {
      console.error('Signout error:', e);
    } finally {
      setLoading(false);
    }
  };

  const switchRole = async (role: UserRole) => {
    const matchingAccount = TEST_ACCOUNTS.find(a => a.role === role);
    if (matchingAccount) {
      await login(matchingAccount.email, role);
    } else {
      // In case no account matches (fallback helper)
      const mockEmail = `${role}@hostel.com`;
      await login(mockEmail, role);
    }
  };

  const reloadUser = async () => {
    const db = getDbService();
    const currentUser = await db.getCurrentUser();
    setUser(currentUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, dbMode, login, register, signOut, switchRole, reloadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
