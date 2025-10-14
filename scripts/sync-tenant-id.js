// ================================================
// SCRIPT DE SINCRONIZACIÓN RÁPIDA
// ================================================
// 
// Este script sincroniza el tenant_id desde la tabla users
// hacia el user_metadata en Supabase Auth
//
// INSTRUCCIONES:
// 1. Abre DevTools (F12)
// 2. Ve a la pestaña Console
// 3. Copia y pega este código completo
// 4. Presiona Enter
// 5. Espera el mensaje de éxito
// 6. Recarga la página (Ctrl+R)
// 7. Ve a /mesas
//
// ================================================

(async function syncTenantId() {
  console.log('🔄 Iniciando sincronización de tenant_id...');
  
  try {
    // Paso 1: Sincronizar metadata
    console.log('📡 Llamando a /api/auth/sync-metadata...');
    const response = await fetch('/api/auth/sync-metadata', {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Error al sincronizar:', error);
      return;
    }

    const result = await response.json();
    console.log('✅ Sincronización exitosa:', result);
    console.log('📊 tenant_id sincronizado:', result.data.tenantId);

    // Paso 2: Verificar que se actualizó
    console.log('\n🔍 Verificando actualización...');
    const authResponse = await fetch('/api/auth/me', {
      credentials: 'include',
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Usuario actualizado:', authData.data.user);
      console.log('✅ Tenant actualizado:', authData.data.tenant);
    }

    // Paso 3: Verificar que las zonas ahora se pueden cargar
    console.log('\n🔍 Verificando acceso a zonas...');
    const zonesResponse = await fetch('/api/zones', {
      credentials: 'include',
    });

    if (zonesResponse.ok) {
      const zonesData = await zonesResponse.json();
      console.log('✅ Zonas cargadas exitosamente:', zonesData.data);
      console.log(`📊 Total de zonas: ${zonesData.data.length}`);
      
      if (zonesData.data.length > 0) {
        console.log('\n🎉 ¡ÉXITO! Las zonas ahora son accesibles.');
        console.log('🔄 Recarga la página (Ctrl+R) y ve a /mesas');
      } else {
        console.log('\n⚠️ No hay zonas creadas. Crea una en /mesas');
      }
    } else {
      const zonesError = await zonesResponse.json();
      console.error('❌ Error al cargar zonas:', zonesError);
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
})();
