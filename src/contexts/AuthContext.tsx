import { supabase } from '@/lib/supabase';
import { createContext, useContext, useEffect, useState } from 'react';

export const AuthContext = createContext<any>(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then((user) => {
      if (user?.user?.id) {
        supabase.from('profiles').select('*').eq('id', user.user.id).single().then((res: any) => {
          setProfile(res?.data);
        });
      }
      setIsLoading(false);
    });
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    });
    return { data, error };
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={{ profile, signOut, signUp, isLoading }}>{children}</AuthContext.Provider>
  );
}