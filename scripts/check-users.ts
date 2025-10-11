/**
 * Script para verificar usuarios en Supabase
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

async function checkUsers() {
  console.log('🔍 Verificando usuarios en Supabase...\n')

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error al consultar usuarios:', error.message)
    return
  }

  if (!users || users.length === 0) {
    console.log('⚠️  No hay usuarios en la base de datos')
    return
  }

  console.log(`✅ Encontrados ${users.length} usuarios:\n`)

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Active: ${user.active}`)
    console.log(`   Tenant ID: ${user.tenant_id}`)
    console.log(`   Password Hash: ${user.password_hash ? user.password_hash.substring(0, 20) + '...' : 'NO CONFIGURADO'}`)
    console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
    console.log('')
  })

  // Probar query exacta del login
  console.log('🔍 Probando query exacta del login...\n')
  
  const email = 'admin@demo.restaurant'
  console.log(`Buscando: ${email}`)
  
  const { data: testUser, error: testError } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('email', email)
    .eq('active', true)
    .single()

  if (testError) {
    console.error('❌ Error:', testError.message)
  } else if (testUser) {
    console.log('✅ Usuario encontrado:')
    console.log('   Name:', testUser.name)
    console.log('   Email:', testUser.email)
    console.log('   Role:', testUser.role)
    console.log('   Tenant:', testUser.tenants)
  } else {
    console.log('⚠️  Usuario no encontrado')
  }
}

checkUsers().catch(console.error)
