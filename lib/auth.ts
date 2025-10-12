/**
 * AuthService - Cliente de autenticación con Supabase
 * 
 * Maneja la autenticación del lado del cliente usando Supabase Auth.
 * La sesión se gestiona automáticamente mediante cookies de Supabase.
 * 
 * @module lib/auth
 */

import { createBrowserClient } from '@/lib/supabase/client';
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
  private static readonly TENANT_KEY = "restaurant_tenant"

  /**
   * Iniciar sesión con email y contraseña
   * Usa Supabase Auth para autenticación
   */
  static async login(email: string, password: string): Promise<User> {
    const startTime = Date.now();
    
    try {
      logger.info('Iniciando login', { email });

      // Validar inputs
      if (!email || !password) {
        throw new AuthenticationError(MENSAJES.VALIDACIONES.CAMPO_REQUERIDO);
      }

      if (!email.includes('@')) {
        throw new AuthenticationError(MENSAJES.VALIDACIONES.EMAIL_INVALIDO);
      }
      
      // Llamar a la API route que maneja el login con Supabase
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const responseData = await response.json();

      if (!response.ok) {
        logger.error('Error en login', undefined, { 
          email, 
          status: response.status,
          error: responseData.error 
        });
        
        const errorMessage = responseData.error?.message || responseData.error || MENSAJES.ERRORES.CREDENCIALES_INVALIDAS;
        throw new AuthenticationError(errorMessage);
      }

      const data = responseData.data;
      
      if (!data?.user || !data?.tenant) {
        throw new AppError('Respuesta del servidor incompleta');
      }
      
      const { user, tenant } = data;

      // Guardar tenant en localStorage para acceso rápido
      // La sesión de usuario está en las cookies de Supabase
      localStorage.setItem(this.TENANT_KEY, JSON.stringify(tenant));

      const duration = Date.now() - startTime;
      logger.info('Login completado exitosamente', { 
        userId: user.id, 
        tenantId: tenant.id,
        duration: `${duration}ms`
      });

      return user;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Login falló', error as Error, { email, duration: `${duration}ms` });
      
      if (error instanceof AuthenticationError || error instanceof AppError) {
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

  /**
   * Cerrar sesión
   * Llama a Supabase signOut y limpia datos locales
   */
  static async logout(): Promise<void> {
    try {
      logger.info('Cerrando sesión');

      const supabase = createBrowserClient();
      
      // Cerrar sesión en Supabase (limpia cookies automáticamente)
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.error('Error al cerrar sesión en Supabase', error);
      }

      // Limpiar datos locales
      localStorage.removeItem(this.TENANT_KEY);

      logger.info('Sesión cerrada exitosamente');
    } catch (error) {
      logger.error('Error al cerrar sesión', error as Error);
      // Intentar limpiar de todos modos
      localStorage.removeItem(this.TENANT_KEY);
      throw new AppError('Error al cerrar sesión');
    }
  }

  /**
   * Obtener usuario actual desde Supabase
   * Consulta la sesión activa de Supabase
   */
  static async getCurrentUser(): Promise<User | null> {
    if (typeof window === "undefined") return null;

    try {
      const supabase = createBrowserClient();
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        return null;
      }

      // Obtener datos adicionales del usuario desde la base de datos
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.data?.user || null;
    } catch (error) {
      logger.error('Error al obtener usuario actual', error as Error);
      return null;
    }
  }

  /**
   * Obtener tenant del localStorage
   */
  static getTenant(): Tenant | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(this.TENANT_KEY);
      if (!stored) return null;
      
      const tenant = JSON.parse(stored) as Tenant;
      
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

  /**
   * Actualizar información del tenant
   */
  static updateTenant(updates: Partial<Tenant>): void {
    try {
      const current = this.getTenant();
      if (!current) {
        logger.warn('No se puede actualizar tenant: no hay sesión activa');
        return;
      }

      const updated = { ...current, ...updates };
      localStorage.setItem(this.TENANT_KEY, JSON.stringify(updated));

      logger.info('Tenant actualizado', { tenantId: updated.id, updates: Object.keys(updates) });
    } catch (error) {
      logger.error('Error al actualizar tenant', error as Error);
      throw new AppError(MENSAJES.ERRORES.GENERICO);
    }
  }

  /**
   * Registrar nuevo usuario
   */
  static async register(email: string, password: string, name: string): Promise<void> {
    try {
      logger.info('Iniciando registro', { email, name });

      if (!email || !password || !name) {
        throw new AuthenticationError(MENSAJES.VALIDACIONES.CAMPO_REQUERIDO);
      }

      if (!email.includes('@')) {
        throw new AuthenticationError(MENSAJES.VALIDACIONES.EMAIL_INVALIDO);
      }

      if (password.length < 6) {
        throw new AuthenticationError('La contraseña debe tener al menos 6 caracteres');
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error?.message || data.error || 'Error al crear cuenta';
        throw new AuthenticationError(errorMessage);
      }

      logger.info('Registro completado exitosamente', { email });
    } catch (error) {
      logger.error('Registro falló', error as Error, { email });
      
      if (error instanceof AuthenticationError || error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Error al crear cuenta');
    }
  }
}

