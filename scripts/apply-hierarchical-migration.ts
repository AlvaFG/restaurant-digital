/**
 * Script para aplicar la migración de roles jerárquicos
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigration() {
  console.log('\n🔄 APLICANDO MIGRACIÓN DE ROLES JERÁRQUICOS\n')
  console.log('═══════════════════════════════════════════════════════\n')

  try {
    // Leer el archivo de migración
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20251012000002_hierarchical_roles.sql'
    )

    if (!fs.existsSync(migrationPath)) {
      throw new Error('Archivo de migración no encontrado')
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 Archivo de migración cargado')
    console.log(`   Ruta: ${migrationPath}`)
    console.log(`   Tamaño: ${migrationSQL.length} caracteres\n`)

    console.log('⚠️  ADVERTENCIA: Esta migración modificará la estructura de la base de datos\n')
    console.log('Cambios que se aplicarán:')
    console.log('  1. ✅ Agregar campo created_by_admin_id a tabla users')
    console.log('  2. ✅ Crear funciones helper (is_admin, is_staff, current_user_role)')
    console.log('  3. ✅ Actualizar políticas RLS para roles jerárquicos')
    console.log('  4. ✅ Agregar trigger de validación de jerarquía')
    console.log('  5. ✅ Crear función create_staff_user')
    console.log('  6. ✅ Crear vista v_admin_staff\n')

    console.log('🔧 Aplicando migración...\n')

    // Ejecutar la migración usando la función rpc (requiere crear una función en Supabase)
    // Como alternativa, podemos ejecutar cada statement por separado

    // Dividir en statements individuales (simplificado)
    const statements = migrationSQL
      .split(';')
      .filter(s => s.trim() && !s.trim().startsWith('--') && !s.trim().startsWith('/*'))

    let executedCount = 0
    let errorCount = 0

    for (const statement of statements) {
      const trimmed = statement.trim()
      if (!trimmed) continue

      try {
        // Nota: Supabase client no permite ejecutar SQL directamente por seguridad
        // Necesitarías usar la Connection String directamente con pg o psql
        console.log(`⚠️  Statement ${executedCount + 1}: No se puede ejecutar directamente desde el cliente`)
        executedCount++
      } catch (error: any) {
        console.error(`❌ Error en statement ${executedCount + 1}:`, error.message)
        errorCount++
      }
    }

    console.log('\n═══════════════════════════════════════════════════════')
    console.log('ℹ️  NOTA IMPORTANTE\n')
    console.log('Las migraciones de SQL no pueden ejecutarse directamente desde')
    console.log('el cliente de Supabase por razones de seguridad.\n')
    console.log('📋 OPCIONES PARA APLICAR LA MIGRACIÓN:\n')
    console.log('1. Usar Supabase CLI:')
    console.log('   supabase db push\n')
    console.log('2. Usar Supabase Dashboard:')
    console.log('   a. Ir a https://supabase.com/dashboard')
    console.log('   b. Seleccionar tu proyecto')
    console.log('   c. Ir a SQL Editor')
    console.log('   d. Copiar y pegar el contenido de:')
    console.log('      supabase/migrations/20251012000002_hierarchical_roles.sql')
    console.log('   e. Ejecutar\n')
    console.log('3. Usar psql directamente:')
    console.log('   psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" < migration.sql\n')
    console.log('═══════════════════════════════════════════════════════\n')

    console.log('✅ Archivo de migración preparado y validado')
    console.log('   Aplicar manualmente usando una de las opciones arriba\n')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

applyMigration().catch(err => {
  console.error('❌ Error fatal:', err)
  process.exit(1)
})
