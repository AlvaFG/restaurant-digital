import { logger } from './logger';
import { AuthenticationError, AppError } from './errors';
import { MENSAJES } from './i18n/mensajes';

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "staff" | "manager"
  active: boolean
  tenant_id: string
  last_login_at?: string
}

export interface Tenant {
  id: string
  name: string
  slug: string
  logoUrl?: string
  theme: {
    accentColor: string
  }
  features: {
    tablets: boolean
    kds: boolean
    payments: boolean
  }
}

export class AuthService {
  private static readonly STORAGE_KEY = "restaurant_auth"
  private static readonly TENANT_KEY = "restaurant_tenant"

  private static setCookie(name: string, value: string, days = 7): void {
    if (typeof document === "undefined") return

    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    const encodedValue = encodeURIComponent(value)
    document.cookie = `${name}=${encodedValue};expires=${expires.toUTCString()};path=/;SameSite=Lax`
  }

  private static deleteCookie(name: string): void {
    if (typeof document === "undefined") return

    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
  }

  static async login(email: string, password: string): Promise<User | null> {
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando login', { email });
      console.log('[AuthService] Iniciando login para:', email);

      // Validar inputs
      if (!email || !password) {
        console.error('[AuthService] Faltan credenciales');
        throw new AuthenticationError(MENSAJES.VALIDACIONES.CAMPO_REQUERIDO);
      }

      console.log('[AuthService] Enviando petición a /api/auth/login');
      
      // Llamar a la API route en el servidor
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('[AuthService] Respuesta recibida, status:', response.status);
      
      let responseData;
      try {
        responseData = await response.json();
        console.log('[AuthService] Datos de respuesta:', JSON.stringify(responseData, null, 2));
      } catch (jsonError) {
        console.error('[AuthService] Error al parsear JSON:', jsonError);
        throw new AppError('Error al procesar respuesta del servidor');
      }

      if (!response.ok) {
        logger.error('Error en login', undefined, { 
          email, 
          status: response.status,
          error: responseData.error 
        });
        
        console.error('[AuthService] Error en login:', responseData.error);
        
        // Extraer mensaje de error del objeto error
        const errorMessage = responseData.error?.message || responseData.error || MENSAJES.ERRORES.CREDENCIALES_INVALIDAS;
        throw new AuthenticationError(errorMessage);
      }

      // La respuesta exitosa viene en el formato { data: { user, tenant }, message }
      const data = responseData.data || responseData;
      
      if (!data || !data.user || !data.tenant) {
        console.error('[AuthService] Respuesta incompleta:', data);
        throw new AppError('Respuesta del servidor incompleta');
      }
      
      const { user, tenant } = data;

      if (!user.id || !user.email || !tenant.id) {
        console.error('[AuthService] Datos inválidos:', { user, tenant });
        throw new AppError('Datos de usuario o tenant inválidos');
      }

      console.log('[AuthService] Usuario autenticado:', user.email, 'Rol:', user.role);

      // Store in localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(this.TENANT_KEY, JSON.stringify(tenant));

      this.setCookie(this.STORAGE_KEY, JSON.stringify(user));
      this.setCookie(this.TENANT_KEY, JSON.stringify(tenant));

      const duration = Date.now() - startTime;
      logger.info('Login completado exitosamente', { 
        userId: user.id, 
        tenantId: tenant.id,
        duration: `${duration}ms`
      });
      
      console.log('[AuthService] Login completado exitosamente en', duration, 'ms');

      return user;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Login falló', error as Error, { email, duration: `${duration}ms` });
      
      console.error('[AuthService] Login falló:', error);
      
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      throw new AppError(
        MENSAJES.ERRORES.GENERICO,
        500,
        false,
        { originalError: (error as Error).message }
      );
    }
  }

  static logout(): void {
    try {
      const user = this.getCurrentUser();
      logger.info('Cerrando sesión', { userId: user?.id });

      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.TENANT_KEY);

      this.deleteCookie(this.STORAGE_KEY);
      this.deleteCookie(this.TENANT_KEY);

      logger.info('Sesión cerrada exitosamente');
    } catch (error) {
      logger.error('Error al cerrar sesión', error as Error);
      // Aún así intentamos limpiar el storage
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.TENANT_KEY);
    }
  }

  static getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      
      const user = JSON.parse(stored) as User;
      
      // Validar que el usuario tiene los campos requeridos
      if (!user.id || !user.email) {
        logger.warn('Usuario en storage inválido, limpiando sesión');
        this.logout();
        return null;
      }
      
      return user;
    } catch (error) {
      logger.error('Error al leer usuario del storage', error as Error);
      this.logout();
      return null;
    }
  }

  static getTenant(): Tenant | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(this.TENANT_KEY);
      if (!stored) return null;
      
      const tenant = JSON.parse(stored) as Tenant;
      
      // Validar que el tenant tiene los campos requeridos
      if (!tenant.id || !tenant.slug) {
        logger.warn('Tenant en storage inválido, limpiando');
        localStorage.removeItem(this.TENANT_KEY);
        return null;
      }
      
      return tenant;
    } catch (error) {
      logger.error('Error al leer tenant del storage', error as Error);
      localStorage.removeItem(this.TENANT_KEY);
      return null;
    }
  }

  static updateTenant(updates: Partial<Tenant>): void {
    try {
      const current = this.getTenant();
      if (!current) {
        logger.warn('No se puede actualizar tenant: no hay sesión activa');
        return;
      }

      const updated = { ...current, ...updates };
      localStorage.setItem(this.TENANT_KEY, JSON.stringify(updated));
      this.setCookie(this.TENANT_KEY, JSON.stringify(updated));

      logger.info('Tenant actualizado', { tenantId: updated.id, updates: Object.keys(updates) });
    } catch (error) {
      logger.error('Error al actualizar tenant', error as Error);
      throw new AppError(MENSAJES.ERRORES.GENERICO);
    }
  }
}

