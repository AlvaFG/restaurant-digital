/**
 * Script para verificar el usuario recién creado
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

async function checkUser() {
  console.log('\n🔍 VERIFICANDO USUARIO RECIÉN CREADO\n')
  console.log('═══════════════════════════════════════════════════════\n')

  try {
    // Buscar el último usuario creado
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (usersError) throw usersError

    if (!users || users.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos\n')
      return
    }

    const user = users[0]

    console.log('👤 ÚLTIMO USUARIO CREADO:\n')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Nombre: ${user.name}`)
    console.log(`   Rol: ${user.role}`)
    console.log(`   Tenant ID: ${user.tenant_id}`)
    console.log(`   Created by admin: ${user.created_by_admin_id || 'N/A (es admin)'}`)
    console.log(`   Activo: ${user.active}`)
    console.log(`   Creado: ${new Date(user.created_at).toLocaleString()}\n`)

    // Verificar que el tenant existe
    console.log('🏢 VERIFICANDO TENANT...\n')
    
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', user.tenant_id)
      .single()

    if (tenantError || !tenant) {
      console.log('❌ ERROR: El tenant no existe!')
      console.log(`   Tenant ID esperado: ${user.tenant_id}`)
      console.log(`   Error: ${tenantError?.message}\n`)
      
      console.log('🔧 SOLUCIÓN: Crear el tenant faltante\n')
      return
    }

    console.log('✅ Tenant encontrado:')
    console.log(`   ID: ${tenant.id}`)
    console.log(`   Nombre: ${tenant.name}`)
    console.log(`   Slug: ${tenant.slug}\n`)

    // Verificar en Auth
    console.log('🔐 VERIFICANDO EN SUPABASE AUTH...\n')

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id)

    if (authError || !authUser.user) {
      console.log('❌ ERROR: Usuario no encontrado en Auth')
      console.log(`   Error: ${authError?.message}\n`)
      return
    }

    console.log('✅ Usuario en Auth:')
    console.log(`   ID: ${authUser.user.id}`)
    console.log(`   Email: ${authUser.user.email}`)
    console.log(`   Email confirmado: ${authUser.user.email_confirmed_at ? 'Sí' : 'No'}`)
    console.log(`   Creado: ${new Date(authUser.user.created_at).toLocaleString()}\n`)

    console.log('═══════════════════════════════════════════════════════')
    console.log('✅ TODO OK - El usuario está correctamente creado\n')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkUser().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
