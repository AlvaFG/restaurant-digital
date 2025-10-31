# Prompt: Relevamiento Completo de Botones con Integración Supabase

## Objetivo
Realizar un análisis exhaustivo de todos los botones y elementos interactivos del sistema que realizan operaciones con Supabase para verificar su correcto funcionamiento, manejo de errores y experiencia de usuario.

## Instrucciones para el Análisis

### 1. IDENTIFICACIÓN DE BOTONES

Busca y documenta todos los botones/elementos interactivos que cumplan con:
- Tienen eventos `onClick`, `onSubmit`, `onPress` o similares
- Realizan operaciones CRUD con Supabase (Create, Read, Update, Delete)
- Utilizan cualquiera de estos patrones:
  - `supabase.from(...)`
  - `useSupabase()`
  - `createClient()`
  - Llamadas a APIs que internamente usan Supabase

### 2. INFORMACIÓN A RECOPILAR POR CADA BOTÓN

Para cada botón encontrado, documenta:

#### A. Identificación
- **Archivo**: Ruta completa del componente
- **Línea**: Número de línea donde se encuentra
- **Componente padre**: Nombre del componente que lo contiene
- **Identificador**: className, id, aria-label, o texto del botón
- **Tipo**: Button, IconButton, Link, Form Submit, etc.

#### B. Funcionalidad
- **Acción principal**: Descripción clara de qué hace el botón
- **Tabla(s) Supabase**: Qué tabla(s) de la base de datos afecta
- **Tipo de operación**: INSERT, UPDATE, DELETE, SELECT, UPSERT, RPC
- **Requiere autenticación**: Sí/No
- **Requiere permisos específicos**: Detallar roles/permisos necesarios

#### C. Estado y Feedback
- **Loading state**: ¿Tiene indicador de carga?
- **Disabled state**: ¿Se deshabilita durante la operación?
- **Success feedback**: ¿Muestra mensaje/notificación de éxito?
- **Error handling**: ¿Maneja errores de Supabase?
- **Error messages**: ¿Muestra mensajes de error al usuario?
- **Validaciones**: ¿Valida datos antes de enviar?

#### D. Código de Ejemplo
- **Handler function**: Nombre de la función que ejecuta
- **Dependencias**: Hooks, contextos, stores utilizados
- **Snippet relevante**: Código del onClick/handler

### 3. CRITERIOS DE EVALUACIÓN

Evalúa cada botón según estos criterios (escala 1-5):

#### Robustez ⭐
- ✅ Manejo adecuado de errores de red
- ✅ Manejo de errores de Supabase (RLS, permisos, etc.)
- ✅ Try-catch o manejo de promesas rechazadas
- ✅ Reintentos automáticos (si aplica)
- ✅ Fallback o estado de degradación

#### UX/Feedback ⭐
- ✅ Indicador de loading durante la operación
- ✅ Botón deshabilitado durante la operación
- ✅ Mensaje de éxito claro
- ✅ Mensaje de error descriptivo
- ✅ No permite doble-click/doble-submit

#### Seguridad ⭐
- ✅ Validación de permisos antes de la operación
- ✅ Validación de datos en frontend
- ✅ Validación de datos en backend/RLS
- ✅ Prevención de inyecciones SQL
- ✅ Sanitización de inputs

#### Código ⭐
- ✅ Código limpio y legible
- ✅ Funciones reutilizables
- ✅ Separación de concerns
- ✅ Tipado correcto (TypeScript)
- ✅ Comentarios donde sea necesario

### 4. CASOS DE PRUEBA SUGERIDOS

Para cada botón, genera casos de prueba:

#### Escenarios Positivos
1. **Happy path**: Usuario autenticado con permisos correctos ejecuta la acción exitosamente
2. **Con datos mínimos**: Acción con solo campos requeridos
3. **Con datos completos**: Acción con todos los campos opcionales

#### Escenarios Negativos
1. **Sin autenticación**: Usuario no logueado intenta la acción
2. **Sin permisos**: Usuario sin permisos RLS intenta la acción
3. **Datos inválidos**: Datos que no pasan validación
4. **Sin conexión**: Sin conectividad a Supabase
5. **Timeout**: Operación que excede tiempo límite
6. **Conflicto**: Datos que violan constraints de BD
7. **Doble submit**: Usuario hace click múltiple rápido

