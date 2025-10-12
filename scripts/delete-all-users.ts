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
  console.log('⚠️  ADVERTENCIA: Estás a punto de BORRAR TODOS los usuarios\n')

  // Mostrar usuarios actuales
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id, name, email, role')
    .order('created_at', { ascending: false })

  if (fetchError) {
    console.error('❌ Error al consultar usuarios:', fetchError.message)
    return
  }

  if (!users || users.length === 0) {
    console.log('✅ No hay usuarios en la base de datos')
    return
  }

  console.log(`📋 Usuarios actuales (${users.length}):\n`)
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`)
  })

  console.log('\n')
  const answer = await askQuestion('¿Estás seguro de que quieres BORRAR TODOS estos usuarios? (escribe "SI" para confirmar): ')

  if (answer.toUpperCase() !== 'SI') {
    console.log('❌ Operación cancelada')
    return
  }

  // Confirmar una segunda vez
  const answer2 = await askQuestion('⚠️  Última confirmación. Escribe "BORRAR TODO" para continuar: ')

  if (answer2 !== 'BORRAR TODO') {
    console.log('❌ Operación cancelada')
    return
  }

  console.log('\n🗑️  Borrando usuarios...\n')

  // Borrar todos los usuarios
  const { error: deleteError, count } = await supabase
    .from('users')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Evitar borrar por error algún ID nulo

  if (deleteError) {
    console.error('❌ Error al borrar usuarios:', deleteError.message)
    return
  }

  console.log(`✅ Se han borrado ${count || users.length} usuarios exitosamente\n`)
  console.log('🎉 La base de datos está limpia. Puedes crear usuarios nuevos desde cero.\n')
}

deleteAllUsers().catch(console.error)
