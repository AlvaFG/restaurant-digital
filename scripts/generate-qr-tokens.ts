import { config } from 'dotenv';
import { resolve } from 'path';
import { createAdminClient } from '../lib/supabase/admin.js';
import { randomUUID } from 'crypto';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

/**
 * Generate QR tokens for tables that don't have one
 */
async function generateQRTokens() {
  console.log('🔄 Generando tokens QR para mesas...\n');

  const supabase = createAdminClient();

  // Get tables without QR tokens
  const { data: tables, error: fetchError } = await supabase
    .from('tables')
    .select('*')
    .is('qr_token', null);

  if (fetchError) {
    console.error('❌ Error al obtener mesas:', fetchError.message);
    process.exit(1);
  }

  if (!tables || tables.length === 0) {
    console.log('✅ Todas las mesas ya tienen token QR');
    process.exit(0);
  }

  console.log(`📋 Encontradas ${tables.length} mesas sin token QR\n`);

  // Generate tokens for each table
  for (const table of tables) {
    const token = randomUUID();
    
    const { error: updateError } = await supabase
      .from('tables')
      .update({ qr_token: token })
      .eq('id', (table as any).id);

    if (updateError) {
      console.error(`❌ Error al actualizar mesa ${(table as any).number}:`, updateError.message);
    } else {
      console.log(`✅ Mesa ${(table as any).number} (${(table as any).zone}) - Token generado: ${token}`);
    }
  }

  console.log('\n🎉 Tokens QR generados exitosamente!');
  console.log('\n📋 Ahora ejecuta: node --import tsx scripts/list-tables.ts');
}

generateQRTokens();
