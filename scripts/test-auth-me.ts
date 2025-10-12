/**
 * Script para probar el endpoint /api/auth/me
 * 
 * Este script simula una petición al endpoint como lo haría el navegador
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const EMAIL = 'Afernandezguyot@gmail.com'
const PASSWORD = 'password123' // Asume esta contraseña, cámbiala si es diferente

async function testAuthMe() {
  console.log('\n🔍 ========== PRUEBA DE /api/auth/me ==========\n')

  try {
    // 1. Crear cliente de Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 2. Hacer login para obtener la sesión
    console.log('1️⃣ Iniciando sesión...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD
    })

    if (authError) {
      console.error('❌ Error en login:', authError.message)
      console.log('   ℹ️  Verifica que la contraseña sea correcta')
      return
    }

    console.log('✅ Login exitoso')
    console.log(`   - User ID: ${authData.user.id}`)
    console.log(`   - Session: ${authData.session ? 'Válida' : 'No válida'}`)
    console.log(`   - Access Token: ${authData.session?.access_token.substring(0, 20)}...`)

    // 3. Hacer petición a /api/auth/me (simulando el navegador)
    console.log('\n2️⃣ Haciendo petición a /api/auth/me...')
    
    const startTime = Date.now()
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authData.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        // Timeout de 15 segundos
        signal: AbortSignal.timeout(15000)
      })

      const duration = Date.now() - startTime
      console.log(`⏱️  Tiempo de respuesta: ${duration}ms`)

      if (!response.ok) {
        console.error(`❌ Error en respuesta: ${response.status} ${response.statusText}`)
        const errorData = await response.json().catch(() => ({}))
        console.error('   Detalles:', JSON.stringify(errorData, null, 2))
        return
      }

      const data = await response.json()
      
      console.log('\n✅ Respuesta exitosa de /api/auth/me:')
      console.log(JSON.stringify(data, null, 2))

      if (data.data?.user && data.data?.tenant) {
        console.log('\n✅ ========== TODO OK ==========')
        console.log('   ✅ Usuario obtenido correctamente')
        console.log('   ✅ Tenant obtenido correctamente')
        console.log(`   ⏱️  Tiempo de respuesta: ${duration}ms (${duration > 5000 ? '⚠️ LENTO' : '✅ RÁPIDO'})`)
      } else {
        console.error('\n❌ Respuesta incompleta:')
        console.error('   - hasUser:', !!data.data?.user)
        console.error('   - hasTenant:', !!data.data?.tenant)
      }

    } catch (fetchError: any) {
      const duration = Date.now() - startTime
      if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
        console.error(`\n❌ TIMEOUT después de ${duration}ms`)
        console.error('   El endpoint /api/auth/me está tardando más de 15 segundos')
        console.error('   Esto podría ser el problema principal.')
      } else {
        console.error(`\n❌ Error al hacer fetch (después de ${duration}ms):`, fetchError.message)
      }
    }

  } catch (error: any) {
    console.error('\n❌ Error crítico:', error.message)
  }
}

// Ejecutar
console.log('⚠️  NOTA: Asegúrate de que el servidor esté corriendo (npm run dev)')
console.log('⚠️  Si la contraseña no es "password123", edita el script\n')

testAuthMe()
