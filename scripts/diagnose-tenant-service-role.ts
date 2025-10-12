/**
 * Script para verificar y crear tenant directamente en Supabase
 * Usa el Service Role Key para bypassear RLS
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

console.log('🔧 Conectando a Supabase con Service Role...')

// Crear cliente con Service Role (bypasea RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const TENANT_ID = '46824e99-1d3f-4a13-8e96-17797f6149af'
const USER_ID = 'f46e1868-1b50-422c-b4d9-1eae1e6c6f1d'

async function main() {
  console.log('\n1️⃣ Verificando si el tenant existe...')
  
  // Verificar tenant
  const { data: existingTenant, error: checkError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', TENANT_ID)
    .single()

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('❌ Error al verificar tenant:', checkError)
  }

  if (existingTenant) {
    console.log('✅ El tenant YA EXISTE:')
    console.log(JSON.stringify(existingTenant, null, 2))
  } else {
    console.log('⚠️  El tenant NO EXISTE. Creándolo...')
    
    // Crear tenant
    const { data: newTenant, error: insertError } = await supabase
      .from('tenants')
      .insert({
        id: TENANT_ID,
        name: 'Mi Restaurante',
        slug: 'mi-restaurante',
        settings: {
          logoUrl: null,
          theme: { accentColor: '#3b82f6' },
          features: { tablets: true, kds: true, payments: true }
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error al crear tenant:', insertError)
      process.exit(1)
    }

    console.log('✅ Tenant creado exitosamente:')
    console.log(JSON.stringify(newTenant, null, 2))
  }

  console.log('\n2️⃣ Verificando relación usuario-tenant...')
  
  // Verificar usuario
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, tenant_id, active')
    .eq('id', USER_ID)
    .single()

  if (userError) {
    console.error('❌ Error al obtener usuario:', userError)
    process.exit(1)
  }

  console.log('📋 Usuario:')
  console.log(JSON.stringify(user, null, 2))

  if (user.tenant_id === TENANT_ID) {
    console.log('✅ Usuario está correctamente vinculado al tenant')
  } else {
    console.log('⚠️  Usuario tiene tenant_id diferente:', user.tenant_id)
  }

  console.log('\n3️⃣ Probando query con Service Role (como /api/auth/me debería hacer)...')
  
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, slug, settings')
    .eq('id', user.tenant_id)
    .limit(1)

  console.log('Tenant query result:')
  console.log('- Data:', tenant)
  console.log('- Error:', tenantError)

  if (tenant && tenant.length > 0) {
    console.log('\n✅ SUCCESS! El tenant se puede obtener con Service Role')
    console.log('Tenant data:', JSON.stringify(tenant[0], null, 2))
  } else {
    console.log('\n❌ FALLO: No se pudo obtener el tenant incluso con Service Role')
    console.log('Esto indica un problema más profundo')
  }

  console.log('\n🎯 Resumen:')
  console.log('- Tenant ID:', TENANT_ID)
  console.log('- Usuario ID:', USER_ID)
  console.log('- Tenant existe:', existingTenant ? '✅ SÍ' : '❌ NO')
  console.log('- Usuario vinculado:', user.tenant_id === TENANT_ID ? '✅ SÍ' : '❌ NO')
  console.log('- Service Role funciona:', tenant && tenant.length > 0 ? '✅ SÍ' : '❌ NO')
}

main().catch(console.error)
