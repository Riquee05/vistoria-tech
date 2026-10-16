import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'admin';
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ data: any; error: Error | null }>;
  signOut: () => Promise<void>;
  signInDemo: () => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const DEMO_STORAGE_KEY = 'vt_demo_admin_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to load or build profile safely without blocking the app
  const syncProfile = async (authUser: User) => {
    const defaultProfile: Profile = {
      id: authUser.id,
      email: authUser.email || '',
      full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Administrador',
      role: 'admin',
    };

    try {
      // Try to read profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (data && !error) {
        setProfile({ ...data, role: 'admin' });
      } else {
        // Upsert profile in DB
        await supabase
          .from('profiles')
          .upsert({
            id: authUser.id,
            email: authUser.email || '',
            full_name: defaultProfile.full_name,
            role: 'admin',
          })
          .catch(() => null);

        setProfile(defaultProfile);
      }
    } catch {
      setProfile(defaultProfile);
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Check if demo admin is saved in localStorage
    const savedDemo = localStorage.getItem(DEMO_STORAGE_KEY);
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        setProfile(parsed);
        setUser({ id: parsed.id, email: parsed.email } as User);
        setIsLoading(false);
        return;
      } catch {
        localStorage.removeItem(DEMO_STORAGE_KEY);
      }
    }

    // 2. Initialize from Supabase auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        syncProfile(session.user).finally(() => {
          if (mounted) setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    }).catch(() => {
      if (mounted) setIsLoading(false);
    });

    // 3. Listen to auth state changes (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await syncProfile(session.user);
      } else {
        // If not in demo mode, clear user
        if (!localStorage.getItem(DEMO_STORAGE_KEY)) {
          setUser(null);
          setProfile(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    // Clear demo mode if present
    localStorage.removeItem(DEMO_STORAGE_KEY);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setIsLoading(false);
      return { error };
    }

    if (data.user) {
      setUser(data.user);
      await syncProfile(data.user);
    }

    setIsLoading(false);
    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName || 'Administrador',
          role: 'admin',
        },
      },
    });

    if (data.user) {
      // Auto save profile in DB if user is already confirmed or created
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email.trim(),
        full_name: fullName || 'Administrador',
        role: 'admin',
      }).catch(() => null);
    }

    return { data, error };
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setUser(null);
    setProfile(null);
    await supabase.auth.signOut().catch(() => null);
  };

  const signInDemo = () => {
    const demoProfile: Profile = {
      id: 'demo-admin-id-001',
      email: 'admin@vistoriatech.com',
      full_name: 'Administrador Bancada',
      role: 'admin',
    };
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoProfile));
    setUser({ id: demoProfile.id, email: demoProfile.email } as User);
    setProfile(demoProfile);
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        signInDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}