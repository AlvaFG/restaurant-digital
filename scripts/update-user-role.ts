/**
 * Script para actualizar el rol de un usuario a admin
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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateUserRole() {
  const email = 'afernandezguyot@gmail.com'
  const newRole = 'admin'

  console.log(`🔄 Actualizando usuario ${email} a rol ${newRole}...\n`)

  // Buscar usuario
  const { data: user, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (findError || !user) {
    console.error('❌ Usuario no encontrado:', findError?.message)
    return
  }

  console.log('👤 Usuario encontrado:')
  console.log(`   Name: ${user.name}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Rol actual: ${user.role}`)
  console.log('')

  // Actualizar rol
  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('email', email)
    .select()
    .single()

  if (updateError) {
    console.error('❌ Error al actualizar:', updateError.message)
    return
  }

  console.log('✅ Rol actualizado exitosamente!')
  console.log(`   Name: ${updated.name}`)
  console.log(`   Email: ${updated.email}`)
  console.log(`   Rol nuevo: ${updated.role}`)
  console.log('')
  console.log('🎉 Ya puedes iniciar sesión con permisos de administrador')
}

updateUserRole().catch(console.error)
