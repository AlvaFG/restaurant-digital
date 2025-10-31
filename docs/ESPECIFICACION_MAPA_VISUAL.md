# 🗺️ Especificación: Sistema Avanzado de Mapeo Visual del Restaurante

## 📋 Resumen Ejecutivo

Se ha implementado un **sistema avanzado de mapeo visual** que permite a los administradores diseñar un plano del restaurante visto desde arriba, con zonas personalizadas dibujables y mesas que se asignan automáticamente según su posición.

---

## 🎯 Objetivos del Sistema

### Objetivo Principal
Permitir a los administradores crear un **mapa visual realista** del restaurante donde:
- Las **zonas** se dibujan con formas y colores personalizados
- Las **mesas** se colocan dentro de las zonas
- La **asignación es automática** según la posición geométrica

### Objetivos Secundarios
1. **Facilitar la organización** visual del espacio
2. **Mejorar la comunicación** del equipo sobre ubicaciones
3. **Automatizar la gestión** de zonas
4. **Escalar fácilmente** a múltiples locales

---

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
advanced-table-map.tsx (Coordinador Principal)
├── zone-shape-editor.tsx (Editor de Zonas)
│   ├── Dibujo de formas (rectángulos, círculos)
│   ├── Edición de propiedades (color, tamaño, nombre)
│   └── Lista de zonas creadas
├── Canvas Principal (react-konva)
│   ├── Layer de Zonas (fondo, semi-transparente)
│   └── Layer de Mesas (arriba, interactivas)
└── Auto-asignación (Algoritmo geométrico)
```

---

## 🎨 Características del Sistema

### 1. Editor de Zonas Visuales

#### Herramientas de Dibujo
- **Rectángulo**: Clic y arrastrar para crear áreas rectangulares
- **Círculo**: Clic y arrastrar para crear áreas circulares
- **Polígono**: (Futuro) Dibujo de formas irregulares personalizadas

#### Propiedades de Zona
```typescript
interface ZoneShape {
  id: string              // UUID único
  name: string            // "Terraza", "Interior", "VIP"
  type: 'rectangle' | 'circle' | 'polygon'
  x: number               // Posición X
  y: number               // Posición Y
  width?: number          // Ancho (rectángulos)
  height?: number         // Alto (rectángulos)
  radius?: number         // Radio (círculos)
  points?: number[]       // Puntos [x,y,x,y...] (polígonos)
  fill: string            // Color de relleno (hex)
  stroke: string          // Color de borde (hex)
  opacity: number         // Transparencia (0-1)
}
```

#### Colores Predefinidos
| Color | Uso Sugerido | Fill | Stroke |
|-------|--------------|------|--------|
| Gris | Zona general | #9ca3af | #6b7280 |
| Azul | Terraza/Exterior | #93c5fd | #3b82f6 |
| Verde | Jardín/Natural | #86efac | #22c55e |
| Amarillo | VIP/Premium | #fde047 | #eab308 |
| Rojo | Barra | #fca5a5 | #ef4444 |
| Púrpura | Privado | #c4b5fd | #8b5cf6 |

---

### 2. Auto-Asignación de Mesas a Zonas

#### Algoritmo de Detección
```typescript
function detectZoneForTable(
  table: { x, y, width, height },
  zones: ZoneShape[]
): string | null {
  // 1. Calcular centro de la mesa
  const centerX = table.x + table.width / 2
  const centerY = table.y + table.height / 2
  
  // 2. Verificar si el centro está dentro de alguna zona
  for (const zone of zones) {
    if (isPointInZone({x: centerX, y: centerY}, zone)) {
      return zone.id
    }
  }
  
  return null // Mesa fuera de zonas
}
```

#### Detección por Tipo de Zona

**Rectángulo:**
```typescript
point.x >= zone.x && point.x <= zone.x + zone.width &&
point.y >= zone.y && point.y <= zone.y + zone.height
```

**Círculo:**
```typescript
distance = sqrt((point.x - zone.x)² + (point.y - zone.y)²)
return distance <= zone.radius
```

**Polígono:** (Futuro)
Algoritmo Ray Casting para polígonos irregulares

---

### 3. Interfaz de Usuario

#### Pestañas Principales

**1. Mapa de Mesas** 
- Vista principal del salón con zonas de fondo
- Mesas arrastrables en modo edición
- Click en mesa para ver detalles o navegar
- Leyenda de estados de mesa

**2. Diseño de Zonas**
- Canvas para dibujar zonas
- Panel lateral con herramientas
- Lista de zonas creadas
- Editor de propiedades de zona seleccionada

#### Flujo de Trabajo

```
1. Admin activa "Modo Edición"
   ↓
