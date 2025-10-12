#!/usr/bin/env node

/**
 * Script de prueba del flujo de autenticación
 * 
 * Este script verifica que todos los componentes del flujo de autenticación
 * estén configurados correctamente y puedan comunicarse.
 * 
 * Uso:
 *   npx tsx scripts/test-auth-flow.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface TestResult {
  name: string
  passed: boolean
  message: string
  duration?: number
}

const results: TestResult[] = []

function addResult(name: string, passed: boolean, message: string, duration?: number) {
  results.push({ name, passed, message, duration })
  const icon = passed ? '✅' : '❌'
  const durationText = duration ? ` (${duration}ms)` : ''
  console.log(`${icon} ${name}${durationText}`)
  if (!passed) {
    console.log(`   └─ ${message}`)
  }
}

async function testSupabaseConnection() {
  const startTime = Date.now()
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      addResult(
        'Variables de entorno',
        false,
        'NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY no están definidas'
      )
      return false
    }

    addResult(
      'Variables de entorno',
      true,
      'Variables de Supabase configuradas correctamente'
    )

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Test básico de conexión
    const { error } = await supabase.auth.getSession()
    
    const duration = Date.now() - startTime
    
    if (error && error.message !== 'Auth session missing!') {
      addResult(
        'Conexión a Supabase',
        false,
        `Error al conectar: ${error.message}`,
        duration
      )
      return false
    }

    addResult(
      'Conexión a Supabase',
      true,
      'Conexión establecida correctamente',
      duration
    )
    return true
  } catch (error) {
    const duration = Date.now() - startTime
    addResult(
      'Conexión a Supabase',
      false,
      `Error: ${(error as Error).message}`,
      duration
    )
    return false
  }
}

async function testAPIEndpoints() {
  const endpoints = [
    { path: '/api/auth/login', method: 'POST' },
    { path: '/api/auth/register', method: 'POST' },
    { path: '/api/auth/me', method: 'GET' },
  ]

  console.log('\n📡 Verificando endpoints API (estructura, no funcionalidad)...')
  
  for (const endpoint of endpoints) {
    try {
      const fs = await import('fs')
      const path = await import('path')
      
      const apiPath = path.join(process.cwd(), 'app', endpoint.path.replace('/api/', ''), 'route.ts')
      
      if (fs.existsSync(apiPath)) {
        addResult(
          `Endpoint ${endpoint.path}`,
          true,
          'Archivo encontrado'
        )
      } else {
        addResult(
          `Endpoint ${endpoint.path}`,
          false,
          'Archivo no encontrado'
        )
      }
    } catch (error) {
      addResult(
        `Endpoint ${endpoint.path}`,
        false,
        `Error al verificar: ${(error as Error).message}`
      )
    }
  }
}

async function testComponents() {
  console.log('\n🧩 Verificando componentes...')
  
  const components = [
    'contexts/auth-context.tsx',
    'components/protected-route.tsx',
    'components/login-form.tsx',
    'app/dashboard/page.tsx',
    'middleware.ts',
  ]

  const fs = await import('fs')
  const path = await import('path')

  for (const component of components) {
    const componentPath = path.join(process.cwd(), component)
    
    if (fs.existsSync(componentPath)) {
      // Leer el archivo y buscar palabras clave de debugging
      const content = fs.readFileSync(componentPath, 'utf-8')
      
      const hasConsoleLog = content.includes('console.log')
      const hasErrorHandling = content.includes('try') && content.includes('catch')
      const hasTimeout = component === 'contexts/auth-context.tsx' 
        ? content.includes('AbortController')
        : true

      if (hasConsoleLog && hasErrorHandling && hasTimeout) {
        addResult(
          component,
          true,
          'Componente con debugging implementado'
        )
      } else {
        const missing = []
        if (!hasConsoleLog) missing.push('console.log')
        if (!hasErrorHandling) missing.push('try/catch')
        if (!hasTimeout && component === 'contexts/auth-context.tsx') missing.push('AbortController')
        
        addResult(
          component,
          false,
          `Falta implementar: ${missing.join(', ')}`
        )
      }
    } else {
      addResult(
        component,
        false,
        'Archivo no encontrado'
      )
    }
  }
}

async function testDatabaseStructure() {
  console.log('\n🗄️ Verificando estructura de base de datos...')
  
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    
    // Test 1: Verificar que existe la tabla users
    const { error: usersError } = await supabase
      .from('users')
      .select('id, email, role, tenant_id')
      .limit(0)
    
    if (usersError && !usersError.message.includes('permission')) {
      addResult(
        'Tabla users',
        false,
        `Error al acceder: ${usersError.message}`
      )
    } else {
      addResult(
        'Tabla users',
        true,
        'Tabla accesible'
      )
    }

    // Test 2: Verificar que existe la tabla tenants
    const { error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, slug')
      .limit(0)
    
    if (tenantsError && !tenantsError.message.includes('permission')) {
      addResult(
        'Tabla tenants',
        false,
        `Error al acceder: ${tenantsError.message}`
      )
    } else {
      addResult(
        'Tabla tenants',
        true,
        'Tabla accesible'
      )
    }
  } catch (error) {
    addResult(
      'Estructura de BD',
      false,
      `Error: ${(error as Error).message}`
    )
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMEN DE PRUEBAS')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`\nTotal de pruebas: ${total}`)
  console.log(`✅ Exitosas: ${passed}`)
  console.log(`❌ Fallidas: ${failed}`)
  console.log(`📈 Porcentaje de éxito: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n⚠️ Pruebas fallidas:')
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  • ${r.name}: ${r.message}`)
      })
  }

  console.log('\n' + '='.repeat(60))

  if (failed === 0) {
    console.log('✅ Todos los componentes están correctamente configurados!')
    console.log('🚀 El sistema de debugging está listo para usar.')
  } else {
    console.log('⚠️ Hay componentes que requieren atención.')
    console.log('📖 Revisa el documento PROMPT_DEBUG_DASHBOARD_LOADING.md')
  }
}

async function main() {
  console.log('🔍 Iniciando verificación del flujo de autenticación...\n')

  await testSupabaseConnection()
  await testAPIEndpoints()
  await testComponents()
  await testDatabaseStructure()
  await printSummary()
}

main().catch(error => {
  console.error('❌ Error fatal:', error)
  process.exit(1)
})
