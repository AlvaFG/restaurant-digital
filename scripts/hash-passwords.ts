/**
 * Script para hashear passwords de usuarios demo
 * 
 * Genera hashes bcrypt para los usuarios demo y los actualiza en Supabase
 */

import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function hashPasswords() {
  console.log('🔐 Hasheando passwords...\n')

  // Passwords para usuarios demo
  const passwords = {
    'admin@demo.restaurant': 'demo123',
    'mesero@demo.restaurant': 'staff123'
  }

  const saltRounds = 10

  for (const [email, password] of Object.entries(passwords)) {
    console.log(`📧 Procesando: ${email}`)
    
    // Generar hash
    const hash = await bcrypt.hash(password, saltRounds)
    console.log(`   Password: ${password}`)
    console.log(`   Hash: ${hash}`)
    
    // Actualizar en Supabase
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: hash })
      .eq('email', email)
      .select()
    
    if (error) {
      console.error(`   ❌ Error: ${error.message}`)
    } else if (data && data.length > 0) {
      console.log(`   ✅ Usuario actualizado: ${data[0].name}`)
    } else {
      console.log(`   ⚠️  Usuario no encontrado`)
    }
    
    console.log('')
  }

  console.log('✅ Proceso completado!\n')
  console.log('Credenciales actualizadas:')
  console.log('- admin@demo.restaurant / demo123')
  console.log('- mesero@demo.restaurant / staff123')
}

hashPasswords().catch(console.error)
