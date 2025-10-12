#!/usr/bin/env node

/**
 * Script para crear el tenant faltante basado en el error
 * 
 * Este script crea un tenant de prueba para el tenant_id que está faltando
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Tenant ID que está faltando según los logs
const MISSING_TENANT_ID = '46824e99-1d3f-4a13-8e96-17797f6149af'

async function createMissingTenant() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Variables de entorno no configuradas')
    console.log('Asegúrate de tener:')
    console.log('  - NEXT_PUBLIC_SUPABASE_URL')
    console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  console.log('🔍 Verificando si el tenant ya existe...\n')

  // Verificar si ya existe
  const { data: existing, error: checkError } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', MISSING_TENANT_ID)
    .single()

  if (existing && !checkError) {
    console.log('✅ El tenant ya existe:')
    console.log(`   ID: ${existing.id}`)
    console.log(`   Nombre: ${existing.name}`)
    console.log(`   Slug: ${existing.slug}`)
    console.log('\n🎉 El problema debería estar resuelto!')
    return
  }

  console.log('⚠️ El tenant no existe, creándolo...\n')

  // Crear el tenant faltante
  const newTenant = {
    id: MISSING_TENANT_ID,
    name: 'Mi Restaurante',
    slug: 'mi-restaurante',
    settings: {
      logoUrl: null,
      theme: {
        accentColor: '#3b82f6'
      },
      features: {
        tablets: true,
        kds: true,
        payments: true
      }
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('tenants')
    .insert([newTenant])
    .select()
    .single()

  if (error) {
    console.error('❌ Error al crear tenant:', error.message)
    console.log('\n💡 Posibles soluciones:')
    console.log('1. Verifica que tienes permisos de escritura en la tabla tenants')
    console.log('2. Verifica las políticas RLS de la tabla tenants')
    console.log('3. Usa Supabase Studio para crear el tenant manualmente')
    console.log('\n📝 Datos del tenant a crear:')
    console.log(JSON.stringify(newTenant, null, 2))
    return
  }

  console.log('✅ Tenant creado exitosamente:')
  console.log(`   ID: ${data.id}`)
  console.log(`   Nombre: ${data.name}`)
  console.log(`   Slug: ${data.slug}`)
  console.log('\n🎉 ¡Problema resuelto! Ahora puedes hacer login.')
  console.log('   Recarga el navegador y vuelve a intentar.')
}

createMissingTenant().catch(error => {
  console.error('❌ Error fatal:', error.message)
  process.exit(1)
})
