/**
 * Script para restablecer la contraseña de un usuario
 */

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
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

async function resetPassword(email: string, newPassword: string) {
  console.log(`🔐 Restableciendo contraseña para: ${email}\n`)

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
  console.log(`   Role: ${user.role}`)
  console.log('')

  // Hashear nueva contraseña
  console.log('🔒 Hasheando nueva contraseña...')
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Actualizar contraseña
  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update({ password_hash: hashedPassword })
    .eq('email', email)
    .select()
    .single()

  if (updateError) {
    console.error('❌ Error al actualizar:', updateError.message)
    return
  }

  console.log('✅ Contraseña actualizada exitosamente!')
  console.log('')
  console.log('🎉 Credenciales para iniciar sesión:')
  console.log(`   Email: ${email}`)
  console.log(`   Contraseña: ${newPassword}`)
  console.log('')
  console.log('💡 Guarda esta contraseña en un lugar seguro')
}

// Obtener parámetros de línea de comandos
const email = process.argv[2] || 'afernandezguyot@gmail.com'
const password = process.argv[3] || ''

if (!password) {
  console.error('❌ Error: Debes proporcionar una nueva contraseña')
  console.log('\nUso:')
  console.log('  node --import tsx scripts/reset-password.ts <email> <nueva_password>')
  console.log('\nEjemplo:')
  console.log('  node --import tsx scripts/reset-password.ts afernandezguyot@gmail.com miNuevaPassword123')
  process.exit(1)
}

if (password.length < 6) {
  console.error('❌ Error: La contraseña debe tener al menos 6 caracteres')
  process.exit(1)
}

resetPassword(email, password).catch(console.error)
