#!/usr/bin/env node

/**
 * Script para crear el tenant faltante vía API
 */

const TENANT_ID = '46824e99-1d3f-4a13-8e96-17797f6149af'

async function createTenant() {
  console.log('🔧 Creando tenant faltante...\n')
  console.log(`   Tenant ID: ${TENANT_ID}`)
  console.log(`   Nombre: Mi Restaurante`)
  console.log(`   Slug: mi-restaurante\n`)

  try {
    // Importar node-fetch dinámicamente
    const fetch = (await import('node-fetch')).default
    
    const response = await fetch('http://localhost:3000/api/tenants/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tenant_id: TENANT_ID,
        name: 'Mi Restaurante',
        slug: 'mi-restaurante'
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Error:', data.error?.message || data.error)
      process.exit(1)
    }

    if (data.data.created) {
      console.log('✅ Tenant creado exitosamente!')
    } else {
      console.log('✅ Tenant ya existía!')
    }

    console.log('\n📊 Datos del tenant:')
    console.log(`   ID: ${data.data.tenant.id}`)
    console.log(`   Nombre: ${data.data.tenant.name}`)
    console.log(`   Slug: ${data.data.tenant.slug}`)

    console.log('\n🎉 ¡Problema resuelto!')
    console.log('   Recarga el navegador (Ctrl+R) y vuelve a intentar el login.')
  } catch (error) {
    console.error('❌ Error al llamar a la API:', error.message)
    console.log('\n💡 Asegúrate de que el servidor esté corriendo:')
    console.log('   npm run dev')
    process.exit(1)
  }
}

createTenant()
