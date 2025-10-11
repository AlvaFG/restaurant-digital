/**
 * Script para generar tipos TypeScript desde Supabase
 * 
 * Usa la API de Supabase directamente para obtener el esquema
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const PROJECT_REF = 'vblbngnajogwypvkfjsr';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function generateTypes() {
  console.log('\n🔧 Generando tipos TypeScript desde Supabase...\n');
  
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/types/typescript`,
      {
        headers: {
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const types = await response.text();
    const outputPath = resolve(process.cwd(), 'lib/supabase/types.ts');
    
    writeFileSync(outputPath, types);
    
    console.log('✅ Tipos generados exitosamente!');
    console.log('📁 Archivo:', outputPath);
    console.log('📊 Tamaño:', types.length, 'caracteres\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Solución alternativa:');
    console.log('   1. Ve a: https://supabase.com/dashboard/project/vblbngnajogwypvkfjsr/api');
    console.log('   2. Copia los tipos TypeScript desde la sección "Types"');
    console.log('   3. Pégalos en lib/supabase/types.ts\n');
    process.exit(1);
  }
}

generateTypes();
