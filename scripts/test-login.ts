/**
 * Script para probar el login con un usuario específico
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

async function testLogin(email: string, password: string) {
  console.log(`🔐 Probando login para: ${email}\n`)

  // 1. Buscar usuario
  console.log('📍 Paso 1: Buscando usuario...')
  const { data: users, error } = await supabase
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

  if (error) {
    console.error('❌ Error al buscar usuario:', error.message)
    return
  }

  if (!users || users.length === 0) {
    console.error('❌ Usuario no encontrado o inactivo')
    return
  }

  const userData = users[0]
  console.log('✅ Usuario encontrado:')
  console.log(`   ID: ${userData.id}`)
  console.log(`   Name: ${userData.name}`)
  console.log(`   Email: ${userData.email}`)
  console.log(`   Role: ${userData.role}`)
  console.log(`   Active: ${userData.active}`)
  console.log(`   Tenant ID: ${userData.tenant_id}`)
  console.log('')

  // 2. Verificar password
  console.log('📍 Paso 2: Verificando contraseña...')
  console.log(`   Password ingresado: ${password}`)
  console.log(`   Hash en DB: ${userData.password_hash?.substring(0, 20)}...`)
  
  try {
    const isValid = await bcrypt.compare(password, userData.password_hash)
    
    if (isValid) {
      console.log('✅ Contraseña válida!')
    } else {
      console.log('❌ Contraseña inválida')
      console.log('')
      console.log('💡 Sugerencias:')
      console.log('   - Verifica que estés usando la contraseña correcta')
      console.log('   - Si olvidaste tu contraseña, puedes restablecerla con el script reset-password.ts')
      return
    }
  } catch (err) {
    console.error('❌ Error al comparar contraseñas:', err)
    return
  }

  console.log('')

  // 3. Verificar tenant
  console.log('📍 Paso 3: Verificando tenant...')
  const tenantData = userData.tenants as any
  
  if (!tenantData) {
    console.error('❌ Tenant no encontrado')
    return
  }

  console.log('✅ Tenant encontrado:')
  console.log(`   ID: ${tenantData.id}`)
  console.log(`   Name: ${tenantData.name}`)
  console.log(`   Slug: ${tenantData.slug}`)
  console.log('')

  // 4. Simular respuesta del login
  console.log('📍 Paso 4: Datos que se devolverían al cliente:')
  
  const user = {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    active: userData.active,
    tenant_id: userData.tenant_id,
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

  console.log('User:', JSON.stringify(user, null, 2))
  console.log('Tenant:', JSON.stringify(tenant, null, 2))
  console.log('')
  console.log('✅ Login simulado exitoso!')
  console.log('🎉 Todo está funcionando correctamente desde el backend')
  console.log('')
  console.log('💡 Si aún no puedes iniciar sesión desde el navegador:')
  console.log('   1. Abre la consola del navegador (F12)')
  console.log('   2. Ve a la pestaña "Network" o "Red"')
  console.log('   3. Intenta hacer login')
  console.log('   4. Busca la petición a /api/auth/login')
  console.log('   5. Revisa la respuesta y compártela')
}

// Probar con el usuario específico
const email = process.argv[2] || 'afernandezguyot@gmail.com'
const password = process.argv[3] || ''

if (!password) {
  console.error('❌ Error: Debes proporcionar la contraseña')
  console.log('\nUso:')
  console.log('  node --import tsx scripts/test-login.ts <email> <password>')
  console.log('\nEjemplo:')
  console.log('  node --import tsx scripts/test-login.ts afernandezguyot@gmail.com mipassword')
  process.exit(1)
}

testLogin(email, password).catch(console.error)
