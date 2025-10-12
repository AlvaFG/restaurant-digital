/**
 * Script para verificar y crear tenant por defecto si no existe
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

async function ensureTenant() {
  console.log('🔍 Verificando tenants en Supabase...\n')

  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*')

  if (error) {
    console.error('❌ Error al consultar tenants:', error.message)
    return
  }

  if (!tenants || tenants.length === 0) {
    console.log('⚠️  No hay tenants. Creando tenant por defecto...\n')

    const { data: newTenant, error: createError } = await supabase
      .from('tenants')
      .insert({
        name: 'Restaurant Demo',
        slug: 'demo',
        settings: {
          theme: {
            accentColor: '#3b82f6'
          },
          features: {
            kds: true,
            tablets: true,
            payments: true
          }
        }
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error al crear tenant:', createError.message)
      return
    }

    console.log('✅ Tenant creado exitosamente:')
    console.log(`   ID: ${newTenant.id}`)
    console.log(`   Nombre: ${newTenant.name}`)
    console.log(`   Slug: ${newTenant.slug}`)
  } else {
    console.log(`✅ Encontrados ${tenants.length} tenant(s):\n`)
    
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name}`)
      console.log(`   ID: ${tenant.id}`)
      console.log(`   Slug: ${tenant.slug}`)
      console.log(`   Created: ${new Date(tenant.created_at).toLocaleString()}`)
      console.log('')
    })
  }
}

ensureTenant().catch(console.error)
