/**
 * Script para BORRAR TODOS los usuarios de la base de datos
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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

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

async function deleteAllUsers() {
  console.log('\n🗑️  ELIMINANDO TODOS LOS USUARIOS\n')
  console.log('═══════════════════════════════════════════════════════\n')

  try {
    // 1. Listar usuarios en Auth
    const { data: authData, error: authListError } = await supabase.auth.admin.listUsers()

    if (authListError) {
      console.error('❌ Error al listar usuarios de Auth:', authListError.message)
      return
    }

    const authUsers = authData.users

    // 2. Listar usuarios en DB
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('❌ Error al consultar usuarios en DB:', dbError.message)
      return
    }

    const totalUsers = authUsers.length

    if (totalUsers === 0 && (!dbUsers || dbUsers.length === 0)) {
      console.log('✅ No hay usuarios para eliminar\n')
      console.log('═══════════════════════════════════════════════════════\n')
      return
    }

    console.log(`� Usuarios a eliminar:\n`)
    console.log(`   Auth: ${authUsers.length} usuarios`)
    console.log(`   DB:   ${dbUsers?.length || 0} usuarios\n`)

    if (authUsers.length > 0) {
      console.log('📋 Lista de usuarios:\n')
      authUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`)
      })
      console.log('')
    }

    console.log('─────────────────────────────────────────────────────\n')
    console.log('🗑️  Eliminando usuarios...\n')

    let deletedCount = 0
    let errorCount = 0

    // 3. Eliminar cada usuario de Auth (esto también limpia la tabla users por CASCADE)
    for (const user of authUsers) {
      try {
        console.log(`   Eliminando: ${user.email}...`)

        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

        if (deleteError) {
          throw deleteError
        }

        console.log(`   ✅ ${user.email} eliminado`)
        deletedCount++
      } catch (error: any) {
        console.error(`   ❌ Error al eliminar ${user.email}:`, error.message)
        errorCount++
      }
    }

    console.log('\n─────────────────────────────────────────────────────\n')
    console.log('✅ RESUMEN:\n')
    console.log(`   Eliminados: ${deletedCount}/${totalUsers}`)
    console.log(`   Errores: ${errorCount}`)
    console.log('')

    if (deletedCount === totalUsers) {
      console.log('🎉 TODOS LOS USUARIOS HAN SIDO ELIMINADOS\n')
      console.log('🎯 Ahora puedes probar el flujo completo:\n')
      console.log('   1. npm run dev')
      console.log('   2. Abrir http://localhost:3000/login')
      console.log('   3. Click en "¿No tienes cuenta? Créala aquí"')
      console.log('   4. Registrar tu usuario')
      console.log('   5. Iniciar sesión\n')
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  }

  console.log('═══════════════════════════════════════════════════════\n')
}

deleteAllUsers().catch(console.error)
