import { NextResponse } from "next/server"

import { getMenuCatalog } from "@/lib/server/menu-store"

import { buildMenuHeaders, handleMenuError, menuJsonResponse } from "./utils"
import { logRequest, logResponse } from '@/lib/api-helpers'
import { logger } from '@/lib/logger'

export async function GET() {
  const startTime = Date.now()
  
  try {
    logRequest('GET', '/api/menu')
    
    const catalog = await getMenuCatalog()
    
    const duration = Date.now() - startTime
    logResponse('GET', '/api/menu', 200, duration)
    
    logger.info('Catálogo de menú obtenido', { 
      categoriesCount: catalog.categories.length,
      itemsCount: catalog.items.length,
      allergensCount: catalog.allergens.length,
      duration: `${duration}ms`
    })
    
    return menuJsonResponse(
      {
        categories: catalog.categories,
        items: catalog.items,
        allergens: catalog.allergens,
        metadata: catalog.metadata,
      },
      catalog.metadata,
    )
  } catch (error) {
    const duration = Date.now() - startTime
    logResponse('GET', '/api/menu', 500, duration)
    
    logger.error('Error al obtener catálogo de menú', error as Error)
    
    return handleMenuError("get", error, "No se pudo obtener el catálogo de menú")
  }
}

export async function HEAD() {
  try {
    logger.debug('Obteniendo metadata de menú')
    
    const catalog = await getMenuCatalog()
    return new NextResponse(null, {
      headers: buildMenuHeaders(catalog.metadata),
    })
  } catch (error) {
    logger.error('Error en HEAD /api/menu', error as Error)
    return new NextResponse(null, { status: 500 })
  }
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ["GET", "HEAD"] })
}
