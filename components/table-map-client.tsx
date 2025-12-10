"use client"

// This is a client-only wrapper to ensure TableMap is never imported on server
import dynamic from 'next/dynamic'

export const TableMapClient = dynamic(
  () => import('./table-map').then(mod => ({ default: mod.TableMap })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center border rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Cargando mapa del salón...</p>
        </div>
      </div>
    ),
  }
)
