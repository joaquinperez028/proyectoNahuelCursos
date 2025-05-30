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
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

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
      setError(null); // Limpiar errores previos
      return true;
    } else if (cachedData) {
      // Datos en caché pero de usuario incorrecto, limpiar
      console.warn('Datos de caché no corresponden al usuario actual, limpiando...');
      await profileCache.invalidate(session.user.email);
    }
    return false;
  }, [session?.user?.email, validateUserData]);

  // Fetch fresh data con caché automático y manejo mejorado de errores
  const fetchFreshData = useCallback(async (silent = false, isRetry = false) => {
    if (status !== 'authenticated' || !session?.user?.email) return;

    if (!silent) setLoading(true);
    setError(null);

    try {
      // Agregar un pequeño delay si es un retry para dar tiempo a que NextAuth actualice la sesión
      if (isRetry) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

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
        console.error('Mismatch detectado:', {
          sessionEmail: session.user.email,
          dataEmail: freshData.user?.email,
          retryCount
        });
        
        // Si es el primer intento, reintentar después de limpiar caché
        if (retryCount < MAX_RETRIES) {
          console.log(`Reintentando... (${retryCount + 1}/${MAX_RETRIES})`);
          await profileCache.clear();
          setRetryCount(prev => prev + 1);
          
          // Retry con delay
          setTimeout(() => {
            fetchFreshData(silent, true);
          }, 1500);
          return;
        } else {
          throw new Error('Los datos del servidor no corresponden a tu usuario actual. Por favor, recarga la página.');
        }
      }
      
      // Datos válidos, reiniciar contador de reintentos
      setRetryCount(0);
      
      // Guardar en caché automáticamente
      await profileCache.set(session.user.email, freshData);
      
      // Update state
      setData(freshData);
      
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el perfil');
      
      // Si hay error de validación y no hemos agotado reintentos, no mostrar error aún
      if (err instanceof Error && err.message.includes('no corresponden') && retryCount < MAX_RETRIES) {
        return; // No mostrar error, estamos reintentando
      }
      
      // Si hay error de validación después de todos los reintentos, limpiar caché
      if (err instanceof Error && err.message.includes('no corresponden al usuario actual')) {
        await profileCache.clear();
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [status, session?.user?.email, validateUserData, retryCount]);

  // Precargar datos en background
  const preloadData = useCallback(async () => {
    if (session?.user?.email) {
      await profileCache.preload(session.user.email);
    }
  }, [session?.user?.email]);

  // Limpiar caché cuando cambie el usuario o se desloguee
  useEffect(() => {
    if (status === 'unauthenticated') {
      // Usuario se deslogueó, limpiar todo
      profileCache.clearOnLogout();
      setData(null);
      setError(null);
      setRetryCount(0);
    }
  }, [status]);

  // Load inicial súper optimizado
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      // Limpiar datos previos si cambió el usuario
      setData(null);
      setError(null);
      setRetryCount(0);
      
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
      setRetryCount(0);
      await fetchFreshData(false);
    }
  }, [session?.user?.email, fetchFreshData]);

  // Refetch manual
  const refetch = useCallback(async () => {
    setRetryCount(0);
    await fetchFreshData(false);
  }, [fetchFreshData]);

  // Función para limpiar caché forzadamente (cuando datos están obsoletos)
  const clearCacheAndReload = useCallback(async () => {
    if (session?.user?.email) {
      await profileCache.clear();
      setData(null); // Limpiar estado actual
      setError(null);
      setRetryCount(0);
      await fetchFreshData(false);
    }
  }, [session?.user?.email, fetchFreshData]);

  return {
    data,
    loading: loading && !data, // Solo mostrar loading si no hay datos cacheados
    error,
    refetch,
    invalidateCache,
    clearCacheAndReload,
    isFromCache: !!data && !loading, // Indica si los datos vienen del caché
    isRetrying: retryCount > 0 && retryCount < MAX_RETRIES, // Indica si está reintentando
  };
} 