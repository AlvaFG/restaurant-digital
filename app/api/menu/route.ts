import { NextResponse } from "next/server"

import { getFullMenu } from "@/lib/services/menu-service"
import { getCurrentUser } from '@/lib/supabase/server'
import type { User } from "@supabase/supabase-js"

import { buildMenuHeaders, handleMenuError, menuJsonResponse } from "./utils"
import { logRequest, logResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

/**
 * Extract tenantId from Supabase Auth User
 */
function getTenantIdFromUser(user: User): string | null {
  return user.user_metadata?.tenant_id || null
}

export async function GET() {
  const startTime = Date.now()
  
  try {
    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Obtener tenant_id del usuario
    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Usuario sin tenant asignado' },
        { status: 403 }
      )
    }

    logRequest('GET', '/api/menu', { tenantId })
    
    const { data: categories, error } = await getFullMenu(tenantId)
    
    if (error || !categories) {
      logger.error('Error al obtener menú desde Supabase', new Error(`Get menu failed: ${error}`), {
        tenantId
      })
      throw new Error('Error al obtener menú')
    }

    const duration = Date.now() - startTime
    logResponse('GET', '/api/menu', 200, duration)
    
    // Extraer items de todas las categorías
    const allItems = categories.flatMap(cat => cat.items || [])
    
    logger.info('Catálogo de menú obtenido desde Supabase', { 
      categoriesCount: categories.length,
      itemsCount: allItems.length,
      tenantId,
      duration: `${duration}ms`
    })
    
    return NextResponse.json({
      categories: categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        active: cat.active,
        sortOrder: cat.sort_order,
      })),
      items: allItems.map(item => ({
        id: item.id,
        categoryId: item.category_id,
        name: item.name,
        description: item.description,
        priceCents: item.price_cents,
        available: item.available,
        imageUrl: item.image_url,
      })),
      metadata: {
        categoriesCount: categories.length,
        itemsCount: allItems.length,
        tenantId,
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('GET', '/api/menu', 500, duration)
    
    logger.error('Error al obtener catálogo de menú', error as Error)
    
    return handleMenuError("get", error, "No se pudo obtener el catálogo de menú")
  }
}

export async function HEAD() {
  try {
    // Obtener usuario actual
    const user = await getCurrentUser()
    if (!user) {
      return new NextResponse(null, { status: 401 })
    }

    // Obtener tenant_id del usuario
    const tenantId = getTenantIdFromUser(user)
    if (!tenantId) {
      return new NextResponse(null, { status: 403 })
    }

    logger.debug('Obteniendo metadata de menú', { tenantId })
    
    const { data: categories, error } = await getFullMenu(tenantId)
    
    if (error || !categories) {
      return new NextResponse(null, { status: 500 })
    }

    const allItems = categories.flatMap(cat => cat.items || [])

    return new NextResponse(null, {
      headers: {
        "x-menu-version": "1",
        "x-menu-updated-at": new Date().toISOString(),
        "x-categories-count": String(categories.length),
        "x-items-count": String(allItems.length),
      },
    })
  } catch (error) {
    logger.error('Error en HEAD /api/menu', error as Error)
    return new NextResponse(null, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ["GET", "HEAD"] })
}
