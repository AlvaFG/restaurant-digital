#!/usr/bin/env node

/**
 * Script para configurar Supabase en .env.local
 * 
 * Uso:
 *   1. Copia tus credenciales de Supabase Dashboard
 *   2. Pégalas cuando el script te lo pida
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envPath = path.join(process.cwd(), '.env.local');

console.log('\n🔧 Configuración de Supabase\n');
console.log('Ve a tu Supabase Dashboard:');
console.log('  Settings → API\n');

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  try {
    // Leer .env.local actual
    let envContent = fs.readFileSync(envPath, 'utf-8');

    // Pedir Project URL
    console.log('📍 Project URL');
    console.log('   Ejemplo: https://abcdefghijklmnop.supabase.co');
    const projectUrl = await question('   → Pega tu URL: ');
    
    if (!projectUrl || !projectUrl.includes('supabase.co')) {
      throw new Error('URL inválida. Debe ser de formato: https://xxx.supabase.co');
    }

    // Pedir anon key
    console.log('\n🔑 Anon (public) Key');
    console.log('   Comienza con: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    const anonKey = await question('   → Pega tu key: ');
    
    if (!anonKey || !anonKey.startsWith('eyJ')) {
      throw new Error('Anon key inválida');
    }

    // Pedir service role key
    console.log('\n🔐 Service Role Key (⚠️ CONFIDENCIAL)');
    console.log('   Comienza con: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    const serviceKey = await question('   → Pega tu key: ');
    
    if (!serviceKey || !serviceKey.startsWith('eyJ')) {
      throw new Error('Service role key inválida');
    }

    // Extraer project ref de la URL
    const projectRef = projectUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

    // Actualizar .env.local
    envContent = envContent
      .replace('NEXT_PUBLIC_SUPABASE_URL=YOUR_PROJECT_URL_HERE', `NEXT_PUBLIC_SUPABASE_URL=${projectUrl}`)
      .replace('NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE', `NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`)
      .replace('SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE', `SUPABASE_SERVICE_ROLE_KEY=${serviceKey}`)
      .replace('DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres', 
               `DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@db.${projectRef}.supabase.co:5432/postgres`);

    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ ¡Configuración completa!\n');
    console.log('📝 .env.local actualizado con:');
    console.log(`   - Project URL: ${projectUrl}`);
    console.log(`   - Anon Key: ${anonKey.substring(0, 20)}...`);
    console.log(`   - Service Key: ${serviceKey.substring(0, 20)}...`);
    console.log(`   - Database URL configurada para project: ${projectRef}\n`);
    
    console.log('🚀 Próximos pasos:');
    console.log('   1. npm run dev  (reinicia el servidor)');
    console.log('   2. npx supabase login');
    console.log('   3. npx supabase link --project-ref ' + projectRef);
    console.log('   4. npx supabase db push\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Edita manualmente .env.local si prefieres\n');
  } finally {
    rl.close();
  }
}

setup();
