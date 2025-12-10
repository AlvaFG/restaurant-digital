/**
 * Endpoint de diagnóstico para problemas con zonas
 * GET /api/debug/zones
 */

import { NextResponse } from 'next/server'
import { getCurrentUser, createServerClient, createServiceRoleClient } from '@/lib/supabase/server'

export async function GET() {
  const diagnosticResults: any = {
    timestamp: new Date().toISOString(),
    steps: [],
  }

  // Función auxiliar para agregar pasos
  const addStep = (name: string, status: string = 'running') => {
    const stepNumber = diagnosticResults.steps.length + 1
    const step: any = {
      step: stepNumber,
      name,
      status,
    }
    diagnosticResults.steps.push(step)
    return step
  }

  // Función auxiliar para actualizar el último paso
  const updateLastStep = (updates: any) => {
    const lastStep = diagnosticResults.steps[diagnosticResults.steps.length - 1]
    Object.assign(lastStep, updates)
  }

  try {
    // Paso 1: Verificar usuario autenticado
    addStep('Verificar usuario autenticado')
    
    const user = await getCurrentUser()
    
    if (!user) {
      updateLastStep({
        status: 'error',
        error: 'No hay usuario autenticado',
      })
      diagnosticResults.conclusion = 'ERROR: Usuario no autenticado'
      return NextResponse.json(diagnosticResults, { status: 401 })
    }
    
    updateLastStep({
      status: 'success',
      data: {
        userId: user.id,
        email: user.email,
        userMetadata: user.user_metadata,
      }
    })

    // Paso 2: Extraer tenant_id
    addStep('Extraer tenant_id del usuario')

    const metadata = user.user_metadata as Record<string, unknown> | undefined
    let tenantId = metadata?.tenant_id as string | undefined

    // También intentar desde el root del objeto user
    if (!tenantId) {
      tenantId = (user as any).tenant_id
    }

    if (!tenantId) {
      updateLastStep({
        status: 'error',
        error: 'Usuario no tiene tenant_id en user_metadata',
      })
      
      // Intentar obtener desde la tabla users
      addStep('Buscar tenant_id en tabla users')

      const adminClient = createServiceRoleClient()
      const { data: userData, error: userError } = await adminClient
        .from('users')
        .select('id, tenant_id, name, email, role, active')
        .eq('id', user.id)
        .single()
      
      if (userError) {
        updateLastStep({
          status: 'error',
          error: userError.message,
        })
      } else if (userData) {
        updateLastStep({
          status: 'success',
          data: userData,
        })
        tenantId = userData.tenant_id
        
        if (tenantId) {
          // Actualizar el paso 2 para mostrar la advertencia
          diagnosticResults.steps[1].status = 'warning'
          diagnosticResults.steps[1].warning = 'tenant_id encontrado en tabla pero NO en user_metadata'
        }
      }
      
      if (!tenantId) {
        diagnosticResults.conclusion = 'ERROR CRÍTICO: No se encontró tenant_id en ningún lugar'
        return NextResponse.json(diagnosticResults, { status: 403 })
      }
    } else {
      updateLastStep({
        status: 'success',
        data: { tenantId }
      })
    }

    // Paso siguiente: Verificar zonas con Service Role (sin RLS)
    addStep('Obtener zonas con Service Role (sin RLS)')

    const adminClient = createServiceRoleClient()
    const { data: allZones, error: allZonesError } = await adminClient
      .from('zones')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })
    
    if (allZonesError) {
      updateLastStep({
        status: 'error',
        error: allZonesError.message,
      })
    } else {
      updateLastStep({
        status: 'success',
        data: {
          count: allZones?.length || 0,
          zones: allZones,
        }
      })
    }

    // Paso siguiente: Verificar zonas con cliente normal (con RLS)
    addStep('Obtener zonas con cliente normal (con RLS)')

    const supabase = await createServerClient()
    const { data: userZones, error: userZonesError } = await supabase
      .from('zones')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })
    
    if (userZonesError) {
      updateLastStep({
        status: 'error',
        error: userZonesError.message,
        suggestion: 'Las políticas RLS están bloqueando el acceso',
      })
    } else {
      updateLastStep({
        status: 'success',
        data: {
          count: userZones?.length || 0,
          zones: userZones,
        }
      })
      
      // Comparar resultados
      if (allZones && allZones.length > 0 && (!userZones || userZones.length === 0)) {
        diagnosticResults.steps[diagnosticResults.steps.length - 1].warning = 'Las zonas existen pero RLS las está bloqueando'
        diagnosticResults.steps[diagnosticResults.steps.length - 1].suggestion = 'Revisar políticas RLS en tabla zones'
      }
    }

    // Paso siguiente: Verificar sesión
    addStep('Verificar sesión de Supabase')

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      updateLastStep({
        status: 'error',
        error: sessionError?.message || 'No hay sesión activa',
      })
    } else {
      updateLastStep({
        status: 'success',
        data: {
          userId: session.user.id,
          expiresAt: new Date(session.expires_at! * 1000).toISOString(),
        }
      })
    }

    // Conclusión
    const hasZonesWithoutRLS = allZones && allZones.length > 0
    const hasZonesWithRLS = userZones && userZones.length > 0
    
    if (!tenantId) {
      diagnosticResults.conclusion = '❌ PROBLEMA: Usuario no tiene tenant_id'
      diagnosticResults.solution = 'El tenant_id debe agregarse al user_metadata durante el login'
    } else if (hasZonesWithoutRLS && !hasZonesWithRLS) {
      diagnosticResults.conclusion = '❌ PROBLEMA: Políticas RLS bloqueando acceso a zonas'
      diagnosticResults.solution = 'Revisar y corregir políticas RLS en tabla zones. Deben permitir SELECT donde tenant_id coincida'
    } else if (!hasZonesWithoutRLS) {
      diagnosticResults.conclusion = '⚠️ No hay zonas creadas para este tenant'
      diagnosticResults.solution = 'Crear zonas usando el botón "Crear zona"'
    } else {
      diagnosticResults.conclusion = '✅ Todo parece estar funcionando correctamente'
      diagnosticResults.zonesCount = userZones?.length || 0
    }

    return NextResponse.json(diagnosticResults)

  } catch (error) {
    diagnosticResults.steps.push({
      step: 'error',
      name: 'Error durante el diagnóstico',
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    diagnosticResults.conclusion = '❌ Error fatal durante el diagnóstico'
    
    return NextResponse.json(diagnosticResults, { status: 500 })
  }
}
