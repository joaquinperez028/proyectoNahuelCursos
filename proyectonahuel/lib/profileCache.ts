// Sistema de caché súper agresivo para el perfil
class ProfileCache {
  private static instance: ProfileCache;
  private cache: Map<string, any> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private currentSessionId: string | null = null;
  
  static getInstance(): ProfileCache {
    if (!ProfileCache.instance) {
      ProfileCache.instance = new ProfileCache();
    }
    return ProfileCache.instance;
  }

  // Generar un ID único para la sesión actual
  private generateSessionId(email: string): string {
    return `${email}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Verificar si el usuario de la sesión cambió
  private hasSessionChanged(email: string): boolean {
    const storedSessionEmail = localStorage.getItem('current_user_email');
    return storedSessionEmail !== email;
  }

  // Limpiar caché si cambió el usuario
  private clearCacheIfUserChanged(email: string): void {
    if (this.hasSessionChanged(email)) {
      console.log('Usuario cambió, limpiando caché...');
      this.clear();
      localStorage.setItem('current_user_email', email);
      this.currentSessionId = this.generateSessionId(email);
    }
  }

  // Obtener datos del caché con múltiples niveles y validación de usuario
  async get(email: string): Promise<any | null> {
    // Primero verificar si cambió el usuario
    this.clearCacheIfUserChanged(email);
    
    const cacheKey = `profile_${email}`;
    
    // Nivel 1: Memory cache (más rápido)
    const memoryData = this.cache.get(cacheKey);
    if (memoryData && !this.isExpired(memoryData) && this.isValidUser(memoryData, email)) {
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
          return parsedData.data;
        } else {
          // Datos expirados o de usuario incorrecto, remover
          localStorage.removeItem(cacheKey);
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

  // Guardar en todos los niveles de caché con validación
  async set(email: string, data: any): Promise<void> {
    // Verificar que los datos pertenecen al usuario correcto
    if (data.user?.email !== email) {
      console.error('Intento de guardar datos de usuario incorrecto en caché:', {
        cacheEmail: email,
        dataEmail: data.user?.email
      });
      return;
    }

    this.clearCacheIfUserChanged(email);
    
    const cacheKey = `profile_${email}`;
    const cacheData = {
      data,
      timestamp: Date.now(),
      email,
      sessionId: this.currentSessionId || this.generateSessionId(email)
    };

    // Memory cache
    this.cache.set(cacheKey, cacheData);

    // LocalStorage cache
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      localStorage.setItem('current_user_email', email);
    } catch (error) {
      console.warn('Error saving to localStorage:', error);
      // Limpiar caché viejo si está lleno
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

  // Limpiar caché viejo para liberar espacio
  private clearOldCache(): void {
    const now = Date.now();
    
    // Limpiar memory cache
    for (const [key, data] of this.cache.entries()) {
      if (this.isExpired(data)) {
        this.cache.delete(key);
      }
    }

    // Limpiar localStorage cache
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
            keysToRemove.push(key); // Remover datos corruptos
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
    } catch (error) {
      console.warn('Error removing from localStorage:', error);
    }
  }

  // Precargar datos en background (con validación de usuario)
  async preload(email: string): Promise<void> {
    try {
      const response = await fetch('/api/users/profile-optimized', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Solo guardar si los datos pertenecen al usuario correcto
        if (data.user?.email === email) {
          await this.set(email, data);
        }
      }
    } catch (error) {
      console.warn('Preload failed:', error);
    }
  }

  // Limpiar todo el caché
  clear(): void {
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
    console.log('Limpiando caché por logout...');
    this.clear();
    this.currentSessionId = null;
  }
}

export const profileCache = ProfileCache.getInstance(); 