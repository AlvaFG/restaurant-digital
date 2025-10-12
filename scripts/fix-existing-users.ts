/**
 * Script para actualizar usuarios existentes con created_by_admin_id
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

async function fixExistingUsers() {
  console.log('\n🔧 ARREGLANDO USUARIOS EXISTENTES\n')
  console.log('═══════════════════════════════════════════════════════\n')

  try {
    // 1. Buscar todos los usuarios
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role, tenant_id, created_by_admin_id')
      .order('created_at', { ascending: true })

    if (usersError) throw usersError

    if (!users || users.length === 0) {
      console.log('⚠️  No hay usuarios')
      return
    }

    console.log(`📋 Usuarios encontrados: ${users.length}\n`)

    // 2. Agrupar por tenant
    const tenants = new Map<string, typeof users>()
    users.forEach(user => {
      if (!tenants.has(user.tenant_id)) {
        tenants.set(user.tenant_id, [])
      }
      tenants.get(user.tenant_id)!.push(user)
    })

    // 3. Procesar cada tenant
    for (const [tenantId, tenantUsers] of tenants) {
      console.log(`🏢 Tenant: ${tenantId}`)
      console.log(`   Usuarios: ${tenantUsers.length}\n`)

      // Buscar el primer admin del tenant
      const admin = tenantUsers.find(u => u.role === 'admin')
      
      if (!admin) {
        console.log('   ⚠️  No hay admin en este tenant, saltando...\n')
        continue
      }

      console.log(`   👨‍💼 Admin: ${admin.email}\n`)

      // Buscar staff sin created_by_admin_id
      const staffToFix = tenantUsers.filter(
        u => u.role === 'staff' && !u.created_by_admin_id
      )

      if (staffToFix.length === 0) {
        console.log('   ✅ No hay staff para arreglar\n')
        continue
      }

      console.log(`   🔧 Staff a arreglar: ${staffToFix.length}`)

      // Actualizar cada staff
      for (const staff of staffToFix) {
        console.log(`      → ${staff.email}... `, '')

        const { error: updateError } = await supabase
          .from('users')
          .update({ created_by_admin_id: admin.id })
          .eq('id', staff.id)

        if (updateError) {
          console.log(`❌ Error: ${updateError.message}`)
        } else {
          console.log('✅')
        }
      }

      console.log('')
    }

    // 4. Verificar resultado
    console.log('═══════════════════════════════════════════════════════')
    console.log('📊 VERIFICACIÓN FINAL\n')

    const { data: finalCheck, error: checkError } = await supabase
      .from('users')
      .select('email, role, created_by_admin_id')
      .eq('role', 'staff')

    if (checkError) throw checkError

    console.log('Staff después de la actualización:\n')
    finalCheck?.forEach(u => {
      const status = u.created_by_admin_id ? '✅' : '❌'
      console.log(`   ${status} ${u.email}`)
      console.log(`      created_by_admin_id: ${u.created_by_admin_id || 'NULL'}\n`)
    })

    console.log('═══════════════════════════════════════════════════════\n')
    console.log('✅ Proceso completado\n')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

fixExistingUsers().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
