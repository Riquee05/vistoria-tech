import { createClient } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'
);

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

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={{ profile, signOut, isLoading }}>{children}</AuthContext.Provider>
  );
}