2. Cambia a pestaña "Diseño de Zonas"
   ↓
3. Selecciona herramienta (Rectángulo/Círculo)
   ↓
4. Dibuja zona en el canvas
   ↓
5. Edita nombre y color de la zona
   ↓
6. Repite para todas las zonas
   ↓
7. Vuelve a pestaña "Mapa de Mesas"
   ↓
8. Arrastra mesas a sus posiciones
   ↓
9. Click "Auto-asignar mesas a zonas" (opcional)
   ↓
10. Guarda el layout
    ↓
11. Zonas y posiciones se sincronizan con DB
```

---

## 💾 Persistencia de Datos

### Estructura en Base de Datos

#### Tabla: `tenants`
```sql
-- Campo settings (JSONB)
{
  "tableMapLayout": {
    "zones": [...],           -- Configuración de zonas lógicas
    "nodes": [...],           -- Posiciones de mesas
    "visualZones": [          -- NUEVO: Zonas dibujables
      {
        "id": "zone-123",
        "name": "Terraza",
        "type": "rectangle",
        "x": 100,
        "y": 100,
        "width": 300,
        "height": 200,
        "fill": "#93c5fd",
        "stroke": "#3b82f6",
        "opacity": 0.3
      }
    ]
  }
}
```

#### Tabla: `tables`
```sql
-- Cada mesa tiene
zone_id UUID           -- ID de la zona (actualizado automáticamente)
position JSONB         -- (Futuro) Posición exacta {x, y}
```

### Sincronización

```typescript
// Al guardar layout:
1. Guardar visualZones en settings.tableMapLayout
2. Guardar nodes (posiciones de mesas)
3. Para cada mesa:
   - Si node.zone cambió → UPDATE tables SET zone_id = ...
4. Broadcast cambios vía WebSocket (futuro)
```

---

## 🔄 Casos de Uso

### Caso 1: Configuración Inicial de un Restaurante

**Actor:** Administrador del restaurante

**Pasos:**
1. Accede a `/salon/advanced`
2. Activa "Modo Edición"
3. Va a pestaña "Diseño de Zonas"
4. Dibuja zona "Interior" (rectángulo gris, 400x300px)
5. Dibuja zona "Terraza" (rectángulo azul, 300x250px)
6. Dibuja zona "Barra" (círculo rojo, radio 100px)
7. Vuelve a "Mapa de Mesas"
8. Arrastra mesa 1 a zona Interior
9. Arrastra mesa 2 a zona Terraza
10. Click "Auto-asignar" para mesas restantes
11. Guarda el layout

**Resultado:**
- Mapa visual completo guardado
- Todas las mesas asignadas a zonas
- Equipo puede ver el mapa actualizado

---

### Caso 2: Reorganización del Espacio

**Actor:** Gerente

**Situación:** Se amplió la terraza

**Pasos:**
1. Activa "Modo Edición"
2. Va a "Diseño de Zonas"
3. Selecciona zona "Terraza"
4. Ajusta ancho de 300px a 450px
5. Vuelve a "Mapa de Mesas"
6. Arrastra 3 mesas adicionales a la terraza expandida
7. Las mesas se asignan automáticamente a "Terraza"
8. Guarda

**Resultado:**
- Zona actualizada
- Mesas reasignadas correctamente
- DB sincronizada

---

### Caso 3: Vista para el Personal

**Actor:** Mesero

**Situación:** Necesita ubicar mesa 15

**Pasos:**
1. Accede a `/salon` (modo vista, no edición)
2. Ve el mapa con zonas de fondo
3. Identifica que mesa 15 está en zona "Interior"
4. Ve su estado (ocupada/libre/etc.)
5. Click en mesa para ver detalles del pedido

**Resultado:**
- Personal ubicó la mesa rápidamente
- Contexto visual del restaurante

---

## 🎨 Especificaciones Visuales

### Canvas

```
Dimensiones: 900px × 650px
Fondo: #f9fafb (light) / #111827 (dark)
Borde: 1px solid #e5e7eb
```

### Zonas

```
Opacidad fondo: 0.3
Borde: 2px sólido
Radio esquinas: 8px (rectángulos)
Sombra: Ninguna

Estados:
- Normal: Opacidad 0.3
- Seleccionada: Borde punteado [5, 5], grosor 3px
- Hover: Opacidad 0.4 (futuro)
```

### Mesas

```
Tamaño estándar: 80px × 60px
Borde: 2px sólido #1e293b
Radio esquinas: 6px
Sombra: blur 6px (edición), blur 3px (vista)

