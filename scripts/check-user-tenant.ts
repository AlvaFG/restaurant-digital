#!/usr/bin/env node

/**
 * Script para verificar el tenant_id del último usuario logueado
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

async function checkUserTenant() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Variables de entorno no configuradas')
    console.log('Asegúrate de tener:')
    console.log('  - NEXT_PUBLIC_SUPABASE_URL')
    console.log('  - SUPABASE_SERVICE_ROLE_KEY')
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  console.log('🔍 Buscando último usuario activo...\n')

  // Buscar último usuario con login
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, role, tenant_id, last_login_at, active')
    .eq('active', true)
    .order('last_login_at', { ascending: false, nullsFirst: false })
    .limit(5)

  if (usersError) {
    console.error('❌ Error al buscar usuarios:', usersError.message)
    return
  }

  if (!users || users.length === 0) {
    console.log('⚠️ No se encontraron usuarios activos')
    return
  }

  console.log(`✅ Usuarios activos encontrados: ${users.length}\n`)

  for (const user of users) {
    console.log('━'.repeat(60))
    console.log(`👤 Usuario: ${user.name} (${user.email})`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Tenant ID: ${user.tenant_id || '⚠️ NULL'}`)
    console.log(`   Último login: ${user.last_login_at || 'Nunca'}`)
    console.log(`   Activo: ${user.active ? '✅' : '❌'}`)

    if (user.tenant_id) {
      // Verificar si el tenant existe
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name, slug, settings')
        .eq('id', user.tenant_id)
        .single()

      if (tenantError || !tenant) {
        console.log(`   🚨 PROBLEMA: Tenant no encontrado en la base de datos`)
        console.log(`      Error: ${tenantError?.message || 'Tenant no existe'}`)
        console.log(`   🔧 SOLUCIÓN: Asignar un tenant válido a este usuario`)
      } else {
        console.log(`   ✅ Tenant encontrado: ${tenant.name} (${tenant.slug})`)
      }
    } else {
      console.log(`   🚨 PROBLEMA: Usuario sin tenant_id asignado`)
      console.log(`   🔧 SOLUCIÓN: Asignar un tenant a este usuario`)
    }
    console.log('')
  }

  console.log('━'.repeat(60))
  console.log('\n📊 Verificando tenants disponibles...\n')

  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .limit(10)

  if (tenantsError) {
    console.error('❌ Error al buscar tenants:', tenantsError.message)
    return
  }

  if (!tenants || tenants.length === 0) {
    console.log('⚠️ No hay tenants en la base de datos')
    console.log('🔧 Necesitas crear un tenant primero')
    return
  }

  console.log(`✅ Tenants disponibles: ${tenants.length}\n`)
  tenants.forEach((tenant, index) => {
    console.log(`${index + 1}. ${tenant.name} (${tenant.slug})`)
    console.log(`   ID: ${tenant.id}`)
  })

  console.log('\n━'.repeat(60))
  console.log('\n💡 Para asignar un tenant a un usuario, ejecuta:')
  console.log('   npx tsx scripts/assign-tenant-to-user.ts <user_id> <tenant_id>')
}

checkUserTenant().catch(error => {
  console.error('❌ Error fatal:', error)
  process.exit(1)
})
