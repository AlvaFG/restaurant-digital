# Implementación CRUD de Mesas

## Resumen
Se ha implementado la funcionalidad completa para crear y eliminar mesas desde la interfaz de usuario, con integración completa a Supabase y validaciones de seguridad.

## Componentes Creados

### 1. AddTableDialog (`components/add-table-dialog.tsx`)
- Componente de diálogo con formulario para agregar nuevas mesas
- Validaciones client-side:
  - Número de mesa: requerido, mayor a 0
  - Zona: opcional
- Feedback visual con toasts para éxito/error
- Recarga automática de la lista al crear mesa exitosamente
- **Nota**: La capacidad se usa por defecto (4 asientos según schema de BD)

### 2. Funciones Server-Side (`lib/server/table-store.ts`)

#### `createTable(data)`
- Crea una nueva mesa en Supabase
- Valida que el número de mesa sea único por tenant
- Genera token QR único con expiración de 1 año
- Usa capacidad por defecto (4 asientos según schema)
- Emite evento de actualización via WebSocket
- Parámetros:
  - `number`: número de mesa (requerido)
  - `zone`: zona/salón (opcional)
  - `tenantId`: ID del tenant (extraído del usuario autenticado)

#### `deleteTable(tableId, tenantId)`
- Elimina una mesa de Supabase
- Validaciones:
  - Mesa debe existir y pertenecer al tenant
  - No se puede eliminar si está ocupada, con pedido en curso o cuenta pedida
- Emite evento de actualización via WebSocket

### 3. Endpoints API

#### POST `/api/tables`
- Crea una nueva mesa
- Autenticación requerida
- Valida tenant_id del usuario
- Validaciones:
  - Número de mesa: requerido, > 0
- Capacidad usa valor por defecto (4 asientos)
- Respuesta: `{ data: Table }` con status 201

#### DELETE `/api/tables/[id]`
- Elimina una mesa existente
- Autenticación requerida
- Valida tenant_id del usuario
- Retorna error 404 si no existe
- Retorna error 500 con mensaje si la mesa no se puede eliminar

### 4. Funciones Cliente (`lib/table-service.ts`)

#### `createTable(data)`
- Llama al endpoint POST `/api/tables`
- Validaciones client-side
- Manejo de errores con logger
- Retorna: `Promise<Table>`

#### `deleteTable(tableId)`
- Llama al endpoint DELETE `/api/tables/[id]`
- Manejo de errores con logger
- Retorna: `Promise<void>`

### 5. Integración UI

#### Página de Mesas (`app/mesas/page.tsx`)
- Botón "Agregar Mesa" con icono Plus
- Abre diálogo AddTableDialog
- Recarga lista automáticamente al crear mesa

#### Lista de Mesas (`components/table-list.tsx`)
- Botón "Eliminar Mesa" en diálogo de detalles
- AlertDialog de confirmación con advertencias:
  - Acción irreversible
  - Muestra estado actual de la mesa
  - Advertencia especial si mesa está ocupada
- Feedback con toasts para éxito/error
- Recarga automática al eliminar mesa

## Seguridad (RLS)

### Políticas Existentes
Las políticas RLS en Supabase ya están configuradas correctamente:

```sql
CREATE POLICY tables_isolation_policy ON tables
  FOR ALL
  USING (tenant_id = current_tenant_id());
```

Esta política asegura que:
- ✅ Los usuarios solo pueden ver mesas de su tenant
- ✅ Los usuarios solo pueden crear mesas en su tenant
- ✅ Los usuarios solo pueden actualizar mesas de su tenant
- ✅ Los usuarios solo pueden eliminar mesas de su tenant

### Validaciones Adicionales

#### Server-Side
1. **Crear Mesa**:
   - Usuario autenticado requerido
   - Tenant_id extraído del usuario
   - Número de mesa único por tenant
   - Generación de QR token seguro

