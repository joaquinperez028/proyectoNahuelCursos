// Sistema de caché con detección automática de cambio de usuario
class ProfileCache {
  private static instance: ProfileCache;
  private cache: Map<string, any> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private currentUserEmail: string | null = null;
  
  static getInstance(): ProfileCache {
    if (!ProfileCache.instance) {
      ProfileCache.instance = new ProfileCache();
    }
    return ProfileCache.instance;
  }

  // Verificar si cambió el usuario y limpiar si es necesario
  private checkAndClearOnUserChange(email: string): void {
    if (this.currentUserEmail && this.currentUserEmail !== email) {
      console.log('🔄 CAMBIO DE USUARIO DETECTADO:', {
        anterior: this.currentUserEmail,
        nuevo: email
      });
      this.clearAllCache();
    }
    this.currentUserEmail = email;
  }

  // Limpiar TODO el caché (memory + localStorage)
  private clearAllCache(): void {
    console.log('🧹 LIMPIANDO TODO EL CACHÉ POR CAMBIO DE USUARIO');
    
    // Limpiar memory cache
    this.cache.clear();
    
    // Limpiar TODO el localStorage relacionado con perfiles
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('profile_') || key === 'current_user_email')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('🗑️ Removido:', key);
      });
    } catch (error) {
      console.warn('Error clearing localStorage:', error);
    }
  }

  // Obtener datos del caché con validación estricta
  async get(email: string): Promise<any | null> {
    // PRIMERO: Verificar si cambió el usuario
    this.checkAndClearOnUserChange(email);
    
    const cacheKey = `profile_${email}`;
    
    // Nivel 1: Memory cache
    const memoryData = this.cache.get(cacheKey);
    if (memoryData && !this.isExpired(memoryData)) {
      if (this.isValidUserData(memoryData, email)) {
        console.log('📦 Datos válidos desde memory cache para:', email);
        return memoryData.data;
      } else {
        console.log('❌ Datos inválidos en memory cache, removiendo');
        this.cache.delete(cacheKey);
      }
    }

    // Nivel 2: LocalStorage cache
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsedData = JSON.parse(stored);
        if (!this.isExpired(parsedData)) {
          if (this.isValidUserData(parsedData, email)) {
            // Restaurar en memory cache
            this.cache.set(cacheKey, parsedData);
            console.log('📦 Datos válidos desde localStorage para:', email);
            return parsedData.data;
          } else {
            console.log('❌ Datos inválidos en localStorage, removiendo');
            localStorage.removeItem(cacheKey);
          }
        } else {
          console.log('⏰ Datos expirados en localStorage, removiendo');
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.warn('Error reading localStorage cache:', error);
    }

    console.log('❌ No hay datos válidos en caché para:', email);
    return null;
  }

  // Validación estricta de datos de usuario
  private isValidUserData(cacheData: any, expectedEmail: string): boolean {
    const isValid = (
      cacheData.email === expectedEmail && 
      cacheData.data?.user?.email === expectedEmail
    );
    
    if (!isValid) {
      console.warn('⚠️ DATOS DE CACHÉ INVÁLIDOS:', {
        expectedEmail,
        cacheEmail: cacheData.email,
        dataEmail: cacheData.data?.user?.email
      });
    }
    
    return isValid;
  }

  // Guardar en caché con validación estricta
  async set(email: string, data: any): Promise<void> {
    // Verificar cambio de usuario ANTES de guardar
    this.checkAndClearOnUserChange(email);
    
    // Validación estricta antes de guardar
    if (!data.user?.email || data.user.email !== email) {
      console.error('❌ INTENTO DE GUARDAR DATOS INCORRECTOS:', {
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
      console.log('💾 Datos guardados correctamente para:', email);
    } catch (error) {
      console.warn('Error saving to localStorage:', error);
    }
  }

  // Verificar si los datos están expirados
  private isExpired(cacheData: any): boolean {
    return Date.now() - cacheData.timestamp > this.CACHE_DURATION;
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

  // Limpiar todo el caché (método público)
  clear(): void {
    console.log('🧹 LIMPIEZA MANUAL DE TODO EL CACHÉ');
    this.clearAllCache();
    this.currentUserEmail = null;
  }

  // Método para limpiar caché al hacer logout
  clearOnLogout(): void {
    console.log('👋 LIMPIEZA POR LOGOUT');
    this.clearAllCache();
    this.currentUserEmail = null;
  }
}

export const profileCache = ProfileCache.getInstance(); 