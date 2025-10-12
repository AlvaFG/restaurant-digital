/**
 * Script para crear usuarios de prueba
 * Crea usuarios en auth.users Y en la tabla users
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import bcrypt from 'bcryptjs'

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

interface TestUser {
  name: string
  email: string
  password: string
  role: 'admin' | 'manager' | 'staff'
}

const testUsers: TestUser[] = [
  {
    name: 'Admin Principal',
    email: 'admin@restaurant.com',
    password: 'Admin123!',
    role: 'admin'
  },
  {
    name: 'Gerente de Turno',
    email: 'gerente@restaurant.com',
    password: 'Manager123!',
    role: 'manager'
  },
  {
    name: 'Mesero de Prueba',
    email: 'mesero@restaurant.com',
    password: 'Staff123!',
    role: 'staff'
  }
]

async function createTestUsers() {
  console.log('👥 CREANDO USUARIOS DE PRUEBA\n')

  // 1. Verificar tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name')
    .limit(1)
    .single()

  if (tenantError || !tenant) {
    console.error('❌ Error: No se encontró un tenant')
    console.error('   Crea un tenant primero o ejecuta las migraciones')
    return
  }

  console.log(`✅ Tenant encontrado: ${tenant.name} (${tenant.id})\n`)

  let successCount = 0
  let errorCount = 0

  // 2. Crear cada usuario
  for (const testUser of testUsers) {
    console.log(`📝 Creando: ${testUser.name} (${testUser.email})...`)

    try {
      // Crear en Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          name: testUser.name,
        }
      })

      if (authError || !authData.user) {
        throw new Error(`Error en Auth: ${authError?.message}`)
      }

      console.log(`   ✅ Creado en Auth (ID: ${authData.user.id})`)

      // Hash password
      const passwordHash = await bcrypt.hash(testUser.password, 10)

      // Crear en tabla users
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: testUser.email,
          password_hash: passwordHash,
          name: testUser.name,
          role: testUser.role,
          tenant_id: tenant.id,
          active: true,
        })

      if (dbError) {
        // Rollback: borrar de Auth si falla DB
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw new Error(`Error en DB: ${dbError.message}`)
      }

      console.log(`   ✅ Creado en DB`)
      console.log(`   📧 Email: ${testUser.email}`)
      console.log(`   🔑 Password: ${testUser.password}`)
      console.log(`   👤 Role: ${testUser.role}`)
      console.log('')
      
      successCount++
    } catch (error) {
      console.error(`   ❌ Error: ${error}`)
      console.log('')
      errorCount++
    }
  }

  // Resumen
  console.log('═══════════════════════════════════════════════════════')
  console.log('✅ RESUMEN\n')
  console.log(`   Usuarios creados: ${successCount}/${testUsers.length}`)
  console.log(`   Errores: ${errorCount}`)
  console.log('')
  
  if (successCount > 0) {
    console.log('📋 CREDENCIALES DE PRUEBA:\n')
    testUsers.forEach(user => {
      console.log(`   ${user.role.toUpperCase()} - ${user.email} / ${user.password}`)
    })
  }
  
  console.log('\n═══════════════════════════════════════════════════════\n')
}

createTestUsers().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
