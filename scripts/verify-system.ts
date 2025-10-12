/**
 * Script de verificación completa del sistema de login
 * Verifica que todo esté configurado correctamente
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

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

async function verifySystem() {
  console.log('🔍 VERIFICACIÓN COMPLETA DEL SISTEMA DE LOGIN\n')
  console.log('═══════════════════════════════════════════════════════\n')

  let allChecks = true

  // 1. Verificar tenant
  console.log('1️⃣ Verificando tenant...')
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .limit(1)
    .single()

  if (tenantError || !tenant) {
    console.error('   ❌ No hay tenant configurado')
    allChecks = false
  } else {
    console.log(`   ✅ Tenant: ${tenant.name} (${tenant.id})`)
  }

  // 2. Verificar usuarios en auth.users
  console.log('\n2️⃣ Verificando usuarios en Supabase Auth...')
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('   ❌ Error al consultar auth.users:', authError.message)
    allChecks = false
  } else {
    const authUsers = authData?.users || []
    console.log(`   ✅ Usuarios en auth.users: ${authUsers.length}`)
    
    if (authUsers.length === 0) {
      console.log('   ⚠️  No hay usuarios. Ejecuta: node --import tsx scripts/create-test-users.ts')
    } else {
      authUsers.forEach((user, i) => {
        console.log(`      ${i + 1}. ${user.email}`)
      })
    }
  }

  // 3. Verificar usuarios en tabla users
  console.log('\n3️⃣ Verificando usuarios en tabla users...')
  const { data: dbUsers, error: dbError } = await supabase
    .from('users')
    .select('id, email, name, role, active, tenant_id')
    .order('created_at', { ascending: false })

  if (dbError) {
    console.error('   ❌ Error al consultar tabla users:', dbError.message)
    allChecks = false
  } else {
    console.log(`   ✅ Usuarios en tabla users: ${dbUsers?.length || 0}`)
    
    if (!dbUsers || dbUsers.length === 0) {
      console.log('   ⚠️  No hay usuarios. Ejecuta: node --import tsx scripts/create-test-users.ts')
    } else {
      dbUsers.forEach((user, i) => {
        console.log(`      ${i + 1}. ${user.email} (${user.role}) - ${user.active ? 'activo' : 'inactivo'}`)
      })
    }
  }

  // 4. Verificar sincronización (IDs coinciden)
  console.log('\n4️⃣ Verificando sincronización auth.users ↔ users...')
  
  if (authData?.users && dbUsers) {
    const authUserIds = new Set(authData.users.map(u => u.id))
    const dbUserIds = new Set(dbUsers.map(u => u.id))
    
    const onlyInAuth = authData.users.filter(u => !dbUserIds.has(u.id))
    const onlyInDb = dbUsers.filter(u => !authUserIds.has(u.id))
    
    if (onlyInAuth.length > 0) {
      console.log('   ⚠️  Usuarios solo en auth.users:')
      onlyInAuth.forEach(u => console.log(`      - ${u.email}`))
      allChecks = false
    }
    
    if (onlyInDb.length > 0) {
      console.log('   ⚠️  Usuarios solo en tabla users:')
      onlyInDb.forEach(u => console.log(`      - ${u.email}`))
      allChecks = false
    }
    
    if (onlyInAuth.length === 0 && onlyInDb.length === 0) {
      console.log('   ✅ Todos los usuarios están sincronizados')
    }
  }

  // 5. Probar query de login
  console.log('\n5️⃣ Probando query de login...')
  
  if (dbUsers && dbUsers.length > 0) {
    const testEmail = dbUsers[0].email
    
    const { data: testUser, error: testError } = await supabase
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
      .eq('email', testEmail)
      .eq('active', true)
      .single()

    if (testError) {
      console.error('   ❌ Error en query:', testError.message)
      allChecks = false
    } else if (!testUser.tenants) {
      console.error('   ❌ Datos de tenant no disponibles')
      allChecks = false
    } else {
      console.log(`   ✅ Query funciona correctamente`)
      console.log(`   ✅ Usuario: ${testUser.name}`)
      console.log(`   ✅ Tenant: ${testUser.tenants.name}`)
    }
  } else {
    console.log('   ⚠️  No hay usuarios para probar')
  }

  // 6. Verificar variables de entorno
  console.log('\n6️⃣ Verificando configuración...')
  const useSupabaseAuth = process.env.NEXT_PUBLIC_USE_SUPABASE_AUTH
  console.log(`   NEXT_PUBLIC_USE_SUPABASE_AUTH: ${useSupabaseAuth || 'no configurado'}`)
  
  if (useSupabaseAuth !== 'true') {
    console.log('   ⚠️  Se recomienda usar NEXT_PUBLIC_USE_SUPABASE_AUTH=true')
  } else {
    console.log('   ✅ Configuración correcta')
  }

  // Resumen final
  console.log('\n═══════════════════════════════════════════════════════')
  
  if (allChecks) {
    console.log('✅ SISTEMA COMPLETAMENTE FUNCIONAL\n')
    console.log('🎉 Todo está configurado correctamente')
    console.log('\n📝 Para iniciar sesión:')
    console.log('   1. Ejecuta: npm run dev')
    console.log('   2. Abre: http://localhost:3000/login')
    console.log('   3. Usa cualquiera de las credenciales mostradas arriba')
  } else {
    console.log('⚠️  SE ENCONTRARON PROBLEMAS\n')
    console.log('Revisa los mensajes de error arriba')
    console.log('\n💡 Posibles soluciones:')
    console.log('   - Ejecutar: node --import tsx scripts/clean-all-users.ts')
    console.log('   - Ejecutar: node --import tsx scripts/create-test-users.ts')
  }
  
  console.log('\n═══════════════════════════════════════════════════════\n')
}

verifySystem().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
