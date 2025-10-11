/**
 * Script para probar la conexión a Supabase
 * 
 * Uso:
 *   npx tsx scripts/test-supabase-connection.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar variables de .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testConnection() {
  console.log('\n🔧 Probando conexión a Supabase...\n');
  
  // Validar que las variables existan
  if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_PROJECT_URL_HERE') {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL no está configurada en .env.local');
    process.exit(1);
  }
  
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === 'YOUR_ANON_KEY_HERE') {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada en .env.local');
    process.exit(1);
  }
  
  console.log('📍 Project URL:', SUPABASE_URL);
  console.log('🔑 Anon Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...\n');
  
  try {
    // Crear cliente
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Probar una query simple (esto fallará si no hay tablas, pero confirma la conexión)
    console.log('🔍 Intentando conectar...');
    const { data, error } = await supabase
      .from('tenants') // Esta tabla existe en nuestra migración
      .select('count')
      .limit(1);
    
    if (error) {
      // Si el error es "relation does not exist", la conexión funciona pero falta aplicar migraciones
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('⚠️  Conexión exitosa, pero las tablas no existen aún');
        console.log('   → Necesitas aplicar las migraciones con: npx supabase db push\n');
        console.log('✅ Estado: Conexión OK, migraciones pendientes\n');
        return;
      }
      
      throw error;
    }
    
    console.log('✅ ¡Conexión exitosa!');
    console.log('✅ Las migraciones ya están aplicadas');
    console.log('📊 Resultado:', data, '\n');
    
  } catch (error: any) {
    console.error('❌ Error al conectar:', error.message);
    console.error('\n💡 Posibles causas:');
    console.error('   1. URL o API key incorrectas');
    console.error('   2. Proyecto de Supabase pausado o eliminado');
    console.error('   3. Problemas de red\n');
    process.exit(1);
  }
}

testConnection();
