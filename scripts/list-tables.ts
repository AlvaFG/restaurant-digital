/**
 * Script para listar mesas y generar links QR
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listTables() {
  console.log('🍽️  Listando mesas disponibles...\n')

  const { data: tables, error } = await supabase
    .from('tables')
    .select('*')
    .order('zone', { ascending: true })
    .order('number', { ascending: true })

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!tables || tables.length === 0) {
    console.log('⚠️  No hay mesas en la base de datos')
    return
  }

  console.log(`✅ Encontradas ${tables.length} mesas:\n`)

  tables.forEach((table, index) => {
    console.log(`${index + 1}. Mesa ${table.number} - ${table.zone}`)
    console.log(`   Estado: ${table.status}`)
    console.log(`   Capacidad: ${table.capacity} personas`)
    
    if (table.qr_token) {
      const qrUrl = `http://localhost:3000/qr/validate?token=${table.qr_token}`
      console.log(`   🔗 QR URL: ${qrUrl}`)
      console.log(`   📱 Token: ${table.qr_token}`)
      console.log(`   ⏰ Expira: ${table.qr_expires_at ? new Date(table.qr_expires_at).toLocaleString() : 'No expira'}`)
    } else {
      console.log(`   ⚠️  Sin QR generado`)
    }
    console.log('')
  })

  // Generar links listos para copiar
  console.log('📋 LINKS PARA COPIAR Y PEGAR EN EL NAVEGADOR:\n')
  
  tables.forEach(table => {
    if (table.qr_token) {
      console.log(`Mesa ${table.number} (${table.zone}):`)
      console.log(`http://localhost:3000/qr/validate?token=${table.qr_token}\n`)
    }
  })
}

listTables().catch(console.error)
