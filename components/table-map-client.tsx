"use client"

import dynamic from 'next/dynamic'

// Dynamically import the editor v2 to avoid SSR issues with canvas
const TableMapEditor = dynamic(
  () => import('./table-map-editor-v2').then(mod => ({ default: mod.TableMapEditor })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center bg-muted rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando editor de mapa...</p>
        </div>
      </div>
    )
  }
)

interface TableMapClientProps {
  onTableClick?: (table: { id: string; number: string; status: string }) => void
  editable?: boolean
}

export function TableMapClient({ onTableClick, editable = false }: TableMapClientProps) {
  return <TableMapEditor onTableClick={onTableClick} editable={editable} />
}
