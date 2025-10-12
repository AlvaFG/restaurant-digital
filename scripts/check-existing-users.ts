/**
 * Script para verificar usuarios existentes en la base de datos
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

async function checkExistingUsers() {
  console.log('\n🔍 VERIFICANDO USUARIOS EXISTENTES\n')
  console.log('═══════════════════════════════════════════════════════\n')

  try {
    // 1. Verificar usuarios en auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error('❌ Error al consultar auth.users:', authError.message)
      return
    }

    console.log(`📊 Usuarios en Auth (auth.users): ${authUsers.users.length}\n`)

    if (authUsers.users.length > 0) {
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`)
        console.log(`      ID: ${user.id}`)
        console.log(`      Confirmado: ${user.email_confirmed_at ? '✅' : '❌'}`)
        console.log(`      Creado: ${new Date(user.created_at).toLocaleString()}`)
        console.log('')
      })
    } else {
      console.log('   ⚠️  No hay usuarios en Auth\n')
    }

    // 2. Verificar usuarios en la tabla users
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, email, name, role, active, created_at')
      .order('created_at', { ascending: true })

    if (dbError) {
      console.error('❌ Error al consultar tabla users:', dbError.message)
      return
    }

    console.log('─────────────────────────────────────────────────────\n')
    console.log(`📊 Usuarios en Base de Datos (public.users): ${dbUsers?.length || 0}\n`)

    if (dbUsers && dbUsers.length > 0) {
      dbUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email})`)
        console.log(`      ID: ${user.id}`)
        console.log(`      Rol: ${user.role}`)
        console.log(`      Activo: ${user.active ? '✅' : '❌'}`)
        console.log(`      Creado: ${new Date(user.created_at).toLocaleString()}`)
        console.log('')
      })
    } else {
      console.log('   ⚠️  No hay usuarios en la tabla users\n')
    }

    // 3. Verificar discrepancias
    console.log('─────────────────────────────────────────────────────\n')
    console.log('🔍 ANÁLISIS:\n')

    const authEmails = new Set(authUsers.users.map(u => u.email))
    const dbEmails = new Set(dbUsers?.map(u => u.email) || [])

    const onlyInAuth = authUsers.users.filter(u => !dbEmails.has(u.email!))
    const onlyInDb = dbUsers?.filter(u => !authEmails.has(u.email)) || []

    if (onlyInAuth.length > 0) {
      console.log('   ⚠️  Usuarios solo en Auth (falta crear en DB):')
      onlyInAuth.forEach(u => console.log(`      - ${u.email}`))
      console.log('')
    }

    if (onlyInDb.length > 0) {
      console.log('   ⚠️  Usuarios solo en DB (no están en Auth):')
      onlyInDb.forEach(u => console.log(`      - ${u.email}`))
      console.log('')
    }

    if (onlyInAuth.length === 0 && onlyInDb.length === 0 && authUsers.users.length > 0) {
      console.log('   ✅ Todos los usuarios están sincronizados entre Auth y DB\n')
    }

    if (authUsers.users.length === 0 && dbUsers?.length === 0) {
      console.log('   ℹ️  No hay usuarios creados todavía\n')
      console.log('   💡 Puedes crear usuarios de prueba ejecutando:')
      console.log('      npm run create-test-users\n')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }

  console.log('═══════════════════════════════════════════════════════\n')
}

checkExistingUsers().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
