# 🔧 FIX: Zone Drawing Layer - Eventos no capturados

## 🐛 Problema Detectado

**Síntoma:** El cursor cambia a crosshair cuando se activa el modo de dibujo de zona, pero no se dibuja nada al hacer click y arrastrar.

**Causa raíz:** El `ZoneDrawingLayer` estaba vacío inicialmente (solo mostraba contenido cuando `tempShape` existía). En Konva, un Layer vacío **no captura eventos de mouse** porque no tiene ningún shape "clickeable".

## ✅ Solución Implementada

### Cambio 1: Agregar rectángulo invisible al Layer

**Archivo:** `components/zone-drawing-layer.tsx`

```tsx
// ANTES (no funcionaba):
<Layer listening={isActive} onMouseDown={...} onMouseMove={...}>
  {/* Solo mostraba tempShape cuando existía - Layer vacío inicialmente */}
  {drawState.tempShape && <Rect ... />}
</Layer>

// DESPUÉS (funciona):
<Layer listening={isActive}>
  {/* Rectángulo invisible que cubre todo el canvas */}
  {isActive && (
    <Rect
      x={0}
      y={0}
      width={canvasWidth}
      height={canvasHeight}
      fill="transparent"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  )}
  
  {/* Forma temporal solo aparece durante dibujo */}
  {drawState.tempShape && <Rect ... />}
</Layer>
```

**Explicación:**
- El rectángulo transparente actúa como "área de captura" para eventos
- Cubre todo el canvas (width x height)
- Solo está presente cuando `isActive={true}`
- Los event handlers están en el rectángulo, no en el Layer

---

### Cambio 2: Pasar dimensiones del canvas

**Archivo:** `components/zone-drawing-layer.tsx` (Props)

```tsx
interface ZoneDrawingLayerProps {
  isActive: boolean
  drawMode: 'none' | 'rectangle' | 'circle'
  existingZonesCount: number
  canvasWidth: number          // ← NUEVO
  canvasHeight: number         // ← NUEVO
  onZoneCreated: (zone: VisualZone) => void
  onDrawModeChange: (mode: 'none' | 'rectangle' | 'circle') => void
}
```

**Archivo:** `components/table-map.tsx` (Uso)

```tsx
<ZoneDrawingLayer
  isActive={drawMode !== 'none'}
  drawMode={drawMode}
  existingZonesCount={visualZones.length}
  canvasWidth={canvasDimensions.width}    // ← NUEVO
  canvasHeight={canvasDimensions.height}  // ← NUEVO
  onZoneCreated={handleZoneCreated}
  onDrawModeChange={setDrawMode}
/>
```

---

### Cambio 3: Logging mejorado

Agregado log al inicio de `handleMouseDown` para debug:

```tsx
const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
  logger.info('ZoneDrawingLayer mousedown event received', { 
    isActive, 
    drawMode, 
    isDrawing: drawState.isDrawing 
  })
  // ... resto del código
}, [isActive, drawMode, drawState.isDrawing, ...])
```

**Utilidad:** Permite verificar en Console si los eventos llegan correctamente al Layer.

---

## 🧪 Testing

### Pasos para validar el fix:

1. **Abrir Console (F12)** en DevTools
2. **Navegar a `/salon`**
3. **Activar modo de dibujo:**
   - Click "Edición"
   - Click "Diseñar Zonas"
   - Click "Rectángulo"
4. **Hacer click en el canvas**
   
**Resultado esperado:**
```
[INFO] ZoneDrawingLayer mousedown event received { isActive: true, drawMode: "rectangle", isDrawing: false }
[INFO] Started drawing rectangle { startPos: { x: 150, y: 200 } }
```

5. **Arrastrar el mouse**
   - Debería aparecer un rectángulo semi-transparente con borde punteado
   - El rectángulo crece en tiempo real

6. **Soltar el mouse**
   
**Resultado esperado:**
```
[INFO] Zone created successfully { zone: { id: "zone-...", name: "Zona 1", ... } }
[INFO] [TableMap] Zone created { zoneId: "zone-...", zoneName: "Zona 1" }
```

---

## 📚 Conceptos Técnicos

### ¿Por qué un Layer vacío no captura eventos?

En Konva (y canvas en general):
1. Los eventos de mouse se propagan desde el shape más cercano al cursor
2. Si no hay shapes en un Layer, no hay "superficie" para detectar el click
3. Los eventos pasan directamente al Layer de abajo

**Analogía:** Es como intentar tocar una hoja de papel invisible - necesitas que tenga "sustancia" (aunque sea transparente) para poder interactuar con ella.

### ¿Por qué `fill="transparent"` funciona?

- `fill="transparent"` NO es lo mismo que `opacity={0}`
- Un shape transparente sigue siendo "clickeable" en Konva
- Captura eventos pero no se dibuja visualmente
- Similar a `pointer-events: all` en CSS

---

## 🔍 Debugging

Si el dibujo aún no funciona:

1. **Verificar logs en Console:**
   ```
   [INFO] ZoneDrawingLayer mounted with Stage reference { hasStage: true }
   ```
   - Si `hasStage: false`, el problema es con la referencia al Stage

2. **Al hacer click, debería aparecer:**
   ```
   [INFO] ZoneDrawingLayer mousedown event received ...
   ```
   - Si NO aparece, el rectángulo invisible no está capturando eventos
   - Verificar que `isActive={true}` y `listening={true}`

3. **Si el evento llega pero no dibuja:**
   ```
   [INFO] Started drawing rectangle { startPos: { x: ..., y: ... } }
   ```
   - Si NO aparece, revisar condiciones en `handleMouseDown`
   - Verificar que `drawMode !== 'none'`

4. **Verificar dimensiones del canvas:**
   ```tsx
   console.log('Canvas dimensions:', canvasDimensions)
   ```
   - Si `width: 0` o `height: 0`, el rectángulo no cubre nada

---

## 📊 Resumen de Cambios

| Archivo | Líneas cambiadas | Descripción |
|---------|------------------|-------------|
| `zone-drawing-layer.tsx` | +2 props, +10 líneas | Rectángulo invisible + props de dimensiones |
| `table-map.tsx` | +2 líneas | Pasar `canvasWidth` y `canvasHeight` |
| Total | ~12 líneas | Fix pequeño pero crítico |

---

## ✅ Checklist Post-Fix

- [x] Rectángulo invisible agregado al Layer
- [x] Dimensiones del canvas pasadas como props
- [x] Event handlers movidos al rectángulo invisible
- [x] Logging mejorado para debugging
- [x] Sin errores de TypeScript
- [ ] **Testing manual pendiente** - Verificar que dibuje correctamente

---

**Fecha:** 2025-10-30  
**Issue:** Layer vacío no capturaba eventos de mouse  
**Status:** ✅ Fixed - Listo para testing
