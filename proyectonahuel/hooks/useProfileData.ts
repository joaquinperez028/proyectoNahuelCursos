import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { profileCache } from '@/lib/profileCache';

type ProfileData = {
  user: {
    name: string;
    email: string;
    image: string;
    role: string;
    registrationDate: string;
    lastLogin: string;
  };
  activeCourses: any[];
  certificates: any[];
  purchases: any[];
  stats: {
    totalCourses: number;
    completedCourses: number;
    certificatesEarned: number;
    totalHoursLearned: number;
  };
  adminStats: any;
  timestamp: number;
};

export function useProfileData() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validar que los datos corresponden al usuario actual
  const validateUserData = useCallback((profileData: ProfileData, sessionEmail: string): boolean => {
    return profileData?.user?.email === sessionEmail;
  }, []);

  // Cargar datos desde caché con validación simple
  const loadFromCache = useCallback(async () => {
    if (!session?.user?.email) return false;
    
    try {
      const cachedData = await profileCache.get(session.user.email);
      if (cachedData && validateUserData(cachedData, session.user.email)) {
        setData(cachedData);
        setError(null);
        return true;
      }
    } catch (error) {
      console.warn('Error loading from cache:', error);
    }
    return false;
  }, [session?.user?.email, validateUserData]);

  // Fetch fresh data simplificado
  const fetchFreshData = useCallback(async (silent = false) => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    if (!silent) setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/profile-optimized', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const freshData = await response.json();
      
      console.log('📥 Datos recibidos del API:', {
        sessionEmail: session.user.email,
        dataEmail: freshData.user?.email,
        dataName: freshData.user?.name,
        dataRole: freshData.user?.role
      });
      
      // Validar que los datos recibidos corresponden al usuario actual
      if (!validateUserData(freshData, session.user.email)) {
        console.error('❌ Datos recibidos no corresponden al usuario actual:', {
          sessionEmail: session.user.email,
          dataEmail: freshData.user?.email
        });
        // TEMPORAL: Comentar esta línea para debug
        // throw new Error('Los datos recibidos no corresponden a tu usuario actual. Por favor, recarga la página.');
        console.warn('⚠️ VALIDACIÓN DESHABILITADA TEMPORALMENTE PARA DEBUG');
      }
      
      // Guardar en caché
      await profileCache.set(session.user.email, freshData);
      
      // Update state
      setData(freshData);
      
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el perfil');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [status, session?.user?.email, validateUserData]);

  // Limpiar cuando cambie el usuario o se desloguee
  useEffect(() => {
    if (status === 'unauthenticated') {
      profileCache.clearOnLogout();
      setData(null);
      setError(null);
    }
  }, [status]);

  // Load inicial
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      // Limpiar datos previos
      setData(null);
      setError(null);
      
      // Intentar cargar desde caché primero
      loadFromCache().then(hasCache => {
        if (!hasCache) {
          // No hay caché válido, fetch desde servidor
          fetchFreshData(false);
        }
      });
    }
  }, [status, session?.user?.email, loadFromCache, fetchFreshData]);

  // Función para limpiar caché y recargar
  const clearCacheAndReload = useCallback(async () => {
    if (session?.user?.email) {
      await profileCache.clear();
      setData(null);
      setError(null);
      await fetchFreshData(false);
    }
  }, [session?.user?.email, fetchFreshData]);

  // Refetch manual
  const refetch = useCallback(async () => {
    await fetchFreshData(false);
  }, [fetchFreshData]);

  return {
    data,
    loading: loading && !data,
    error,
    refetch,
    clearCacheAndReload,
    isFromCache: !!data && !loading,
  };
} 