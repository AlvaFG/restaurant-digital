'use client'

import { memo, useCallback, useReducer, useRef, useEffect } from 'react'
import { Layer, Group, Rect, Circle } from 'react-konva'
import Konva from 'konva'
import { logger } from '@/lib/logger'

// ============================================================================
// TYPES
// ============================================================================

export interface VisualZone {
  id: string
  name: string
  type: 'rectangle' | 'circle'
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  fill: string
  stroke: string
  opacity: number
}

interface TempShape {
  type: 'rectangle' | 'circle'
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  fill: string
  stroke: string
  opacity: number
}

interface DrawState {
  isDrawing: boolean
  startPoint: { x: number; y: number } | null
  tempShape: TempShape | null
  mode: 'none' | 'rectangle' | 'circle'
}

type DrawAction =
  | { type: 'SET_MODE'; mode: 'none' | 'rectangle' | 'circle' }
  | { type: 'START_DRAWING'; point: { x: number; y: number }; shape: TempShape }
  | { type: 'UPDATE_DRAWING'; point: { x: number; y: number } }
  | { type: 'END_DRAWING' }
  | { type: 'CANCEL_DRAWING' }

// ============================================================================
// CONSTANTS
// ============================================================================

const ZONE_COLORS = [
  { fill: '#3b82f6', stroke: '#1e40af' }, // Blue
  { fill: '#10b981', stroke: '#047857' }, // Green
  { fill: '#f59e0b', stroke: '#d97706' }, // Orange
  { fill: '#ef4444', stroke: '#b91c1c' }, // Red
  { fill: '#8b5cf6', stroke: '#6d28d9' }, // Purple
]

const MIN_ZONE_SIZE = 50 // Tamaño mínimo para considerar válida una zona

// ============================================================================
// REDUCER
// ============================================================================

