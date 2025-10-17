# Feature: Botón de Eliminar Zona en Pestaña Mesas

## 📅 Fecha de Implementación
17 de Octubre, 2025

## 🎯 Objetivo
Agregar funcionalidad para eliminar zonas directamente desde la pestaña de Mesas, proporcionando una forma rápida y conveniente de gestionar zonas sin tener que navegar a una página separada.

## ✨ Características Implementadas

### 1. Botón de Eliminar Zona
- **Ubicación**: Al lado derecho del selector de zona en el filtro
- **Visibilidad**: Solo aparece cuando se selecciona una zona específica (no en "Todas las zonas" o "Sin zona")
- **Estilo**: Icono de papelera (Trash2) con variante `ghost` y color destructivo
- **Estado**: Se deshabilita durante el proceso de eliminación

### 2. Validaciones Implementadas
- ✅ Verificación de que la zona existe
- ✅ Conteo automático de mesas asignadas a la zona
- ✅ Prevención de eliminación si hay mesas asignadas
- ✅ Mensajes diferenciados según el escenario

### 3. Diálogo de Confirmación (AlertDialog)

#### Escenario A: Zona SIN mesas asignadas
```
Título: "¿Eliminar zona [Nombre]?"
Descripción: "Esta acción no se puede deshacer. La zona será eliminada permanentemente."
Acciones: [Cancelar] [Eliminar zona]
```

#### Escenario B: Zona CON mesas asignadas
```
Título: "No se puede eliminar la zona [Nombre]"
Descripción: "La zona tiene [X] mesa(s) asignada(s). Debes reasignar o eliminar las mesas antes de eliminar la zona."
Acciones: [Entendido]
```

### 4. Flujo de Eliminación
1. Usuario hace clic en el botón de eliminar (icono de papelera)
2. Se obtiene la zona seleccionada del estado
3. Se cuenta el número de mesas asignadas
4. Se muestra el AlertDialog correspondiente
5. Si la zona tiene mesas → solo se puede cerrar el diálogo
6. Si la zona NO tiene mesas:
   - Se confirma la eliminación
   - Se llama a `deleteZone(zoneId)` del hook
   - Se muestra toast de éxito
   - El filtro se resetea a "Todas las zonas"
   - Los datos se actualizan automáticamente
7. En caso de error → se muestra toast destructivo

### 5. Feedback al Usuario
- **Durante eliminación**: Botón deshabilitado con texto "Eliminando..."
- **Éxito**: Toast verde con mensaje "Zona eliminada" + nombre de la zona
- **Error**: Toast rojo con el mensaje de error específico
- **Prevención**: Mensaje claro cuando hay mesas asignadas

## 🔧 Cambios Técnicos

### Archivo Modificado
`components/table-list.tsx`

### Estados Agregados
```typescript
const [showDeleteZoneDialog, setShowDeleteZoneDialog] = useState(false)
const [isDeletingZone, setIsDeletingZone] = useState(false)
```

### Hooks Utilizados
```typescript
const { zones, loading: zonesLoading, deleteZone } = useZones()
```

### Memoizaciones Agregadas
```typescript
// Zona seleccionada en el filtro
const selectedZone = useMemo(() => {
  if (selectedZoneFilter === 'all' || selectedZoneFilter === 'none') {
    return null
  }
  return zones.find(z => z.id === selectedZoneFilter)
}, [selectedZoneFilter, zones])

// Contador de mesas en la zona
const tablesInSelectedZone = useMemo(() => {
  if (!selectedZone) return 0
  return tables.filter(t => t.zone_id === selectedZone.id).length
}, [selectedZone, tables])
```

### Función Handler
```typescript
const handleDeleteZone = async () => {
  if (!selectedZone) return
  
  setIsDeletingZone(true)
  try {
    await deleteZone(selectedZone.id)
    
    toast({
      title: "Zona eliminada",
      description: `La zona "${selectedZone.name}" fue eliminada exitosamente.`,
    })
    
    setSelectedZoneFilter('all')
    setShowDeleteZoneDialog(false)
  } catch (error) {
    toast({
      title: "Error al eliminar",
      description: error instanceof Error ? error.message : "No se pudo eliminar la zona.",
      variant: "destructive",
    })
  } finally {
    setIsDeletingZone(false)
  }
}
```

## 🔐 Seguridad
- La API ya valida permisos del usuario mediante `tenant_id`
- La eliminación es soft delete (campo `active = false` en la base de datos)
- Solo usuarios autenticados pueden eliminar zonas
- La validación de mesas asignadas previene pérdida de datos

## 🎨 UX/UI
- **Color**: Rojo destructivo para indicar acción peligrosa
- **Tooltip**: Muestra "Eliminar zona [Nombre]" al pasar el mouse
- **Feedback visual**: Botón se deshabilita y cambia texto durante operación
- **Mensajes**: En español, consistentes con el resto de la aplicación
- **Prevención**: Validación antes de permitir eliminación

## 📊 Integración con Sistema Existente
- Utiliza el hook `useZones` existente con el método `deleteZone`
- Compatible con la API existente en `/api/zones/[id]`
- Se integra perfectamente con el sistema de filtros actual
- Actualización automática de datos mediante React Query
- Logging completo de acciones para auditoría

## ✅ Criterios de Aceptación Cumplidos
- [x] El botón solo aparece cuando una zona específica está seleccionada
- [x] No se puede eliminar una zona con mesas asignadas
- [x] Mensaje claro cuando la zona tiene mesas
- [x] Eliminación requiere confirmación explícita
- [x] Filtro vuelve a "Todas las zonas" después de eliminar
- [x] Toast de éxito o error según corresponda
- [x] Botón deshabilitado durante eliminación
- [x] Datos se actualizan automáticamente
- [x] Experiencia consistente con resto de la aplicación

## 🧪 Pruebas Sugeridas

### Prueba 1: Eliminar zona sin mesas
1. Navegar a `/mesas`
2. Seleccionar una zona que no tenga mesas asignadas
3. Hacer clic en el botón de papelera
4. Confirmar eliminación
5. Verificar que aparece toast de éxito
6. Verificar que el filtro vuelve a "Todas las zonas"
7. Verificar que la zona ya no aparece en la lista

### Prueba 2: Intentar eliminar zona con mesas
1. Navegar a `/mesas`
2. Seleccionar una zona que tenga mesas asignadas
3. Hacer clic en el botón de papelera
4. Verificar mensaje de error con número de mesas
5. Verificar que solo hay botón "Entendido"
6. Cerrar diálogo y verificar que la zona sigue existiendo

### Prueba 3: Cancelar eliminación
1. Navegar a `/mesas`
2. Seleccionar una zona sin mesas
3. Hacer clic en el botón de papelera
4. Hacer clic en "Cancelar"
5. Verificar que el diálogo se cierra
6. Verificar que la zona sigue existiendo

## 📝 Notas Adicionales
- El componente ya tenía la estructura de AlertDialog, facilitando la integración
- Se mantiene consistencia con el patrón de eliminación de mesas existente
- El código incluye logging completo para debugging y auditoría
- La eliminación es soft delete, permitiendo recuperación si es necesario

## 🔄 Próximas Mejoras Potenciales
- [ ] Agregar opción de reasignar mesas automáticamente antes de eliminar zona
- [ ] Implementar búsqueda de zonas en el selector
- [ ] Agregar confirmación con escritura del nombre de la zona para mayor seguridad
- [ ] Mostrar preview de mesas que serían afectadas