Estados:
- Libre: #22c55e
- Ocupada: #ef4444
- Reservada: #eab308
- Limpieza: #8b5cf6
- Seleccionada: Borde azul 4px
```

### Etiquetas

```
Nombre de zona:
  Fuente: 16px bold
  Color: stroke de la zona
  Posición: x+10, y+10 (rectángulo) / x-30, y+10 (círculo)
  Opacidad: 0.7

Nombre de mesa:
  Fuente: 14px bold, blanco
  Centrado en la mesa

Capacidad:
  Fuente: 11px, blanco
  Debajo del nombre
```

---

## 🔧 API y Hooks

### Hook: `useTableLayout`

```typescript
const {
  layout,              // Layout actual con visualZones
  isLoading,
  saveLayout,          // Guardar con zonas visuales
  deleteLayout,
  refresh,
  generateDefaultLayout
} = useTableLayout()
```

### Servicio: `layouts-service.ts`

```typescript
// Guardar layout incluyendo visualZones
await saveLayout(tenantId, {
  zones: [...],
  nodes: [...],
  visualZones: [...]  // NUEVO
})
```

---

## 🚀 Beneficios del Sistema

### Para Administradores
- ✅ **Diseño intuitivo**: Dibujar zonas como en un plano real
- ✅ **Flexibilidad**: Formas y colores personalizables
- ✅ **Ahorro de tiempo**: Auto-asignación de mesas

### Para el Personal
- ✅ **Ubicación rápida**: Mapa visual claro
- ✅ **Contexto espacial**: Entienden la distribución
- ✅ **Menos errores**: Menos confusión sobre ubicaciones

### Para el Negocio
- ✅ **Escalabilidad**: Múltiples locales con mapas distintos
- ✅ **Profesionalismo**: Imagen moderna y organizada
- ✅ **Datos precisos**: Zonas y ubicaciones consistentes

---

## 📊 Métricas de Éxito

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Tiempo de configuración inicial | < 15 minutos | Timer en primera vez |
| Precisión de auto-asignación | > 95% | Comparar auto vs manual |
| Satisfacción de usuario | > 4.5/5 | Encuesta post-uso |
| Errores de ubicación | < 5% | Tracking de correcciones |

---

## 🔮 Roadmap Futuro

### Fase 1 (Actual) ✅
- Editor de zonas rectangulares y circulares
- Auto-asignación por posición
- Persistencia en Supabase

### Fase 2 (Próximo mes)
- [ ] Polígonos irregulares personalizados
- [ ] Herramienta de "dibujo libre"
- [ ] Snap-to-grid para alineación precisa
- [ ] Zoom y pan en el canvas

### Fase 3 (3 meses)
- [ ] Importar plano arquitectónico (imagen de fondo)
- [ ] Medidas reales (metros/pies)
- [ ] Capas adicionales (paredes, puertas, decoración)
- [ ] Vista 3D opcional

### Fase 4 (6 meses)
- [ ] AR (Realidad Aumentada) para visualizar en espacio real
- [ ] IA para sugerir distribución óptima
- [ ] Análisis de flujo de clientes
- [ ] Heat maps de ocupación

---

## 🛠️ Troubleshooting

### "Las zonas no se ven en el mapa"
**Causa:** Zonas no guardadas o layout corrupto
**Solución:** 
1. Verificar que se guardó el layout
2. Refrescar página
3. Revisar console para errores

### "La auto-asignación no funciona"
**Causa:** Mesas fuera de zonas dibujadas
**Solución:**
1. Verificar que mesas estén dentro de zonas
2. Ajustar tamaño/posición de zonas
3. Mover mesas manualmente si están en bordes

### "No puedo dibujar zonas"
**Causa:** No está en modo edición o no es admin
**Solución:**
1. Activar "Modo Edición"
2. Verificar rol de usuario (debe ser admin)
3. Ir a pestaña "Diseño de Zonas"

---

## 📚 Referencias Técnicas

### Librerías Utilizadas
- **react-konva** v18.2.10 - Canvas HTML5 con React
- **konva** v9.2.0 - Motor de gráficos 2D
- **@tanstack/react-query** - Caché y sincronización
- **zustand** - Estado global (legacy)

### Documentación Relacionada
- [React Konva Docs](https://konvajs.org/docs/react/)
- [Supabase JSONB](https://supabase.com/docs/guides/database/json)
- [Geometry Algorithms](https://en.wikipedia.org/wiki/Point_in_polygon)

---

## 📞 Soporte

**Para desarrolladores:**
- Ver código en `components/advanced-table-map.tsx`
- Ver editor de zonas en `components/zone-shape-editor.tsx`

**Para usuarios:**
- Tutorial en video (próximamente)
- Sección de ayuda en la app

---

**Documento versión:** 1.0  
**Fecha:** Octubre 2025  
**Autor:** Equipo de Desarrollo

