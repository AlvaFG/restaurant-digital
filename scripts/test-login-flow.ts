/**
 * Script para probar el flujo de login completo
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testLogin() {
  console.log('🧪 PRUEBA DE LOGIN COMPLETO\n')

  const testCredentials = [
    { email: 'admin@restaurant.com', password: 'Admin123!', expectedRole: 'admin' },
    { email: 'gerente@restaurant.com', password: 'Manager123!', expectedRole: 'manager' },
    { email: 'mesero@restaurant.com', password: 'Staff123!', expectedRole: 'staff' },
  ]

  let successCount = 0
  let errorCount = 0

  for (const cred of testCredentials) {
    console.log(`\n📝 Probando: ${cred.email}`)
    console.log('─────────────────────────────────────────')

    try {
      // 1. Autenticar con Supabase Auth
      console.log('   1️⃣ Autenticando con Supabase Auth...')
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cred.email,
        password: cred.password,
      })

      if (authError || !authData.session) {
        throw new Error(`Auth error: ${authError?.message || 'No session'}`)
      }

      console.log('      ✅ Autenticado exitosamente')
      console.log(`      📧 User ID: ${authData.user.id}`)
      console.log(`      🔑 Access Token: ${authData.session.access_token.substring(0, 20)}...`)

      // 2. Buscar datos del usuario en la tabla users
      console.log('\n   2️⃣ Buscando datos en tabla users...')
      const { data: users, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          tenants (
            id,
            name,
            slug,
            settings
          )
        `)
        .eq('email', cred.email)
        .eq('active', true)
        .limit(1)

      if (userError || !users || users.length === 0) {
        throw new Error(`User query error: ${userError?.message || 'User not found'}`)
      }

      const userData: any = users[0]
      console.log('      ✅ Usuario encontrado')
      console.log(`      👤 Name: ${userData.name}`)
      console.log(`      🎭 Role: ${userData.role}`)
      console.log(`      🏢 Tenant: ${userData.tenants.name}`)

      // 3. Verificar rol
      console.log('\n   3️⃣ Verificando rol...')
      if (userData.role !== cred.expectedRole) {
        throw new Error(`Role mismatch: expected ${cred.expectedRole}, got ${userData.role}`)
      }
      console.log(`      ✅ Rol correcto: ${userData.role}`)

      // 4. Verificar que tenant existe
      console.log('\n   4️⃣ Verificando tenant...')
      if (!userData.tenants || !userData.tenants.id) {
        throw new Error('Tenant data missing')
      }
      console.log(`      ✅ Tenant válido: ${userData.tenants.name}`)

      console.log('\n   ✅ LOGIN EXITOSO')
      successCount++

    } catch (error) {
      console.error(`\n   ❌ ERROR: ${error}`)
      errorCount++
    }
  }

  // Resumen
  console.log('\n\n═══════════════════════════════════════════════════════')
  console.log('📊 RESUMEN DE PRUEBAS\n')
  console.log(`   ✅ Exitosos: ${successCount}/${testCredentials.length}`)
  console.log(`   ❌ Fallidos: ${errorCount}/${testCredentials.length}`)
  
  if (successCount === testCredentials.length) {
    console.log('\n   🎉 TODAS LAS PRUEBAS PASARON')
    console.log('\n   ✅ El sistema de login está funcionando correctamente')
    console.log('   ✅ Puedes iniciar sesión en la aplicación con cualquiera de estas cuentas:')
    console.log('')
    testCredentials.forEach(cred => {
      console.log(`      • ${cred.email} / ${cred.password}`)
    })
  } else {
    console.log('\n   ⚠️  ALGUNAS PRUEBAS FALLARON')
    console.log('   Revisa los errores arriba')
  }
  
  console.log('\n═══════════════════════════════════════════════════════\n')
}

testLogin().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
