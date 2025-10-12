/**
 * Script para debuguear el query de usuarios con tenant
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugQuery() {
  console.log('🔍 Debug de query users + tenants\n')

  const email = 'admin@restaurant.com'

  // 1. Query simple sin join
  console.log('1️⃣ Query SIN join:')
  const { data: simpleUser, error: simpleError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (simpleError) {
    console.error('   ❌ Error:', simpleError.message)
  } else {
    console.log('   ✅ Usuario encontrado:')
    console.log('   ', JSON.stringify(simpleUser, null, 2))
  }

  // 2. Query con join usando sintaxis correcta
  console.log('\n2️⃣ Query CON join (sintaxis 1):')
  const { data: joinUser1, error: joinError1 } = await supabase
    .from('users')
    .select('*, tenants(*)')
    .eq('email', email)
    .single()

  if (joinError1) {
    console.error('   ❌ Error:', joinError1.message)
  } else {
    console.log('   ✅ Usuario encontrado:')
    console.log('   ', JSON.stringify(joinUser1, null, 2))
  }

  // 3. Query con join alternativo
  console.log('\n3️⃣ Query CON join (sintaxis 2 - explícito):')
  const { data: joinUser2, error: joinError2 } = await supabase
    .from('users')
    .select(`
      id,
      email,
      name,
      role,
      active,
      tenant_id,
      tenants:tenant_id (
        id,
        name,
        slug,
        settings
      )
    `)
    .eq('email', email)
    .single()

  if (joinError2) {
    console.error('   ❌ Error:', joinError2.message)
  } else {
    console.log('   ✅ Usuario encontrado:')
    console.log('   ', JSON.stringify(joinUser2, null, 2))
  }

  // 4. Consultar tenant directo
  console.log('\n4️⃣ Query tenant directo:')
  if (simpleUser) {
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', simpleUser.tenant_id)
      .single()

    if (tenantError) {
      console.error('   ❌ Error:', tenantError.message)
    } else {
      console.log('   ✅ Tenant encontrado:')
      console.log('   ', JSON.stringify(tenant, null, 2))
    }
  }
}

debugQuery().catch(console.error)