2. **Eliminar Mesa**:
   - Usuario autenticado requerido
   - Tenant_id validado contra la mesa
   - No permite eliminar mesas ocupadas
   - No permite eliminar mesas con pedidos en curso
   - No permite eliminar mesas con cuenta pedida

#### Client-Side
1. Validación de formularios
2. Feedback inmediato de errores
3. Confirmación explícita para eliminación

## Flujo de Uso

### Agregar Mesa
1. Usuario hace clic en "Agregar Mesa"
2. Se abre diálogo con formulario
3. Usuario completa datos (número, zona opcional)
4. Sistema valida datos
5. Se envía petición POST a `/api/tables`
6. Backend valida usuario, tenant y unicidad
7. Se crea mesa en Supabase con QR token y capacidad por defecto
8. Toast de éxito y lista se recarga automáticamente

### Eliminar Mesa
1. Usuario abre detalles de una mesa
2. Hace clic en "Eliminar Mesa"
3. Se muestra AlertDialog de confirmación
4. Si mesa está ocupada, muestra advertencia
5. Usuario confirma eliminación
6. Se envía petición DELETE a `/api/tables/[id]`
7. Backend valida usuario, tenant y estado de mesa
8. Si está ocupada/con pedidos, retorna error
9. Si es válido, elimina mesa de Supabase
10. Toast de éxito/error y lista se recarga

## WebSocket Events

Ambas operaciones emiten eventos via WebSocket:
- `table.layout.updated`: notifica cambios en el layout de mesas

Esto permite que todos los clientes conectados (POS, tablets, dashboard) se actualicen en tiempo real.

## Testing

### Casos a Probar
1. ✅ Crear mesa con datos válidos
2. ✅ Crear mesa con número duplicado (debe fallar)
3. ✅ Crear mesa sin autenticación (debe fallar)
4. ✅ Eliminar mesa libre (debe funcionar)
5. ✅ Eliminar mesa ocupada (debe fallar)
6. ✅ Eliminar mesa sin autenticación (debe fallar)
7. ✅ Intentar eliminar mesa de otro tenant (debe fallar por RLS)
8. ✅ Verificar capacidad por defecto (4 asientos)
9. ✅ Feedback visual de toasts
10. ✅ Recarga automática de lista

## Archivos Modificados/Creados

### Nuevos
- `components/add-table-dialog.tsx`
- `docs/IMPLEMENTACION_CRUD_MESAS.md`

### Modificados
- `lib/server/table-store.ts` - agregadas funciones createTable y deleteTable
- `app/api/tables/route.ts` - agregado endpoint POST
- `app/api/tables/[id]/route.ts` - agregado endpoint DELETE
- `lib/table-service.ts` - agregadas funciones createTable y deleteTable
- `app/mesas/page.tsx` - agregado botón y diálogo
- `components/table-list.tsx` - agregado botón eliminar y AlertDialog

## Notas Técnicas

### Generación de QR Token
- Se usa `randomBytes(32).toString('base64url')` para generar tokens seguros
- Tokens expiran en 1 año por defecto
- Se valida en políticas RLS para acceso público

### Manejo de Errores
- Errores server-side logueados con contexto completo
- Errores client-side mostrados en toasts
- Mensajes de error claros y traducidos

### Performance
- Recarga de lista optimizada (solo cuando necesario)
- WebSocket events para actualización en tiempo real
- Validaciones client-side antes de llamar API

## Próximos Pasos (Opcional)

1. **Editar Mesa**: Agregar funcionalidad para editar número, zona y capacidad
2. **Mover Mesa**: Permitir arrastrar mesas en el mapa del salón
3. **Duplicar Mesa**: Crear mesa basada en otra existente
4. **Importar/Exportar**: Bulk operations para mesas
5. **Historial**: Ver historial de cambios de mesas
6. **Estadísticas**: Análisis de uso por mesa

## Conclusión

La implementación está completa y funcional. Todas las validaciones de seguridad están en su lugar, la experiencia de usuario es fluida con feedback apropiado, y el sistema mantiene la integridad multi-tenant en todo momento.
