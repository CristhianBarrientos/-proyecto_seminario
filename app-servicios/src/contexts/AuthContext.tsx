import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

type Role = 'cliente' | 'profesional';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: Role | null;
  // null = todavía no se sabe (cargando o no aplica); false = es profesional
  // pero nunca completó "Editar perfil profesional" (sin fila en professional_profiles).
  hasProfessionalProfile: boolean | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  hasProfessionalProfile: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [hasProfessionalProfile, setHasProfessionalProfile] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sesión actual al cargar la app (por si ya había un login guardado)
    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data.session);
      })
      .catch((err) => {
        console.error('[Auth] Error obteniendo sesión:', err);
        setSession(null);
      })
      .finally(() => {
        setLoading(false);
      });

    // Se actualiza automáticamente cuando el usuario inicia o cierra sesión
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    // Bfcache: al volver con el botón atrás/adelante del navegador, Chrome puede
    // restaurar la página desde caché sin re-ejecutar el JS de carga inicial,
    // mostrando la última pantalla protegida renderizada aunque ya no haya sesión.
    // Se revalida la sesión real cada vez que la página se restaura así.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        supabase.auth.getSession().then(({ data }) => {
          setSession(data.session);
        });
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) {
      setRole(null);
      return;
    }
    let cancelled = false;

    supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setRole(data?.role ?? null);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || role !== 'profesional') {
      setHasProfessionalProfile(null);
      return;
    }
    let cancelled = false;

    supabase
      .from('professional_profiles')
      .select('profile_id')
      .eq('profile_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setHasProfessionalProfile(!!data);
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, role]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, role, hasProfessionalProfile, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);