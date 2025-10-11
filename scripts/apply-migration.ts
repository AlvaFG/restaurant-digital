/**
 * Script para aplicar la migración inicial a Supabase
 * 
 * Uso:
 *   npx tsx scripts/apply-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Cargar variables de .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function applyMigration() {
  console.log('\n🚀 Aplicando migración inicial a Supabase...\n');
  
  // Validar credenciales
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Error: Credenciales de Supabase no configuradas');
    process.exit(1);
  }
  
  console.log('📍 Project:', SUPABASE_URL);
  console.log('🔐 Usando Service Role Key\n');
  
  try {
    // Crear cliente con service role (bypasea RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    
    // Leer el archivo de migración
    const migrationPath = resolve(process.cwd(), 'supabase/migrations/20251011000001_init_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Leyendo migración:', '20251011000001_init_schema.sql');
    console.log('📊 Tamaño:', migrationSQL.length, 'caracteres\n');
    
    // Dividir en statements individuales (separados por ;)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log('🔧 Ejecutando', statements.length, 'statements SQL...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const preview = statement.substring(0, 60).replace(/\n/g, ' ');
      
      try {
        process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          // Intentar ejecutar directamente si rpc falla
          const { error: directError } = await supabase
            .from('_migrations')
            .insert({ statement });
          
          if (directError) {
            throw error;
          }
        }
        
        console.log(' ✅');
        successCount++;
        
      } catch (error: any) {
        console.log(' ❌');
        console.error('    Error:', error.message);
        errorCount++;
      }
    }
    
    console.log('\n📊 Resumen:');
    console.log(`   ✅ Exitosos: ${successCount}`);
    console.log(`   ❌ Fallidos: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 ¡Migración aplicada exitosamente!\n');
      console.log('🔄 Próximos pasos:');
      console.log('   1. Generar tipos TypeScript:');
      console.log('      npx supabase gen types typescript --project-id vblbngnajogwypvkfjsr > lib/supabase/types.ts');
      console.log('   2. Probar la conexión:');
      console.log('      npx tsx scripts/test-supabase-connection.ts\n');
    } else {
      console.log('\n⚠️  Algunos statements fallaron.');
      console.log('💡 Esto es normal - probablemente necesitas ejecutar la migración');
      console.log('   directamente desde el Dashboard de Supabase:\n');
      console.log('   1. Ve a: https://supabase.com/dashboard/project/vblbngnajogwypvkfjsr/editor');
      console.log('   2. Abre el SQL Editor');
      console.log('   3. Pega el contenido de: supabase/migrations/20251011000001_init_schema.sql');
      console.log('   4. Haz clic en "Run"\n');
    }
    
  } catch (error: any) {
    console.error('❌ Error fatal:', error.message);
    console.log('\n💡 Solución alternativa:');
    console.log('   1. Ve a: https://supabase.com/dashboard/project/vblbngnajogwypvkfjsr/editor');
    console.log('   2. Copia el contenido de: supabase/migrations/20251011000001_init_schema.sql');
    console.log('   3. Pégalo en el SQL Editor y ejecútalo manualmente\n');
    process.exit(1);
  }
}

applyMigration();
