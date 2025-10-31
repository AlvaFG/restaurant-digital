# 🧪 Script de Testing Manual - Zone Drawing Layer

## Preparación
```powershell
# 1. Asegurarse de que el servidor esté corriendo
npm run dev

# 2. Abrir en el navegador
# http://localhost:3000/salon

# 3. Abrir DevTools Console (F12)
# Filtrar por "Zone" para ver logs específicos
```

---

## Test Suite 1: Dibujo de Rectángulo ✅

### Test 1.1: Activar modo rectángulo
**Pasos:**
1. Login como admin
2. Navegar a `/salon`
3. Click en "Edición" (botón en la esquina superior)
4. Click en "Diseñar Zonas"
5. Click en botón "Rectángulo"

**Resultado esperado:**
- ✅ Botón "Rectángulo" aparece marcado (variant="default")
- ✅ Cursor cambia a crosshair sobre el canvas
- ✅ Mensaje aparece: "Haz clic y arrastra en el canvas para dibujar la zona. Presiona ESC para cancelar."

**Logs esperados en Console:**
```
[INFO] ZoneDrawingLayer mounted with Stage reference { hasStage: true }
```

---

### Test 1.2: Dibujar rectángulo válido (>50px)
**Pasos:**
1. Con modo rectángulo activo
2. Click en cualquier punto del canvas
3. Mantener presionado y arrastrar al menos 100px en ambas direcciones
4. Soltar el botón del mouse

**Resultado esperado:**
- ✅ Durante el arrastre: rectángulo semi-transparente con borde punteado aparece
- ✅ Al soltar: rectángulo se solidifica y aparece en la lista "Zonas Creadas (1)"
- ✅ Nombre automático: "Zona 1"
- ✅ Modo de dibujo se desactiva automáticamente (botón vuelve a outline)
- ✅ Cursor vuelve a normal

**Logs esperados en Console:**
```
[INFO] Started drawing rectangle { startPos: { x: 150, y: 200 } }
[INFO] Zone created successfully { zone: { id: "zone-...", name: "Zona 1", type: "rectangle", ... } }
[INFO] [TableMap] Zone created { zoneId: "zone-...", zoneName: "Zona 1" }
```

---

### Test 1.3: Dibujar rectángulo inválido (<50px)
**Pasos:**
1. Click en botón "Rectángulo" nuevamente
2. Click en el canvas y arrastrar solo 20px
3. Soltar

**Resultado esperado:**
- ✅ Rectángulo temporal aparece durante el arrastre
- ✅ Al soltar: rectángulo desaparece sin crear zona
- ✅ No se agrega a la lista de zonas
- ✅ Modo de dibujo se desactiva

**Logs esperados en Console:**
```
[WARN] Zone too small, canceling { shape: "rectangle", dimensions: { width: 20, height: 15 } }
```

---

## Test Suite 2: Dibujo de Círculo ⭕

### Test 2.1: Dibujar círculo válido
**Pasos:**
1. Click en botón "Circular"
2. Click en un punto del canvas
3. Arrastrar hacia afuera al menos 80px (radio > 50px)
4. Soltar

**Resultado esperado:**
- ✅ Círculo crece desde el punto inicial
- ✅ Al soltar: círculo se crea como "Zona 2"
- ✅ Aparece en la lista con badge "Circular"
- ✅ Color diferente al rectángulo anterior (sistema de colores rotativo)

**Logs esperados:**
```
[INFO] Started drawing circle { startPos: { x: 300, y: 250 } }
[INFO] Zone created successfully { zone: { id: "zone-...", name: "Zona 2", type: "circle", ... } }
```

---

### Test 2.2: Dibujar círculo inválido (radio <25px)
**Pasos:**
1. Click en "Circular"
2. Click y arrastrar solo 15px
3. Soltar

**Resultado esperado:**
- ✅ Círculo no se crea
- ✅ Warning en console

**Logs esperados:**
```
[WARN] Zone too small, canceling { shape: "circle", dimensions: { radius: 15 } }
```

---

## Test Suite 3: Cancelación 🚫

### Test 3.1: Cancelar con ESC durante dibujo
**Pasos:**
1. Click en "Rectángulo"
2. Empezar a dibujar (click y arrastrar)
3. SIN SOLTAR, presionar tecla ESC
4. Soltar el mouse

**Resultado esperado:**
- ✅ Dibujo se cancela inmediatamente
- ✅ Forma temporal desaparece
- ✅ Modo de dibujo se desactiva
- ✅ No se crea zona

**Logs esperados:**
```
[INFO] Drawing canceled by user (Escape key)
```

---

