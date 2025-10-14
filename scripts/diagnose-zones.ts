/**
 * Script de diagnóstico para problema de zonas
 * 
 * Este script verifica:
 * 1. Autenticación y tenant_id del usuario
 * 2. Conexión a Supabase
 * 3. Políticas RLS en tabla zones
 * 4. Datos existentes en tabla zones
 */

import { createServerClient, createServiceRoleClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/server"

async function diagnoseZonesProblem() {
  console.log('\n🔍 ========== DIAGNÓSTICO DE ZONAS ==========\n')

  try {
    // Paso 1: Verificar usuario autenticado
    console.log('📋 Paso 1: Verificando usuario autenticado...')
    const user = await getCurrentUser()
    
    if (!user) {
      console.error('❌ No hay usuario autenticado')
      return
    }
    
    console.log('✅ Usuario autenticado:', {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    })

    // Extraer tenant_id del usuario
    const metadata = user.user_metadata as Record<string, unknown> | undefined
    const tenantId = metadata?.tenant_id as string | undefined

    console.log('\n📋 Paso 2: Verificando tenant_id...')
    if (!tenantId) {
      console.error('❌ Usuario no tiene tenant_id en user_metadata')
      console.log('user_metadata:', JSON.stringify(user.user_metadata, null, 2))
      
      // Intentar obtener desde la tabla users
      console.log('\n🔍 Buscando tenant_id en tabla users...')
      const adminClient = createServiceRoleClient()
      const { data: userData, error: userError } = await adminClient
        .from('users')
        .select('id, tenant_id, name, email, role')
        .eq('id', user.id)
        .single()
      
      if (userError) {
        console.error('❌ Error al buscar usuario en tabla:', userError)
      } else if (userData) {
        console.log('✅ Usuario encontrado en tabla:', userData)
        console.log('⚠️ PROBLEMA: tenant_id está en tabla pero NO en user_metadata')
        console.log('💡 SOLUCIÓN: El tenant_id debe agregarse a user_metadata durante el login')
      }
      return
    }
    
    console.log('✅ tenant_id encontrado:', tenantId)

    // Paso 3: Verificar datos en tabla zones con Service Role (sin RLS)
    console.log('\n📋 Paso 3: Verificando datos en tabla zones (sin RLS)...')
    const adminClient = createServiceRoleClient()
    
    const { data: allZones, error: allZonesError } = await adminClient
      .from('zones')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })
    
    if (allZonesError) {
      console.error('❌ Error al obtener zonas con admin:', allZonesError)
    } else {
      console.log(`✅ Zonas encontradas (sin RLS): ${allZones?.length || 0}`)
      if (allZones && allZones.length > 0) {
        console.log('Zonas:', JSON.stringify(allZones, null, 2))
      }
    }

    // Paso 4: Verificar datos en tabla zones con cliente normal (con RLS)
    console.log('\n📋 Paso 4: Verificando datos en tabla zones (con RLS)...')
    const supabase = createServerClient()
    
    const { data: userZones, error: userZonesError } = await supabase
      .from('zones')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })
    
    if (userZonesError) {
      console.error('❌ Error al obtener zonas con RLS:', userZonesError)
      console.log('💡 Esto indica que las políticas RLS están bloqueando el acceso')
    } else {
      console.log(`✅ Zonas encontradas (con RLS): ${userZones?.length || 0}`)
      if (userZones && userZones.length > 0) {
        console.log('Zonas:', JSON.stringify(userZones, null, 2))
      } else if (allZones && allZones.length > 0) {
        console.log('⚠️ PROBLEMA: Las zonas existen pero RLS las está bloqueando')
        console.log('💡 SOLUCIÓN: Revisar políticas RLS en tabla zones')
      }
    }

    // Paso 5: Verificar políticas RLS
    console.log('\n📋 Paso 5: Verificando políticas RLS...')
    console.log('💡 Verifica manualmente en Supabase Dashboard:')
    console.log('   Authentication > Policies > zones table')
    console.log('   Debe existir política SELECT que permita: tenant_id = auth.uid() O similar')

    // Paso 6: Verificar sesión actual
    console.log('\n📋 Paso 6: Verificando sesión de Supabase...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('❌ No hay sesión activa:', sessionError)
    } else {
      console.log('✅ Sesión activa')
      console.log('  - User ID:', session.user.id)
      console.log('  - Access Token expira:', new Date(session.expires_at! * 1000).toISOString())
    }

    // Resumen
    console.log('\n📊 ========== RESUMEN DEL DIAGNÓSTICO ==========\n')
    if (!tenantId) {
      console.log('❌ PROBLEMA PRINCIPAL: Usuario no tiene tenant_id')
    } else if (allZones && allZones.length > 0 && (!userZones || userZones.length === 0)) {
      console.log('❌ PROBLEMA PRINCIPAL: Políticas RLS bloqueando acceso a zonas')
    } else if (!allZones || allZones.length === 0) {
      console.log('⚠️ No hay zonas creadas para este tenant')
    } else {
      console.log('✅ Todo parece estar bien')
    }

  } catch (error) {
    console.error('\n❌ Error durante el diagnóstico:', error)
    if (error instanceof Error) {
      console.error('Mensaje:', error.message)
      console.error('Stack:', error.stack)
    }
  }

  console.log('\n🔍 ========== FIN DEL DIAGNÓSTICO ==========\n')
}

// Ejecutar diagnóstico
diagnoseZonesProblem()
  .then(() => {
    console.log('Diagnóstico completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error fatal:', error)
    process.exit(1)
  })
