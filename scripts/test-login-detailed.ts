/**
 * Script para probar login con credenciales reales
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import bcrypt from 'bcryptjs'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testLogin() {
  console.log('🧪 Probando login con credenciales actuales\n')
  console.log('═'.repeat(60))

  const email = 'afernandezguyot@gmail.com'
  const testPassword = 'Juan123'

  // Paso 1: Buscar usuario
  console.log('\n📊 PASO 1: Buscar usuario en base de datos')
  console.log('─'.repeat(60))
  console.log(`Email: ${email}`)

  const { data: users, error: searchError } = await supabase
    .from('users')
    .select(`
      *,
      tenants (
        id,
        name,
        slug,
        settings
      )
    `)
    .eq('email', email)
    .eq('active', true)
    .limit(1)

  if (searchError) {
    console.error('❌ Error al buscar usuario:', searchError.message)
    return
  }

  if (!users || users.length === 0) {
    console.error('❌ Usuario no encontrado o inactivo')
    return
  }

  const userData = users[0] as any
  console.log('✅ Usuario encontrado:')
  console.log(`   ID: ${userData.id}`)
  console.log(`   Nombre: ${userData.name}`)
  console.log(`   Email: ${userData.email}`)
  console.log(`   Role: ${userData.role}`)
  console.log(`   Active: ${userData.active}`)
  console.log(`   Tenant ID: ${userData.tenant_id}`)

  // Paso 2: Verificar contraseña con VARIAS opciones
  console.log('\n🔐 PASO 2: Verificar contraseñas')
  console.log('─'.repeat(60))

  const passwordsToTest = [
    'Juan123',
    'juan123',
    'password123',
    'Password123',
    'admin123',
    'Admin123',
  ]

  console.log('Probando contraseñas posibles...\n')

  let foundPassword = false
  let correctPassword = ''

  for (const pwd of passwordsToTest) {
    const isValid = await bcrypt.compare(pwd, userData.password_hash)
    console.log(`   Probando "${pwd}": ${isValid ? '✅ CORRECTA' : '❌'}`)
    if (isValid) {
      foundPassword = true
      correctPassword = pwd
      break
    }
  }

  if (!foundPassword) {
    console.log('\n❌ Ninguna de las contraseñas comunes funcionó')
    console.log('\n💡 Opciones:')
    console.log('   1. Resetear la contraseña con el script reset-password.ts')
    console.log('   2. Crear un nuevo usuario')
    console.log('   3. Verificar cuál es la contraseña correcta')
    return
  }

  console.log(`\n✅ Contraseña correcta encontrada: "${correctPassword}"`)

  // Paso 3: Mostrar datos del tenant
  console.log('\n🏢 PASO 3: Datos del tenant')
  console.log('─'.repeat(60))

  const tenantData = userData.tenants as any
  console.log(`Tenant: ${tenantData.name}`)
  console.log(`ID: ${tenantData.id}`)
  console.log(`Slug: ${tenantData.slug}`)

  // Paso 4: Simular respuesta de la API
  console.log('\n📦 PASO 4: Formato de respuesta de API')
  console.log('─'.repeat(60))

  const user = {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    active: userData.active,
    tenant_id: userData.tenant_id,
    last_login_at: new Date().toISOString(),
  }

  const tenant = {
    id: tenantData.id,
    name: tenantData.name,
    slug: tenantData.slug,
    logoUrl: tenantData.settings?.logoUrl,
    theme: {
      accentColor: tenantData.settings?.theme?.accentColor || '#3b82f6',
    },
    features: {
      tablets: tenantData.settings?.features?.tablets ?? true,
      kds: tenantData.settings?.features?.kds ?? true,
      payments: tenantData.settings?.features?.payments ?? true,
    },
  }

  console.log('Usuario:')
  console.log(JSON.stringify(user, null, 2))
  console.log('\nTenant:')
  console.log(JSON.stringify(tenant, null, 2))

  // Resumen
  console.log('\n' + '═'.repeat(60))
  console.log('📋 RESUMEN')
  console.log('═'.repeat(60))
  console.log(`✅ Email: ${email}`)
  console.log(`✅ Contraseña correcta: ${correctPassword}`)
  console.log(`✅ Usuario encontrado y activo`)
  console.log(`✅ Tenant configurado correctamente`)
  console.log('\n💡 PUEDES HACER LOGIN CON:')
  console.log(`   Email: ${email}`)
  console.log(`   Contraseña: ${correctPassword}`)
  console.log('')
}

testLogin().catch(console.error)