### Test 3.2: Cancelar cambiando de modo
**Pasos:**
1. Click en "Rectángulo" (activa modo)
2. SIN DIBUJAR, click en "Rectángulo" nuevamente

**Resultado esperado:**
- ✅ Modo se desactiva (toggle off)
- ✅ Cursor vuelve a normal
- ✅ Sin errores en console

---

## Test Suite 4: Edición de Zonas Existentes ✏️

### Test 4.1: Seleccionar zona
**Pasos:**
1. Con al menos 2 zonas creadas
2. Click en una zona en el canvas
3. O click en una zona en la lista lateral

**Resultado esperado:**
- ✅ Zona se selecciona (borde más grueso y punteado)
- ✅ Panel "Editar Zona" aparece en el lateral
- ✅ Campos editables: Nombre, Color, Posición X/Y, Dimensiones

---

### Test 4.2: Editar nombre de zona
**Pasos:**
1. Seleccionar zona
2. En el input "Nombre", cambiar a "Zona VIP"
3. Click fuera del input

**Resultado esperado:**
- ✅ Nombre se actualiza en el canvas
- ✅ Nombre se actualiza en la lista lateral
- ✅ Badge "Cambios sin guardar" aparece

---

### Test 4.3: Arrastrar zona
**Pasos:**
1. Seleccionar una zona
2. Arrastrar la zona a otra posición
3. Soltar

**Resultado esperado:**
- ✅ Zona se mueve suavemente
- ✅ Posición X/Y en el panel se actualiza
- ✅ Badge "Cambios sin guardar" aparece

---

### Test 4.4: Eliminar zona
**Pasos:**
1. Seleccionar zona
2. Click en botón "Eliminar Zona" (rojo con icono trash)
3. Confirmar si hay diálogo

**Resultado esperado:**
- ✅ Zona desaparece del canvas
- ✅ Zona desaparece de la lista
- ✅ Panel de edición se cierra
- ✅ Contador "Zonas Creadas (N)" se decrementa

---

## Test Suite 5: Interacción con Mesas 🪑

### Test 5.1: Dibujar zona sin afectar mesas
**Pasos:**
1. Con mesas existentes en el canvas
2. Activar modo rectángulo
3. Dibujar zona que NO solape con mesas
4. Crear la zona

**Resultado esperado:**
- ✅ Zona se crea correctamente
- ✅ Mesas permanecen intactas
- ✅ Mesas NO se mueven

---

### Test 5.2: Mesas siguen funcionando en modo zona
**Pasos:**
1. Abrir panel "Diseñar Zonas"
2. SIN activar modo de dibujo (modo 'none')
3. Click en una mesa

**Resultado esperado:**
- ✅ Mesa se selecciona normalmente
- ✅ Panel de controles de mesa funciona
- ✅ Se puede editar número, capacidad, etc.

---

### Test 5.3: Arrastrar mesa con zona de fondo
**Pasos:**
1. Crear una zona rectangular
2. Arrastrar una mesa sobre la zona
3. Mover la mesa dentro de los límites de la zona

**Resultado esperado:**
- ✅ Mesa se arrastra normalmente
- ✅ Zona permanece en el fondo (no se mueve)
- ✅ No hay conflictos de eventos

---

## Test Suite 6: Persistencia 💾

### Test 6.1: Guardar layout con zonas
**Pasos:**
1. Crear 2-3 zonas
2. Editar nombres y posiciones
3. Click en botón "Guardar"
4. Esperar confirmación

**Resultado esperado:**
- ✅ Spinner aparece durante guardado
- ✅ Toast de éxito: "Layout guardado correctamente"
- ✅ Badge "Cambios sin guardar" desaparece

---

### Test 6.2: Recargar página
**Pasos:**
1. Con zonas guardadas
2. F5 para recargar
3. Navegar a `/salon`

**Resultado esperado:**
- ✅ Zonas se restauran en sus posiciones correctas
- ✅ Nombres y colores se mantienen
- ✅ Contador de zonas es correcto

---

### Test 6.3: Deshacer cambios sin guardar
**Pasos:**
1. Crear una zona nueva
2. SIN GUARDAR, click en "Deshacer cambios"

**Resultado esperado:**
- ✅ Zona nueva desaparece
- ✅ Se restaura al último estado guardado
- ✅ Badge "Cambios sin guardar" desaparece

---

## Test Suite 7: Edge Cases 🔍

### Test 7.1: Dibujar fuera del canvas
**Pasos:**
1. Activar modo rectángulo
2. Empezar dibujo en el borde del canvas
3. Arrastrar fuera del canvas
4. Soltar

