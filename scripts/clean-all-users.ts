/**
 * Script para LIMPIAR COMPLETAMENTE todos los usuarios
 * Borra usuarios de:
 * 1. auth.users (Supabase Auth)
 * 2. users (tabla custom)
 * 
 * ⚠️ CUIDADO: Esta operación es irreversible
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as readline from 'readline'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise(resolve => rl.question(query, ans => {
    rl.close()
    resolve(ans)
  }))
}

async function cleanAllUsers() {
  console.log('🧹 LIMPIEZA COMPLETA DE USUARIOS\n')
  console.log('⚠️  Esta operación borrará TODOS los usuarios de:\n')
  console.log('   1. Supabase Auth (auth.users)')
  console.log('   2. Tabla users (base de datos)\n')

  // 1. Mostrar usuarios de la tabla users
  console.log('📋 Usuarios en tabla "users":\n')
  const { data: dbUsers, error: dbError } = await supabase
    .from('users')
    .select('id, name, email, role, active')
    .order('created_at', { ascending: false })

  if (dbError) {
    console.error('❌ Error al consultar tabla users:', dbError.message)
    return
  }

  if (dbUsers && dbUsers.length > 0) {
    dbUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role} - ${user.active ? 'activo' : 'inactivo'}`)
    })
    console.log(`\n   Total: ${dbUsers.length} usuarios\n`)
  } else {
    console.log('   ✅ No hay usuarios en la tabla users\n')
  }

  // 2. Mostrar usuarios de Supabase Auth
  console.log('📋 Usuarios en Supabase Auth:\n')
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('❌ Error al consultar auth.users:', authError.message)
    return
  }

  const authUsers = authData?.users || []
  if (authUsers.length > 0) {
    authUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} - ID: ${user.id}`)
    })
    console.log(`\n   Total: ${authUsers.length} usuarios\n`)
  } else {
    console.log('   ✅ No hay usuarios en auth.users\n')
  }

  // Si no hay usuarios en ningún lado
  if ((!dbUsers || dbUsers.length === 0) && authUsers.length === 0) {
    console.log('✅ No hay usuarios que borrar. El sistema está limpio.\n')
    return
  }

  // Pedir confirmación
  console.log('⚠️  ¿REALMENTE quieres BORRAR TODOS estos usuarios?\n')
  const answer = await askQuestion('Escribe "SI" para confirmar: ')

  if (answer.toUpperCase() !== 'SI') {
    console.log('❌ Operación cancelada\n')
    return
  }

  // Confirmar una segunda vez
  const answer2 = await askQuestion('\n⚠️  Última confirmación. Escribe "ELIMINAR TODO" para continuar: ')

  if (answer2 !== 'ELIMINAR TODO') {
    console.log('❌ Operación cancelada\n')
    return
  }

  console.log('\n🗑️  Iniciando limpieza...\n')

  let deletedAuthCount = 0
  let deletedDbCount = 0

  // 3. Borrar usuarios de Supabase Auth
  if (authUsers.length > 0) {
    console.log('🔄 Borrando usuarios de Supabase Auth...')
    
    for (const user of authUsers) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(user.id)
        if (error) {
          console.error(`   ❌ Error al borrar ${user.email}:`, error.message)
        } else {
          deletedAuthCount++
          console.log(`   ✅ Borrado de Auth: ${user.email}`)
        }
      } catch (err) {
        console.error(`   ❌ Excepción al borrar ${user.email}:`, err)
      }
    }
    
    console.log(`\n   Total borrados de Auth: ${deletedAuthCount}/${authUsers.length}\n`)
  }

  // 4. Borrar usuarios de la tabla users
  if (dbUsers && dbUsers.length > 0) {
    console.log('🔄 Borrando usuarios de tabla users...')
    
    const { error: deleteError, count } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Condición siempre verdadera

    if (deleteError) {
      console.error('   ❌ Error al borrar usuarios:', deleteError.message)
    } else {
      deletedDbCount = count || dbUsers.length
      console.log(`   ✅ Total borrados de DB: ${deletedDbCount}/${dbUsers.length}\n`)
    }
  }

  // Resumen final
  console.log('═══════════════════════════════════════════════════════')
  console.log('✅ LIMPIEZA COMPLETADA\n')
  console.log(`   Usuarios borrados de Auth: ${deletedAuthCount}`)
  console.log(`   Usuarios borrados de DB: ${deletedDbCount}`)
  console.log('\n🎉 El sistema está completamente limpio.')
  console.log('   Puedes crear usuarios nuevos desde cero.\n')
  console.log('═══════════════════════════════════════════════════════\n')
}

cleanAllUsers().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