### 5. ÁREAS PRIORITARIAS A REVISAR

Enfócate especialmente en:

#### Operaciones Críticas
- 🔴 Eliminación de datos (DELETE operations)
- 🔴 Modificación de configuración del sistema
- 🔴 Cambios de permisos/roles de usuarios
- 🔴 Operaciones de pago/transacciones
- 🟡 Creación de registros importantes
- 🟡 Actualización de datos maestros

#### Módulos Específicos
- `/app/salon/`: Gestión de mesas y zonas
- `/app/pedidos/`: Sistema de pedidos
- `/app/usuarios/`: Gestión de usuarios
- `/app/menu/`: Administración del menú
- `/app/configuracion/`: Configuraciones del sistema
- `/app/staff/`: Gestión de personal
- `/app/qr-management/`: Gestión de códigos QR
- `/app/integraciones/`: Integraciones externas

### 6. FORMATO DE SALIDA

Genera un documento con:

#### Resumen Ejecutivo
```markdown
## Resumen Ejecutivo

- **Total de botones analizados**: [número]
- **Botones con operaciones Supabase**: [número]
- **Botones que requieren atención**: [número]
- **Nivel de riesgo general**: [Bajo/Medio/Alto]
```

#### Tabla de Botones
```markdown
| Archivo | Botón | Operación | Tabla | Rating | Issues |
|---------|-------|-----------|-------|--------|--------|
| salon/page.tsx | "Crear Zona" | INSERT | zones | ⭐⭐⭐⭐ | Sin error handling |
```

#### Detalle por Botón
```markdown
### [Módulo] - [Acción del Botón]

**Archivo**: `path/to/file.tsx:123`
**Estado**: 🟢 OK / 🟡 Mejorable / 🔴 Crítico

**Funcionalidad**:
- Descripción de lo que hace

**Operación Supabase**:
```typescript
await supabase.from('table').insert(data)
```

**Issues Encontrados**:
1. ❌ No maneja errores de RLS
2. ⚠️ No tiene loading state
3. ✅ Validación correcta

**Recomendaciones**:
- Agregar try-catch
- Implementar loading spinner
```

#### Lista de Acciones Recomendadas
```markdown
## Acciones Prioritarias

### Urgente 🔴
1. [Archivo] - [Botón]: [Problema]

### Importante 🟡
1. [Archivo] - [Botón]: [Problema]

### Mejoras 🟢
1. [Archivo] - [Botón]: [Sugerencia]
```

### 7. HERRAMIENTAS Y COMANDOS ÚTILES

Para realizar el relevamiento, usa:

```bash
# Buscar todos los botones con operaciones Supabase
grep -r "supabase.from" app/ components/ --include="*.tsx" --include="*.ts"

# Buscar handlers onClick
grep -r "onClick" app/ components/ --include="*.tsx"

# Buscar formularios con onSubmit
grep -r "onSubmit" app/ components/ --include="*.tsx"

# Buscar uso de hooks de Supabase
grep -r "useSupabase\|createClient" app/ components/ hooks/ --include="*.tsx" --include="*.ts"

# Buscar operaciones específicas
grep -r "\.insert\|\.update\|\.delete\|\.upsert" app/ components/ --include="*.tsx" --include="*.ts"
```

### 8. CHECKLIST DE VERIFICACIÓN

Para cada botón, verifica:

```markdown
- [ ] Tiene loading state
- [ ] Se deshabilita durante operación
- [ ] Maneja errores de Supabase
- [ ] Muestra mensajes de error descriptivos
- [ ] Muestra feedback de éxito
- [ ] Previene doble-submit
- [ ] Valida permisos/autenticación
- [ ] Valida datos antes de enviar
- [ ] Tiene tipado TypeScript correcto
- [ ] Registra errores (logging/Sentry)
- [ ] Tiene tests (unit/integration)
- [ ] Documentado si es complejo
```

### 9. PATRONES COMUNES A BUSCAR

