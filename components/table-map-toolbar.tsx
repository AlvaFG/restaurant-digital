"use client"

import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MousePointer2,
  Move,
  RotateCw,
  Maximize2,
  Plus,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Undo2,
  Redo2,
  Save,
  Trash2,
  Copy,
  Magnet
} from "lucide-react"

export type ToolMode = 'select' | 'move' | 'rotate' | 'resize'
export type SnapStrength = 'off' | 'soft' | 'hard'
export type GridSize = 10 | 20 | 40

interface TableMapToolbarProps {
  toolMode: ToolMode
  onToolModeChange: (mode: ToolMode) => void
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  showGrid: boolean
  onShowGridChange: (show: boolean) => void
  gridSize: GridSize
  onGridSizeChange: (size: GridSize) => void
  snapStrength: SnapStrength
  onSnapStrengthChange: (strength: SnapStrength) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  hasChanges: boolean
  onSave: () => void
  isSaving: boolean
  hasSelection: boolean
  onDelete: () => void
  onDuplicate: () => void
  onAddTable: () => void
  editable: boolean
}

export function TableMapToolbar({
  toolMode,
  onToolModeChange,
  zoom,
  onZoomIn,
  onZoomOut,
  showGrid,
  onShowGridChange,
  gridSize,
  onGridSizeChange,
  snapStrength,
  onSnapStrengthChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  hasChanges,
  onSave,
  isSaving,
  hasSelection,
  onDelete,
  onDuplicate,
  onAddTable,
  editable
}: TableMapToolbarProps) {
  
  const tools = [
    { mode: 'select' as ToolMode, icon: MousePointer2, label: 'Seleccionar (V)', shortcut: 'V' },
    { mode: 'move' as ToolMode, icon: Move, label: 'Mover (M)', shortcut: 'M' },
    { mode: 'rotate' as ToolMode, icon: RotateCw, label: 'Rotar (R)', shortcut: 'R' },
    { mode: 'resize' as ToolMode, icon: Maximize2, label: 'Redimensionar (S)', shortcut: 'S' },
  ]

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1 p-2 bg-card border rounded-lg flex-wrap">
        {/* Tool modes */}
        {editable && (
          <>
            <div className="flex items-center gap-1">
              {tools.map((tool) => (
                <Tooltip key={tool.mode}>
                  <TooltipTrigger asChild>
                    <Toggle
                      pressed={toolMode === tool.mode}
                      onPressedChange={() => onToolModeChange(tool.mode)}
                      size="sm"
                      aria-label={tool.label}
                    >
                      <tool.icon className="h-4 w-4" />
                    </Toggle>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tool.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Add table */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onAddTable}>
                  <Plus className="h-4 w-4 mr-1" />
                  Mesa
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Agregar mesa (N)</p>
              </TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />
          </>
        )}

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onZoomOut} disabled={zoom <= 0.5}>
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Alejar (-)</p>
            </TooltipContent>
          </Tooltip>
          
          <span className="text-sm text-muted-foreground min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onZoomIn} disabled={zoom >= 2}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Acercar (+)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Grid controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={showGrid}
                onPressedChange={onShowGridChange}
                size="sm"
                aria-label="Mostrar grilla"
              >
                <Grid3X3 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mostrar grilla (G)</p>
            </TooltipContent>
          </Tooltip>

          {showGrid && (
            <Select 
              value={gridSize.toString()} 
              onValueChange={(v) => onGridSizeChange(Number(v) as GridSize)}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10px</SelectItem>
                <SelectItem value="20">20px</SelectItem>
                <SelectItem value="40">40px</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {editable && (
          <>
            {/* Snap controls */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <Magnet className="h-4 w-4 mr-1 text-muted-foreground" />
                    <Select 
                      value={snapStrength} 
                      onValueChange={(v) => onSnapStrengthChange(v as SnapStrength)}
                    >
                      <SelectTrigger className="w-[80px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Off</SelectItem>
                        <SelectItem value="soft">Suave</SelectItem>
                        <SelectItem value="hard">Fuerte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Intensidad de snap</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}>
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Deshacer (Ctrl+Z)</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo}>
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rehacer (Ctrl+Y)</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* Selection actions */}
            {hasSelection && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={onDuplicate}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Duplicar (Ctrl+D)</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={onDelete}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Eliminar (Del)</p>
                  </TooltipContent>
                </Tooltip>

                <Separator orientation="vertical" className="h-6 mx-1" />
              </>
            )}

            {/* Save */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  onClick={onSave} 
                  disabled={!hasChanges || isSaving}
                  className="gap-1"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Guardar layout (Ctrl+S)</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
