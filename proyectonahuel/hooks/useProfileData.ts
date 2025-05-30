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

  // Cargar datos desde caché súper rápido con validación
  const loadFromCache = useCallback(async () => {
    if (!session?.user?.email) return false;
    
    const cachedData = await profileCache.get(session.user.email);
    if (cachedData && validateUserData(cachedData, session.user.email)) {
      setData(cachedData);
      return true;
    } else if (cachedData) {
      // Datos en caché pero de usuario incorrecto, limpiar
      console.warn('Datos de caché no corresponden al usuario actual, limpiando...');
      await profileCache.invalidate(session.user.email);
    }
    return false;
  }, [session?.user?.email, validateUserData]);

  // Fetch fresh data con caché automático
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
      
      // Validar que los datos recibidos corresponden al usuario actual
      if (!validateUserData(freshData, session.user.email)) {
        throw new Error('Los datos recibidos no corresponden al usuario actual');
      }
      
      // Guardar en caché automáticamente
      await profileCache.set(session.user.email, freshData);
      
      // Update state
      setData(freshData);
      
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el perfil');
      
      // Si hay error de validación, limpiar caché completamente
      if (err instanceof Error && err.message.includes('no corresponden al usuario actual')) {
        await profileCache.clear();
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [status, session?.user?.email, validateUserData]);

  // Precargar datos en background
  const preloadData = useCallback(async () => {
    if (session?.user?.email) {
      await profileCache.preload(session.user.email);
    }
  }, [session?.user?.email]);

  // Limpiar caché cuando cambie el usuario
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Usuario se deslogueó, limpiar caché
      profileCache.clearOnLogout();
      setData(null);
      setError(null);
    }
  }, [status]);

  // Load inicial súper optimizado
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      // Limpiar datos previos si cambió el usuario
      setData(null);
      setError(null);
      
      // 1. Intentar cargar desde caché inmediatamente (0ms)
      loadFromCache().then(hasCache => {
        if (hasCache) {
          // Datos cargados instantáneamente desde caché
          // Actualizar en background sin mostrar loading
          setTimeout(() => fetchFreshData(true), 100);
        } else {
          // No hay caché, fetch normal con loading
          fetchFreshData(false);
        }
      });

      // 2. Precargar para próximas visitas
      setTimeout(() => preloadData(), 1000);
    }
  }, [status, session?.user?.email, loadFromCache, fetchFreshData, preloadData]);

  // Invalidar caché y forzar recarga (útil cuando sabemos que datos cambiaron)
  const invalidateCache = useCallback(async () => {
    if (session?.user?.email) {
      await profileCache.invalidate(session.user.email);
      await fetchFreshData(false);
    }
  }, [session?.user?.email, fetchFreshData]);

  // Refetch manual
  const refetch = useCallback(async () => {
    await fetchFreshData(false);
  }, [fetchFreshData]);

  // Función para limpiar caché forzadamente (cuando datos están obsoletos)
  const clearCacheAndReload = useCallback(async () => {
    if (session?.user?.email) {
      await profileCache.invalidate(session.user.email);
      setData(null); // Limpiar estado actual
      await fetchFreshData(false);
    }
  }, [session?.user?.email, fetchFreshData]);

  return {
    data,
    loading: loading && !data, // Solo mostrar loading si no hay datos cacheados
    error,
    refetch,
    invalidateCache,
    clearCacheAndReload, // Nueva función para forzar limpieza
    isFromCache: !!data && !loading, // Indica si los datos vienen del caché
  };
} 