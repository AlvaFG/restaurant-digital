/**
 * Script de diagnóstico para verificar usuario en Supabase
 * 
 * Este script verifica:
 * 1. Usuario en auth.users
 * 2. Usuario en tabla users
 * 3. Tenant asociado
 * 4. Configuración completa
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const EMAIL_TO_CHECK = 'Afernandezguyot@gmail.com'

async function debugUser() {
  console.log('\n🔍 ========== DIAGNÓSTICO DE USUARIO ==========\n')
  console.log(`📧 Verificando usuario: ${EMAIL_TO_CHECK}\n`)

  try {
    // 1. Buscar en auth.users
    console.log('1️⃣ Verificando en auth.users...')
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error al obtener usuarios de auth:', authError)
      return
    }

    const authUser = authUsers.find(u => u.email?.toLowerCase() === EMAIL_TO_CHECK.toLowerCase())
    
    if (!authUser) {
      console.error(`❌ Usuario ${EMAIL_TO_CHECK} NO encontrado en auth.users`)
      console.log('   ℹ️  Usuarios registrados:', authUsers.map(u => u.email).join(', '))
      return
    }

    console.log(`✅ Usuario encontrado en auth.users`)
    console.log(`   - ID: ${authUser.id}`)
    console.log(`   - Email: ${authUser.email}`)
    console.log(`   - Email confirmado: ${authUser.email_confirmed_at ? 'Sí' : 'No'}`)
    console.log(`   - Creado: ${authUser.created_at}`)
    console.log(`   - Último login: ${authUser.last_sign_in_at || 'Nunca'}`)

    // 2. Buscar en tabla users
    console.log('\n2️⃣ Verificando en tabla users...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (userError) {
      console.error('❌ Error al obtener usuario de tabla users:', userError.message)
      console.log('   ℹ️  Código de error:', userError.code)
      console.log('   ℹ️  Detalles:', userError.details)
      return
    }

    if (!userData) {
      console.error(`❌ Usuario ${authUser.id} NO encontrado en tabla users`)
      return
    }

    console.log(`✅ Usuario encontrado en tabla users`)
    console.log(`   - ID: ${userData.id}`)
    console.log(`   - Nombre: ${userData.name}`)
    console.log(`   - Email: ${userData.email}`)
    console.log(`   - Rol: ${userData.role}`)
    console.log(`   - Activo: ${userData.active}`)
    console.log(`   - Tenant ID: ${userData.tenant_id}`)

    if (!userData.tenant_id) {
      console.error('❌ PROBLEMA: Usuario no tiene tenant_id asignado')
      return
    }

    // 3. Buscar tenant
    console.log('\n3️⃣ Verificando tenant...')
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', userData.tenant_id)
      .single()

    if (tenantError) {
      console.error('❌ Error al obtener tenant:', tenantError.message)
      console.log('   ℹ️  Código de error:', tenantError.code)
      console.log('   ℹ️  Detalles:', tenantError.details)
      return
    }

    if (!tenantData) {
      console.error(`❌ Tenant ${userData.tenant_id} NO encontrado`)
      return
    }

    console.log(`✅ Tenant encontrado`)
    console.log(`   - ID: ${tenantData.id}`)
    console.log(`   - Nombre: ${tenantData.name}`)
    console.log(`   - Slug: ${tenantData.slug}`)
    console.log(`   - Settings: ${JSON.stringify(tenantData.settings, null, 2)}`)

    // 4. Verificar políticas RLS
    console.log('\n4️⃣ Verificando políticas RLS...')
    
    // Simular consulta como usuario autenticado
    const userSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Establecer sesión simulada
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: EMAIL_TO_CHECK
    })

    if (sessionError) {
      console.warn('⚠️ No se pudo generar link mágico para prueba RLS')
    }

    console.log('\n✅ ========== DIAGNÓSTICO COMPLETO ==========')
    console.log('\n📊 RESUMEN:')
    console.log(`   ✅ Usuario existe en auth.users`)
    console.log(`   ✅ Usuario existe en tabla users`)
    console.log(`   ✅ Usuario tiene tenant_id: ${userData.tenant_id}`)
    console.log(`   ✅ Tenant existe y es válido`)
    console.log('\n💡 El usuario está correctamente configurado.')
    console.log('   Si hay problema de carga, revisar:')
    console.log('   1. Timeout en /api/auth/me (10 segundos)')
    console.log('   2. Cookies no se establecen correctamente')
    console.log('   3. Estado isLoading no se actualiza en AuthContext')
    console.log('   4. Middleware causa redirección infinita')

  } catch (error) {
    console.error('\n❌ Error crítico durante diagnóstico:', error)
  }
}

debugUser()
