// Sistema de caché simplificado para el perfil
class ProfileCache {
  private static instance: ProfileCache;
  private cache: Map<string, any> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  
  static getInstance(): ProfileCache {
    if (!ProfileCache.instance) {
      ProfileCache.instance = new ProfileCache();
    }
    return ProfileCache.instance;
  }

  // Obtener datos del caché con validación básica
  async get(email: string): Promise<any | null> {
    const cacheKey = `profile_${email}`;
    
    // Nivel 1: Memory cache
    const memoryData = this.cache.get(cacheKey);
    if (memoryData && !this.isExpired(memoryData) && this.isValidUser(memoryData, email)) {
      console.log('📦 Datos cargados desde memory cache para:', email);
      return memoryData.data;
    }

    // Nivel 2: LocalStorage cache
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsedData = JSON.parse(stored);
        if (!this.isExpired(parsedData) && this.isValidUser(parsedData, email)) {
          // Restaurar en memory cache
          this.cache.set(cacheKey, parsedData);
          console.log('📦 Datos cargados desde localStorage para:', email);
          return parsedData.data;
        } else {
          // Datos expirados o inválidos, remover
          localStorage.removeItem(cacheKey);
          console.log('🗑️ Removidos datos obsoletos de localStorage para:', email);
        }
      }
    } catch (error) {
      console.warn('Error reading localStorage cache:', error);
    }

    return null;
  }

  // Validar que los datos pertenecen al usuario correcto
  private isValidUser(cacheData: any, email: string): boolean {
    return cacheData.email === email && cacheData.data?.user?.email === email;
  }

  // Guardar en caché con validación
  async set(email: string, data: any): Promise<void> {
    // Verificar que los datos pertenecen al usuario correcto
    if (data.user?.email !== email) {
      console.error('❌ Intento de guardar datos incorrectos:', {
        expectedEmail: email,
        dataEmail: data.user?.email
      });
      return;
    }

    const cacheKey = `profile_${email}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      email
    };

    // Memory cache
    this.cache.set(cacheKey, cacheData);

    // LocalStorage cache
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      localStorage.setItem('current_user_email', email);
      console.log('💾 Datos guardados en caché para:', email);
    } catch (error) {
      console.warn('Error saving to localStorage:', error);
      this.clearOldCache();
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (retryError) {
        console.error('Failed to save cache after cleanup:', retryError);
      }
    }
  }

  // Verificar si los datos están expirados
  private isExpired(cacheData: any): boolean {
    return Date.now() - cacheData.timestamp > this.CACHE_DURATION;
  }

  // Limpiar caché viejo
  private clearOldCache(): void {
    // Limpiar memory cache expirado
    for (const [key, data] of this.cache.entries()) {
      if (this.isExpired(data)) {
        this.cache.delete(key);
      }
    }

    // Limpiar localStorage expirado
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('profile_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (this.isExpired(data)) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Error cleaning old cache:', error);
    }
  }

  // Invalidar caché para un usuario específico
  async invalidate(email: string): Promise<void> {
    const cacheKey = `profile_${email}`;
    this.cache.delete(cacheKey);
    try {
      localStorage.removeItem(cacheKey);
      console.log('🗑️ Caché invalidado para:', email);
    } catch (error) {
      console.warn('Error removing from localStorage:', error);
    }
  }

  // Limpiar todo el caché
  clear(): void {
    console.log('🧹 Limpiando todo el caché...');
    this.cache.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('profile_') || key === 'current_user_email')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Error clearing localStorage cache:', error);
    }
  }

  // Método para limpiar caché al hacer logout
  clearOnLogout(): void {
    console.log('👋 Limpieza por logout');
    this.clear();
  }
}

export const profileCache = ProfileCache.getInstance(); 