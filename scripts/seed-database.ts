/**
 * Script para poblar la base de datos con datos de prueba
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

async function seed() {
  console.log('\n🌱 Sembrando datos de prueba en Supabase...\n');
  
  try {
    // Obtener el tenant demo
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'demo')
      .single();
    
    if (tenantError) throw tenantError;
    
    console.log('✅ Tenant encontrado:', tenant.id);
    
    // Crear categorías de menú
    console.log('\n📁 Creando categorías de menú...');
    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .insert([
        { tenant_id: tenant.id, name: 'Entradas', sort_order: 1 },
        { tenant_id: tenant.id, name: 'Principales', sort_order: 2 },
        { tenant_id: tenant.id, name: 'Postres', sort_order: 3 },
        { tenant_id: tenant.id, name: 'Bebidas', sort_order: 4 },
      ])
      .select();
    
    if (catError) throw catError;
    console.log('✅', categories.length, 'categorías creadas');
    
    // Crear items del menú
    console.log('\n🍕 Creando items del menú...');
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .insert([
        {
          tenant_id: tenant.id,
          category_id: categories[0].id,
          name: 'Empanadas de Carne',
          description: 'Tradicionales empanadas argentinas',
          price_cents: 150000, // $1500 ARS
          available: true,
        },
        {
          tenant_id: tenant.id,
          category_id: categories[1].id,
          name: 'Bife de Chorizo',
          description: 'Corte premium de 300g con guarnición',
          price_cents: 850000, // $8500 ARS
          available: true,
        },
        {
          tenant_id: tenant.id,
          category_id: categories[2].id,
          name: 'Flan Casero',
          description: 'Flan con dulce de leche y crema',
          price_cents: 380000, // $3800 ARS
          available: true,
        },
        {
          tenant_id: tenant.id,
          category_id: categories[3].id,
          name: 'Coca Cola',
          description: 'Botella 500ml',
          price_cents: 120000, // $1200 ARS
          available: true,
        },
      ])
      .select();
    
    if (itemsError) throw itemsError;
    console.log('✅', items.length, 'items creados');
    
    // Crear mesas
    console.log('\n🪑 Creando mesas...');
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .insert([
        { tenant_id: tenant.id, number: 1, zone: 'Salón Principal', capacity: 4, status: 'libre' },
        { tenant_id: tenant.id, number: 2, zone: 'Salón Principal', capacity: 2, status: 'libre' },
        { tenant_id: tenant.id, number: 3, zone: 'Terraza', capacity: 6, status: 'libre' },
        { tenant_id: tenant.id, number: 4, zone: 'Terraza', capacity: 4, status: 'libre' },
        { tenant_id: tenant.id, number: 5, zone: 'Bar', capacity: 2, status: 'libre' },
      ])
      .select();
    
    if (tablesError) throw tablesError;
    console.log('✅', tables.length, 'mesas creadas');
    
    // Crear un pedido de ejemplo
    console.log('\n📋 Creando pedido de ejemplo...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        tenant_id: tenant.id,
        table_id: tables[0].id,
        order_number: 'ORD-001',
        status: 'abierto',
        payment_status: 'pendiente',
        source: 'staff',
        subtotal_cents: 100000,
        tax_total_cents: 21000,
        total_cents: 121000,
      })
      .select()
      .single();
    
    if (orderError) throw orderError;
    console.log('✅ Pedido creado:', order.order_number);
    
    // Crear items del pedido
    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert([
        {
          order_id: order.id,
          menu_item_id: items[0].id,
          name: items[0].name,
          quantity: 2,
          unit_price_cents: 150000,
          total_cents: 300000,
        },
        {
          order_id: order.id,
          menu_item_id: items[3].id,
          name: items[3].name,
          quantity: 2,
          unit_price_cents: 120000,
          total_cents: 240000,
        },
      ]);
    
    if (orderItemsError) throw orderItemsError;
    console.log('✅ Items del pedido agregados');
    
    console.log('\n🎉 ¡Datos de prueba sembrados exitosamente!\n');
    console.log('📊 Resumen:');
    console.log('   - Tenant: demo');
    console.log('   - Categorías:', categories.length);
    console.log('   - Items de menú:', items.length);
    console.log('   - Mesas:', tables.length);
    console.log('   - Pedidos:', 1);
    console.log('\n✨ Ya puedes probar la aplicación!\n');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seed();