**Resultado esperado:**
- ✅ Zona se crea solo con las coordenadas dentro del canvas
- ✅ O se cancela si el área válida es <50px
- ✅ Sin errores en console

---

### Test 7.2: Cambiar de tab durante dibujo
**Pasos:**
1. Activar modo rectángulo
2. Empezar dibujo
3. SIN SOLTAR, cambiar a otra pestaña del navegador
4. Volver a la pestaña de salon

**Resultado esperado:**
- ✅ Dibujo se cancela automáticamente
- ✅ Sin zonas fantasma
- ✅ Modo se resetea

---

### Test 7.3: Múltiples zonas solapadas
**Pasos:**
1. Crear zona rectangular grande
2. Crear zona circular dentro de la rectangular
3. Click en diferentes áreas

**Resultado esperado:**
- ✅ Ambas zonas visibles
- ✅ Zona más al frente se selecciona primero
- ✅ Se pueden seleccionar ambas desde la lista lateral

---

## Test Suite 8: Performance ⚡

### Test 8.1: Crear 10 zonas rápidamente
**Pasos:**
1. Crear 10 zonas en sucesión rápida
2. Observar fluidez de la UI

**Resultado esperado:**
- ✅ Canvas se mantiene fluido (>30 FPS)
- ✅ Sin lag al arrastrar mouse
- ✅ Lista se actualiza inmediatamente

---

### Test 8.2: Arrastrar zona con muchas mesas
**Pasos:**
1. Layout con 20+ mesas
2. Crear zona grande
3. Arrastrar la zona

**Resultado esperado:**
- ✅ Movimiento suave sin stuttering
- ✅ Mesas no se re-renderizan innecesariamente
- ✅ Sin warnings de performance en console

---

## Test Suite 9: Accesibilidad ♿

### Test 9.1: Navegación con teclado
**Pasos:**
1. Tab para navegar entre controles
2. Enter para activar botones
3. ESC para cancelar

**Resultado esperado:**
- ✅ Focus visible en cada elemento
- ✅ Order lógico de tabulación
- ✅ ESC cancela operaciones

---

### Test 9.2: Screen reader (opcional)
**Pasos:**
1. Activar NVDA o JAWS
2. Navegar por el panel de zonas

**Resultado esperado:**
- ✅ Labels descriptivos leídos correctamente
- ✅ Estado de botones anunciado ("presionado", "no presionado")
- ✅ Instrucciones contextuales disponibles

---

## Checklist Final ✅

Completar antes de considerar la feature lista para producción:

- [ ] Todos los tests de Suite 1 pasan (Rectángulos)
- [ ] Todos los tests de Suite 2 pasan (Círculos)
- [ ] Todos los tests de Suite 3 pasan (Cancelación)
- [ ] Todos los tests de Suite 4 pasan (Edición)
- [ ] Todos los tests de Suite 5 pasan (Interacción con mesas)
- [ ] Todos los tests de Suite 6 pasan (Persistencia)
- [ ] Tests de edge cases críticos pasan
- [ ] Performance aceptable con 10+ zonas y 20+ mesas
- [ ] Sin errores en Console durante uso normal
- [ ] Sin warnings de React en DevTools
- [ ] Layout guardado se restaura correctamente después de reload
- [ ] Feature funciona en Chrome, Firefox, Edge

---

## Reportar Bugs 🐛

Si encuentras un bug durante testing:

1. **Reproducir:** Anotar pasos exactos
2. **Logs:** Copiar logs de Console
3. **Screenshot:** Captura de pantalla del estado del canvas
4. **Información del sistema:**
   - Navegador y versión
   - Sistema operativo
   - Resolución de pantalla
5. **Descripción:** Resultado esperado vs resultado actual

**Template:**
```markdown
## Bug: [Título breve]

**Pasos para reproducir:**
1. ...
2. ...
3. ...

**Resultado esperado:**
...

**Resultado actual:**
...

**Logs de Console:**
```
...
```

**Screenshot:**
[adjuntar]

**Sistema:**
- Navegador: Chrome 119
- OS: Windows 11
- Resolución: 1920x1080
```

---

## Notas Adicionales 📝

- Todos los logs de `ZoneDrawingLayer` se pueden filtrar en Console con la palabra "Zone"
- Para debugging intensivo, cambiar nivel de log en `lib/logger.ts` a `debug`
- Usar React DevTools para inspeccionar state de `table-map.tsx` y ver `visualZones` array
- Konva Inspector (extensión de Chrome) puede ayudar a visualizar la estructura de Layers

---

**Fecha creación:** 2025-10-30  
**Última actualización:** 2025-10-30  
**Versión:** 1.0  
**Status:** ✅ Ready for testing
