/**
 * Script para verificar datos del menú en Supabase
 * Ejecutar con: npx tsx scripts/check-menu-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Cargar variables de entorno
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMenuData() {
  console.log('🔍 Verificando datos del menú en Supabase...\n')

  // 1. Verificar categorías
  const { data: categories, error: catError } = await supabase
    .from('menu_categories')
    .select('*')
    .order('sort_order')

  if (catError) {
    console.error('❌ Error al obtener categorías:', catError.message)
  } else {
    console.log(`✅ Categorías encontradas: ${categories?.length || 0}`)
    categories?.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.active ? 'activa' : 'inactiva'})`)
    })
  }

  console.log()

  // 2. Verificar items
  const { data: items, error: itemsError } = await supabase
    .from('menu_items')
    .select('*, category:menu_categories(name)')
    .order('name')

  if (itemsError) {
    console.error('❌ Error al obtener items:', itemsError.message)
  } else {
    console.log(`✅ Items del menú encontrados: ${items?.length || 0}`)
    items?.slice(0, 5).forEach((item: any) => {
      console.log(`   - ${item.name} ($${(item.price_cents / 100).toFixed(2)}) - ${item.category?.name || 'Sin categoría'}`)
    })
    if (items && items.length > 5) {
      console.log(`   ... y ${items.length - 5} items más`)
    }
  }

  console.log()

  // 3. Verificar tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('*')

  if (tenantsError) {
    console.error('❌ Error al obtener tenants:', tenantsError.message)
  } else {
    console.log(`✅ Tenants encontrados: ${tenants?.length || 0}`)
    tenants?.forEach(tenant => {
      console.log(`   - ${tenant.name} (${tenant.id})`)
    })
  }

  console.log('\n✨ Verificación completa')
}

checkMenuData().catch(console.error)
