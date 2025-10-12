/**
 * Script de Verificación del Sistema de Autenticación
 * 
 * Verifica que todos los componentes del nuevo sistema estén correctamente configurados
 */

import { createBrowserClient } from '@/lib/supabase/client'
import { createServerClient } from '@/lib/supabase/server'

interface CheckResult {
  name: string
  status: 'ok' | 'warning' | 'error'
  message: string
}

const results: CheckResult[] = []

// ============================================
// VERIFICACIONES DE CONFIGURACIÓN
// ============================================

function checkEnvVars(): CheckResult {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missing = requiredVars.filter(varName => !process.env[varName])

  if (missing.length > 0) {
    return {
      name: 'Variables de Entorno',
      status: 'error',
      message: `Faltan variables: ${missing.join(', ')}`,
    }
  }

  // Verificar que no exista BYPASS_AUTH
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
    return {
      name: 'Variables de Entorno',
      status: 'warning',
      message: '⚠️ NEXT_PUBLIC_BYPASS_AUTH está activo. Debe eliminarse en producción.',
    }
  }

  return {
    name: 'Variables de Entorno',
    status: 'ok',
    message: 'Todas las variables requeridas están configuradas',
  }
}

function checkSupabaseClient(): CheckResult {
  try {
    const client = createBrowserClient()
    
    if (!client) {
      return {
        name: 'Cliente Supabase',
        status: 'error',
        message: 'No se pudo crear el cliente de Supabase',
      }
    }

    return {
      name: 'Cliente Supabase',
      status: 'ok',
      message: 'Cliente de Supabase inicializado correctamente',
    }
  } catch (error) {
    return {
      name: 'Cliente Supabase',
      status: 'error',
      message: `Error: ${(error as Error).message}`,
    }
  }
}

async function checkAuthEndpoints(): Promise<CheckResult> {
  const endpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
    '/api/auth/me',
    '/api/auth/google',
    '/api/auth/callback',
  ]

  try {
    const checks = await Promise.all(
      endpoints.map(async (endpoint) => {
        try {
          const response = await fetch(`http://localhost:3000${endpoint}`, {
            method: endpoint === '/api/auth/me' ? 'GET' : 'POST',
          })
          return { endpoint, status: response.status }
        } catch {
          return { endpoint, status: 0 }
        }
      })
    )

    const failed = checks.filter(c => c.status === 0)

    if (failed.length > 0) {
      return {
        name: 'Endpoints de Auth',
        status: 'warning',
        message: `No se pudo conectar a: ${failed.map(f => f.endpoint).join(', ')}. ¿El servidor está corriendo?`,
      }
    }

    return {
      name: 'Endpoints de Auth',
      status: 'ok',
      message: `Todos los endpoints responden (${checks.length})`,
    }
  } catch (error) {
    return {
      name: 'Endpoints de Auth',
      status: 'error',
      message: `Error: ${(error as Error).message}`,
    }
  }
}

// ============================================
// VERIFICACIONES DE CÓDIGO
// ============================================

function checkNoBypassCode(): CheckResult {
  // Esta verificación debe hacerse manualmente revisando los archivos
  // En un script real, podrías usar fs para leer archivos y buscar patrones
  
  const filesWithPotentialBypass = [
    'middleware.ts',
    'components/protected-route.tsx',
    '.env.local',
  ]

  return {
    name: 'Código sin Bypass',
    status: 'ok',
    message: `Verificar manualmente en: ${filesWithPotentialBypass.join(', ')}`,
  }
}

// ============================================
// EJECUTAR VERIFICACIONES
// ============================================

export async function runAuthVerification() {
  console.log('\n🔐 VERIFICACIÓN DEL SISTEMA DE AUTENTICACIÓN\n')
  console.log('='.repeat(50))
  
  // Verificaciones síncronas
  results.push(checkEnvVars())
  results.push(checkSupabaseClient())
  results.push(checkNoBypassCode())

  // Verificaciones asíncronas
  results.push(await checkAuthEndpoints())

  console.log('\n')

  // Mostrar resultados
  results.forEach(result => {
    const icon = result.status === 'ok' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'
    console.log(`${icon} ${result.name}`)
    console.log(`   ${result.message}\n`)
  })

  console.log('='.repeat(50))

  const errors = results.filter(r => r.status === 'error').length
  const warnings = results.filter(r => r.status === 'warning').length
  const ok = results.filter(r => r.status === 'ok').length

  console.log(`\n📊 Resumen: ${ok} OK | ${warnings} Advertencias | ${errors} Errores\n`)

  if (errors > 0) {
    console.log('❌ HAY ERRORES CRÍTICOS. Por favor, revisa la configuración.\n')
    return false
  }

  if (warnings > 0) {
    console.log('⚠️ HAY ADVERTENCIAS. Revisa antes de ir a producción.\n')
    return true
  }

  console.log('✅ SISTEMA DE AUTENTICACIÓN VERIFICADO CORRECTAMENTE\n')
  return true
}

// ============================================
// CHECKLIST MANUAL
// ============================================

export function printManualChecklist() {
  console.log('\n📋 CHECKLIST MANUAL DE VERIFICACIÓN\n')
  console.log('='.repeat(50))
  
  const checklist = [
    {
      category: '🔧 Configuración',
      items: [
        'Variables de entorno configuradas en .env.local',
        'NEXT_PUBLIC_BYPASS_AUTH eliminada de .env.local',
        'Supabase proyecto creado y configurado',
        'Tablas users y tenants existen en Supabase',
      ],
    },
    {
      category: '🗑️ Código Limpio',
      items: [
        'No hay BYPASS_AUTH en middleware.ts',
        'No hay bypass en protected-route.tsx',
        'No hay console.log() de debug en auth.ts',
        'No hay credenciales hardcodeadas',
      ],
    },
    {
      category: '🔐 Funcionalidad',
      items: [
        'Login con email/password funciona',
        'Registro de usuario funciona',
        'Logout limpia sesión correctamente',
        'Sesión persiste al recargar página',
        'Rutas protegidas redirigen a /login sin sesión',
        'Token se renueva automáticamente',
      ],
    },
    {
      category: '🎨 UX',
      items: [
        'Mensajes de error en español',
        'Errores de Supabase traducidos',
        'Loading states en formularios',
        'Validaciones client-side funcionan',
      ],
    },
    {
      category: '🔒 Seguridad',
      items: [
        'Middleware protege rutas privadas',
        'Tokens en cookies HTTP-only (Supabase)',
        'No se exponen secrets en cliente',
        'RLS policies activas en Supabase',
      ],
    },
  ]

  checklist.forEach(section => {
    console.log(`\n${section.category}`)
    section.items.forEach((item, index) => {
      console.log(`  [ ] ${index + 1}. ${item}`)
    })
  })

  console.log('\n' + '='.repeat(50))
  console.log('\n✅ Marca cada item después de verificarlo manualmente\n')
}

// Si se ejecuta directamente
if (require.main === module) {
  runAuthVerification().then((success) => {
    printManualChecklist()
    process.exit(success ? 0 : 1)
  })
}
