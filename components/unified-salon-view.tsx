"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { TableMap } from "@/components/table-map"
import { TableList, type TableListRef } from "@/components/table-list"
import { ZoneFilter } from "@/components/zone-filter"
import { ZonesManagement, type ZonesManagementRef } from "@/components/zones-management"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  LayoutGrid, 
  List, 
  Edit, 
  Plus, 
  Settings2,
  Save,
  Undo2,
  Eye,
  RefreshCw,
  AlertCircle
} from "lucide-react"
import { useTables } from "@/hooks/use-tables"
import { useZones } from "@/hooks/use-zones"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import type { Table } from "@/lib/mock-data"

interface UnifiedSalonViewProps {
  /**
   * Vista por defecto: 'map' o 'list'
   */
  defaultView?: 'map' | 'list'
  
  /**
   * Permite edición del layout (solo admin)
   */
  allowEditing?: boolean
  
  /**
   * Muestra controles de gestión de mesas
   */
  showManagement?: boolean
  
  /**
   * Callbacks opcionales
   */
  onTableClick?: (table: Table) => void
  onAddTable?: () => void
  onManageZones?: () => void
}

export function UnifiedSalonView({
  defaultView = 'map',
  allowEditing = false,
  showManagement = true,
  onTableClick,
  onAddTable,
  onManageZones,
}: UnifiedSalonViewProps) {
  const router = useRouter()
  const tCommon = useTranslations('common')
  const { user } = useAuth()
  const { tables = [], loading: tablesLoading, error: tablesError } = useTables()
  const { zones = [], loading: zonesLoading, error: zonesError } = useZones()
  
  const [currentView, setCurrentView] = useState<'map' | 'list' | 'zones'>(defaultView)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([])
  const zonesRef = useRef<ZonesManagementRef>(null)
  
  const canEdit = user?.role === "admin" && allowEditing
  const isLoading = tablesLoading || zonesLoading
  const hasError = tablesError || zonesError

  // Show error state if queries failed
  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error cargando datos</AlertTitle>
        <AlertDescription>
          No se pudieron cargar los datos del salón. Por favor, recarga la página.
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recargar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Estadísticas de mesas
  const tableStats = useMemo(() => {
    const stats = {
      total: tables.length,
      libre: 0,
      ocupada: 0,
      reservada: 0,
      limpieza: 0,
    }
    
    tables.forEach((table) => {
      if (table.status in stats) {
        stats[table.status as keyof typeof stats]++
      }
    })
    
    return stats
  }, [tables])

  // Contador de mesas por zona
  const tableCountByZone = useMemo(() => {
    const counts: Record<string, number> = {}
    tables.forEach((table) => {
      if (table.zone_id) {
        counts[table.zone_id] = (counts[table.zone_id] || 0) + 1
      }
    })
    return counts
  }, [tables])

  // Manejar click en mesa desde el mapa
  const handleTableClickFromMap = useCallback((table: Table) => {
    if (isEditMode) return
    
    if (onTableClick) {
      onTableClick(table)
    } else {
      router.push(`/mesas/${table.id}`)
    }
  }, [isEditMode, onTableClick, router])

  // Toggle de modo edición con keyboard support
  const handleToggleEditMode = useCallback(() => {
    setIsEditMode((prev) => !prev)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in inputs
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return
      }

      // M = Toggle map view
      if (e.key === 'm' || e.key === 'M') {
        setCurrentView('map')
      }
      
      // L = Toggle list view
      if (e.key === 'l' || e.key === 'L') {
        setCurrentView('list')
      }
      
      // E = Toggle edit mode (admin only)
      if ((e.key === 'e' || e.key === 'E') && canEdit && currentView === 'map') {
        e.preventDefault()
        handleToggleEditMode()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [canEdit, currentView, handleToggleEditMode])

  return (
    <div className="space-y-6">
      {/* Header con estadísticas - Responsive grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{tableStats.total}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">{tCommon('totalTables')}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-300">{tableStats.libre}</div>
            <p className="text-xs text-green-600 dark:text-green-400">{tCommon('free')}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-300">{tableStats.ocupada}</div>
            <p className="text-xs text-red-600 dark:text-red-400">{tCommon('occupied')}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-xl sm:text-2xl font-bold text-yellow-700 dark:text-yellow-300">{tableStats.reservada}</div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400">{tCommon('reserved')}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4 sm:pt-6">
            <div className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-300">{tableStats.limpieza}</div>
            <p className="text-xs text-purple-600 dark:text-purple-400">{tCommon('cleaning')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Controles principales */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Toggle de vista */}
        <Tabs 
          value={currentView} 
          onValueChange={(v) => setCurrentView(v as 'map' | 'list' | 'zones')} 
          className="w-auto"
          aria-label={tCommon('managementTools')}
        >
          <TabsList role="tablist">
            <TabsTrigger 
              value="map" 
              className="gap-2"
              aria-label={tCommon('viewMapShortcut')}
              title={tCommon('shortcutM')}
            >
              <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              {tCommon('visualMap')}
            </TabsTrigger>
            <TabsTrigger 
              value="list" 
              className="gap-2"
              aria-label={tCommon('viewListShortcut')}
              title={tCommon('shortcutL')}
            >
              <List className="h-4 w-4" aria-hidden="true" />
              {tCommon('list')}
            </TabsTrigger>
            <TabsTrigger 
              value="zones" 
              className="gap-2"
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              {tCommon('zones')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Acciones */}
        {showManagement && (
          <div className="flex flex-wrap gap-2" role="toolbar" aria-label={tCommon('managementTools')}>
            {canEdit && currentView === 'map' && (
              <Button
                variant={isEditMode ? "default" : "outline"}
                size="sm"
                onClick={handleToggleEditMode}
                className={cn(isEditMode && "bg-blue-600 hover:bg-blue-700")}
                aria-pressed={isEditMode}
                aria-label={isEditMode ? tCommon('exitEditMode') : tCommon('enterEditMode')}
                title={isEditMode ? tCommon('exitEditMode') : tCommon('enterEditMode')}
              >
                {isEditMode ? (
                  <>
                    <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                    {tCommon('viewMode')}
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
                    {tCommon('editLayout')}
                  </>
                )}
              </Button>
            )}
            
            {onAddTable && (
              <Button 
                size="sm" 
                onClick={onAddTable}
                aria-label={tCommon('addTableLabel')}
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                {tCommon('addTable')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Keyboard shortcuts help (screen reader only) */}
      <div className="sr-only" aria-live="polite">
        {canEdit ? tCommon('keyboardShortcutsHelp') : tCommon('keyboardShortcutsAvailable')}
      </div>

      {/* Filtro de zonas (visible solo en map y list) */}
      {!isLoading && zones.length > 0 && currentView !== 'zones' && (
        <ZoneFilter
          zones={zones}
          selectedZones={selectedZoneIds}
          onZonesChange={setSelectedZoneIds}
          tableCountByZone={tableCountByZone}
        />
      )}

      {/* Contenido según vista seleccionada */}
      <div className="min-h-[400px]">
        {currentView === 'map' ? (
          <div className="space-y-4">
            {isEditMode && (
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                    <Edit className="h-4 w-4" />
                    <span className="font-medium">{tCommon('editModeActivated')}</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      - {tCommon('editModeInstructions2')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <TableMap
              onTableClick={handleTableClickFromMap}
              editable={isEditMode}
            />
          </div>
        ) : currentView === 'list' ? (
          <TableList />
        ) : (
          <ZonesManagement ref={zonesRef} />
        )}
      </div>

      {/* Indicador de estado de edición */}
      {isEditMode && currentView === 'map' && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary" className="bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100">
                  {tCommon('editMode')}
                </Badge>
                <span className="text-amber-700 dark:text-amber-300">
                  {tCommon('changesWillBeSaved')}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleEditMode}
                className="border-amber-300 dark:border-amber-700"
              >
                <Eye className="mr-2 h-4 w-4" />
                {tCommon('exitEditModeShort')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