const drawReducer = (state: DrawState, action: DrawAction): DrawState => {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.mode,
        isDrawing: false,
        startPoint: null,
        tempShape: null,
      }

    case 'START_DRAWING':
      return {
        ...state,
        isDrawing: true,
        startPoint: action.point,
        tempShape: action.shape,
      }

    case 'UPDATE_DRAWING': {
      if (!state.isDrawing || !state.startPoint || !state.tempShape) return state

      const deltaX = action.point.x - state.startPoint.x
      const deltaY = action.point.y - state.startPoint.y

      let updatedShape: TempShape

      if (state.tempShape.type === 'rectangle') {
        updatedShape = {
          ...state.tempShape,
          width: Math.abs(deltaX),
          height: Math.abs(deltaY),
          x: deltaX < 0 ? action.point.x : state.startPoint.x,
          y: deltaY < 0 ? action.point.y : state.startPoint.y,
        }
      } else {
        // circle
        const radius = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        updatedShape = {
          ...state.tempShape,
          radius,
        }
      }

      return {
        ...state,
        tempShape: updatedShape,
      }
    }

    case 'END_DRAWING':
      return {
        ...state,
        isDrawing: false,
        startPoint: null,
        tempShape: null,
        mode: 'none', // Resetear modo después de dibujar
      }

    case 'CANCEL_DRAWING':
      return {
        isDrawing: false,
        startPoint: null,
        tempShape: null,
        mode: 'none',
      }

    default:
      return state
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const generateZoneId = (): string => {
  return `zone-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

const getNextZoneColor = (existingZonesCount: number) => {
  return ZONE_COLORS[existingZonesCount % ZONE_COLORS.length]
}

// ============================================================================
// COMPONENT
// ============================================================================

interface ZoneDrawingLayerProps {
  isActive: boolean
  drawMode: 'none' | 'rectangle' | 'circle'
  existingZonesCount: number
  canvasWidth: number
  canvasHeight: number
  onZoneCreated: (zone: VisualZone) => void
  onDrawModeChange: (mode: 'none' | 'rectangle' | 'circle') => void
}

export const ZoneDrawingLayer = memo(function ZoneDrawingLayer({
  isActive,
  drawMode,
  existingZonesCount,
  canvasWidth,
  canvasHeight,
  onZoneCreated,
  onDrawModeChange,
}: ZoneDrawingLayerProps) {
  const layerRef = useRef<Konva.Layer>(null)
  const stageRef = useRef<Konva.Stage | null>(null)

  const [drawState, dispatchDraw] = useReducer(drawReducer, {
    isDrawing: false,
    startPoint: null,
    tempShape: null,
    mode: drawMode,
  })

  // Sincronizar modo de dibujo externo con el estado interno
  useEffect(() => {
    if (drawState.mode !== drawMode) {
      dispatchDraw({ type: 'SET_MODE', mode: drawMode })
    }
  }, [drawMode, drawState.mode])

  // Obtener referencia al Stage cuando el Layer se monta
  useEffect(() => {
    if (layerRef.current) {
      stageRef.current = layerRef.current.getStage()
      logger.info('ZoneDrawingLayer mounted with Stage reference', {
        hasStage: !!stageRef.current,
      })
    }

    return () => {
      stageRef.current = null
      logger.info('ZoneDrawingLayer unmounted')
    }
  }, [])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Validación temprana del evento
      if (!e || !e.target || !e.evt) {
        logger.warn('Invalid event received in handleMouseDown', { hasEvent: !!e, hasTarget: !!e?.target })
        return
      }

      logger.info('ZoneDrawingLayer mousedown event received', { 
        isActive, 
        drawMode, 
        isDrawing: drawState.isDrawing,
        targetType: e.target?.constructor?.name
      })

      if (!isActive || drawMode === 'none' || drawState.isDrawing) return

      // Intentar obtener el Stage y posición de múltiples formas
      let stage: Konva.Stage | null = null
      let pos: { x: number; y: number } | null = null

      // Método 1: Usar el stageRef directamente (más confiable)
      stage = stageRef.current
      if (stage) {
        try {
          pos = stage.getPointerPosition()
        } catch (error) {
          logger.warn('Failed to get pointer position from stageRef', { error })
        }
      }

      // Método 2: Calcular posición desde el evento nativo del navegador
      if (!pos && stage) {
        try {
          const rect = stage.container().getBoundingClientRect()
          pos = {
            x: e.evt.clientX - rect.left,
            y: e.evt.clientY - rect.top
          }
        } catch (error) {
          logger.warn('Failed to calculate position from native event', { error })
        }
      }

      // Método 3: Último recurso - intentar desde e.target (puede fallar)
      if (!stage || !pos) {
        try {
          if (e.target && typeof e.target.getStage === 'function') {
            stage = e.target.getStage()
            if (stage) {
              pos = stage.getPointerPosition()
            }
          }
        } catch (error) {
          logger.warn('Failed to get stage from event target', { error })
        }
      }

      if (!stage || !pos) {
        logger.error('Could not get stage or pointer position after all attempts', 
          new Error('Stage or position unavailable'), 
          { 
            hasStage: !!stage, 
            hasPos: !!pos,
            hasStageRef: !!stageRef.current
          }
        )
        return
      }

      const color = getNextZoneColor(existingZonesCount)

      if (drawMode === 'rectangle') {
        dispatchDraw({
          type: 'START_DRAWING',
          point: pos,
          shape: {
            type: 'rectangle',
            x: pos.x,
            y: pos.y,
            width: 0,
            height: 0,
            fill: color.fill,
            stroke: color.stroke,
            opacity: 0.3,
          },
        })
        logger.info('Started drawing rectangle', { startPos: pos })
      } else if (drawMode === 'circle') {
        dispatchDraw({
          type: 'START_DRAWING',
          point: pos,
          shape: {
            type: 'circle',
            x: pos.x,
            y: pos.y,
            radius: 0,
            fill: color.fill,
            stroke: color.stroke,
            opacity: 0.3,
          },
        })
        logger.info('Started drawing circle', { startPos: pos })
      }
    },
    [isActive, drawMode, drawState.isDrawing, existingZonesCount]
  )

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!drawState.isDrawing || !drawState.startPoint || !drawState.tempShape) return

      let pos: { x: number; y: number } | null = null

      // Método 1: Desde el ref del Stage (más confiable durante el arrastre)
      const stage = stageRef.current
      if (stage) {
        pos = stage.getPointerPosition()
      }

      // Método 2: Calcular desde evento nativo (fallback)
      if (!pos && stage) {
        const rect = stage.container().getBoundingClientRect()
        pos = {
          x: e.evt.clientX - rect.left,
          y: e.evt.clientY - rect.top
        }
      }

      if (!pos) return

      dispatchDraw({
        type: 'UPDATE_DRAWING',
        point: pos,
      })
    },
    [drawState.isDrawing, drawState.startPoint, drawState.tempShape]
  )

  const handleMouseUp = useCallback(() => {
    if (!drawState.isDrawing || !drawState.tempShape) return

    const shape = drawState.tempShape

    // Validar que la zona tenga un tamaño mínimo
    let isValid = false
    if (shape.type === 'rectangle') {
      isValid = (shape.width ?? 0) >= MIN_ZONE_SIZE && (shape.height ?? 0) >= MIN_ZONE_SIZE
    } else if (shape.type === 'circle') {
      isValid = (shape.radius ?? 0) >= MIN_ZONE_SIZE
    }

    if (!isValid) {
      logger.warn('Zone too small, canceling', {
        shape: shape.type,
        dimensions: shape.type === 'rectangle' 
          ? { width: shape.width, height: shape.height }
          : { radius: shape.radius }
      })
      dispatchDraw({ type: 'CANCEL_DRAWING' })
      return
    }

    // Crear la nueva zona
    const newZone: VisualZone = {
      id: generateZoneId(),
      name: `Zona ${existingZonesCount + 1}`,
      type: shape.type,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      radius: shape.radius,
      fill: shape.fill,
      stroke: shape.stroke,
      opacity: shape.opacity,
    }

    logger.info('Zone created successfully', { zone: newZone })

    // Notificar al padre
    onZoneCreated(newZone)

    // Finalizar dibujo
    dispatchDraw({ type: 'END_DRAWING' })

    // Resetear modo de dibujo
    onDrawModeChange('none')
  }, [drawState.isDrawing, drawState.tempShape, existingZonesCount, onZoneCreated, onDrawModeChange])

  // Cancelar dibujo con Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawState.isDrawing) {
        logger.info('Drawing canceled by user (Escape key)')
        dispatchDraw({ type: 'CANCEL_DRAWING' })
        onDrawModeChange('none')
      }
    }

    if (isActive) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isActive, drawState.isDrawing, onDrawModeChange])

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Layer
      ref={layerRef}
      listening={isActive}
    >
      {/* Rectángulo invisible que cubre todo el canvas - solo cuando está activo para no bloquear otros eventos */}
      {isActive && drawMode !== 'none' && (
        <Rect
          key={`capture-rect-${drawMode}`}
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          fill="transparent"
          listening={true}
          perfectDrawEnabled={false}
          shadowForStrokeEnabled={false}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      )}

      {/* Renderizar forma temporal mientras dibuja */}
      {drawState.tempShape && (
        <Group>
          {drawState.tempShape.type === 'rectangle' &&
            drawState.tempShape.width &&
            drawState.tempShape.height && (
              <Rect
                x={drawState.tempShape.x}
                y={drawState.tempShape.y}
                width={drawState.tempShape.width}
                height={drawState.tempShape.height}
                fill={drawState.tempShape.fill}
                stroke={drawState.tempShape.stroke}
                strokeWidth={2}
                opacity={drawState.tempShape.opacity}
                dash={[10, 5]}
                cornerRadius={8}
                listening={false}
              />
            )}
          {drawState.tempShape.type === 'circle' && drawState.tempShape.radius && (
            <Circle
              x={drawState.tempShape.x}
              y={drawState.tempShape.y}
              radius={drawState.tempShape.radius}
              fill={drawState.tempShape.fill}
              stroke={drawState.tempShape.stroke}
              strokeWidth={2}
              opacity={drawState.tempShape.opacity}
              dash={[10, 5]}
              listening={false}
            />
          )}
        </Group>
      )}
    </Layer>
  )
})