#### Anti-patrones (problemas frecuentes):
```typescript
// ❌ Sin manejo de errores
const handleClick = async () => {
  await supabase.from('table').insert(data)
  // No hay try-catch ni .catch()
}

// ❌ Sin loading state
<Button onClick={handleSubmit}>Submit</Button>

// ❌ Sin validación
const handleDelete = async (id) => {
  await supabase.from('table').delete().eq('id', id)
  // No verifica si el usuario tiene permisos
}

// ❌ Permite doble-submit
<Button onClick={async () => {
  await supabase.from('table').insert(data)
}}>Create</Button>
```

#### Patrones correctos:
```typescript
// ✅ Implementación completa
const [isLoading, setIsLoading] = useState(false)

const handleClick = async () => {
  if (isLoading) return // Previene doble-click
  
  setIsLoading(true)
  try {
    const { data, error } = await supabase
      .from('table')
      .insert(validatedData)
    
    if (error) throw error
    
    toast.success('Operación exitosa')
  } catch (error) {
    console.error('Error:', error)
    toast.error('Error al realizar la operación')
  } finally {
    setIsLoading(false)
  }
}

<Button 
  onClick={handleClick}
  disabled={isLoading}
  loading={isLoading}
>
  {isLoading ? 'Procesando...' : 'Submit'}
</Button>
```

### 10. ENTREGABLES ESPERADOS

1. **Documento de Relevamiento** (`RELEVAMIENTO_BOTONES_SUPABASE_RESULTADOS.md`)
   - Resumen ejecutivo
   - Tabla consolidada
   - Detalles por botón
   - Issues encontrados
   - Recomendaciones priorizadas

2. **Plan de Acción** (`PLAN_ACCION_BOTONES.md`)
   - Issues críticos a resolver inmediatamente
   - Mejoras de mediano plazo
   - Optimizaciones sugeridas
   - Timeline estimado

3. **Checklist de Testing** (`TESTING_BOTONES_CHECKLIST.md`)
   - Casos de prueba por botón crítico
   - Escenarios a validar
   - Criterios de aceptación

4. **Código de Ejemplo** (opcional)
   - Componente modelo con mejores prácticas
   - Hook reutilizable para operaciones Supabase
   - Wrapper para manejo consistente de errores

---

## Ejemplo de Análisis Completo

### Botón: "Crear Nueva Zona" (Módulo Salón)

**Archivo**: `app/salon/page.tsx:145`
**Estado**: 🟡 Mejorable

**Funcionalidad**:
Crea una nueva zona en el salón del restaurante

**Operación Supabase**:
```typescript
const handleCreateZone = async (zoneName: string) => {
  const { data, error } = await supabase
    .from('zones')
    .insert({ name: zoneName, restaurant_id: restaurantId })
}
```

**Evaluación**:
- Robustez: ⭐⭐⭐ (3/5)
- UX/Feedback: ⭐⭐ (2/5)
- Seguridad: ⭐⭐⭐⭐ (4/5)
- Código: ⭐⭐⭐ (3/5)

**Issues Encontrados**:
1. ❌ No maneja el objeto `error` retornado por Supabase
2. ⚠️ No tiene loading state visual
3. ⚠️ No muestra feedback de éxito/error al usuario
4. ✅ Tiene validación de permisos RLS en Supabase
5. ✅ Valida que el nombre no esté vacío

**Recomendaciones**:
1. Agregar try-catch y manejo del error
2. Implementar estado de loading con `useState`
3. Agregar toast notifications (éxito/error)
4. Deshabilitar botón durante la operación
5. Considerar agregar confirmación antes de crear

**Prioridad**: 🟡 Media

---

## Inicio del Relevamiento

Comienza el análisis ejecutando:

```bash
# 1. Generar lista inicial de archivos con botones Supabase
grep -r "onClick.*supabase\|supabase.*onClick" app/ components/ -l > botones_supabase.txt

# 2. Buscar patrones específicos por módulo
grep -r "supabase.from" app/salon/ -n
grep -r "supabase.from" app/pedidos/ -n
grep -r "supabase.from" app/menu/ -n

# 3. Identificar handlers async sin try-catch
grep -r "const.*=.*async.*=>.*supabase" app/ components/ --include="*.tsx"
```

Luego procede módulo por módulo siguiendo la estructura definida.
