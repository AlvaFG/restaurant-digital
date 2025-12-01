# Plan de Corrección i18n - Sin Hardcodeo

## 🔍 Problemas Identificados

### 1. **Error: `t is not a function` en orders-panel.tsx (Línea 106)**
- **Causa**: La función `formatRelativeTime` recibe `t` como parámetro pero se llama sin pasarle el parámetro
- **Líneas afectadas**: 139, 354
- **Solución**: Convertir a closure o pasar `tCommon` correctamente

### 2. **Textos hardcodeados en español**
- `"Sin registros"` en orders-panel.tsx línea 140
- `"Error al obtener pedidos"` en orders-panel.tsx línea 148
- Navegación sidebar con textos en español
- Muchas páginas sin migrar

### 3. **Navegación sidebar mal escrita**
- Las claves de traducción están incorrectas
- Faltan traducciones en dashboard.json para algunos items de navegación

## 📋 Plan de Corrección (Sin Hardcodeo)

### **FASE 1: Corregir orders-panel.tsx** ✅ CRÍTICO

#### Problema 1.1: formatRelativeTime no recibe función `t`
**Archivo**: `components/orders-panel.tsx`

**Acción**:
- Convertir `formatRelativeTime` a closure dentro del componente
- O pasar `tCommon` como parámetro en cada llamada

**Implementación**:
```typescript
// Opción 1: Closure (RECOMENDADO)
export function OrdersPanel() {
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  
  // Mover dentro del componente para acceder a tCommon
  const formatRelativeTime = (date: Date): string => {
    const diff = Date.now() - date.getTime()
    if (diff < 60_000) return tCommon('lessThanMinute')
    const minutes = Math.round(diff / 60_000)
    if (minutes < 60) return tCommon('minutesAgo', { minutes })
    const hours = Math.round(diff / 3_600_000)
    if (hours < 24) return tCommon('hoursAgo', { hours })
    const days = Math.round(diff / 86_400_000)
    return tCommon('daysAgo', { days })
  }
  
  // Usar sin parámetro adicional
  const latestOrderDisplay = summary?.latestOrderAt
    ? formatRelativeTime(summary.latestOrderAt)
    : tCommon('noRecords')
}
```

#### Problema 1.2: Hardcoded strings
**Strings a migrar**:
- `"Sin registros"` → `tCommon('noRecords')`
- `"Error al obtener pedidos"` → `tErrors('fetchOrdersError')`

### **FASE 2: Agregar claves faltantes a messages/** ✅

#### 2.1: common.json (es/en)
**Agregar**:
```json
{
  "lessThanMinute": "Hace menos de 1 minuto",
  "minutesAgo": "Hace {minutes} minuto(s)",
  "hoursAgo": "Hace {hours} hora(s)",
  "daysAgo": "Hace {days} día(s)",
  "noRecords": "Sin registros"
}
```

```json
{
  "lessThanMinute": "Less than 1 minute ago",
  "minutesAgo": "{minutes} minute(s) ago",
  "hoursAgo": "{hours} hour(s) ago",
  "daysAgo": "{days} day(s) ago",
  "noRecords": "No records"
}
```

#### 2.2: errors.json (es/en)
**Agregar**:
```json
{
  "fetchOrdersError": "Error al obtener pedidos"
}
```

```json
{
  "fetchOrdersError": "Error fetching orders"
}
```

#### 2.3: dashboard.json - Corregir navegación
**Verificar claves**:
```json
{
  "dashboard": "Dashboard",
  "salon": "Salón",
  "orders": "Pedidos",
  "alerts": "Alertas",
  "menu": "Menú",
  "zones": "Zonas",
  "analytics": "Analítica",
  "integrations": "Integraciones",
  "settings": "Configuración"
}
```

### **FASE 3: Corregir sidebar-nav.tsx** ✅

#### Problema 3.1: Verificar claves de traducción
**Revisar navItems**:
- Asegurar que todas las `titleKey` existen en `dashboard.json`
- Ejemplo: `titleKey: "dashboard"` debe tener `"dashboard": "Dashboard"` en JSON

**Implementación actual**:
```typescript
const navItems: NavItem[] = [
  { titleKey: "dashboard", href: "/dashboard", ... },
  { titleKey: "salon", href: "/salon", ... },
  { titleKey: "orders", href: "/pedidos", ... },
  // etc.
]

// En render
navItems.map(item => (
  <span>{t(item.titleKey)}</span>
))
```

### **FASE 4: Auditoría completa de textos hardcodeados** ✅

#### 4.1: Re-ejecutar audit script
```bash
npm run i18n:audit
```

#### 4.2: Migrar textos faltantes por prioridad
**Prioridad ALTA** (Páginas principales):
- Dashboard principal
- Zona de mesas (salón)
- Menú
- Pedidos
- Alertas

**Prioridad MEDIA**:
- Configuración
- Analítica
- Integraciones

**Prioridad BAJA**:
- Páginas de error
- Componentes auxiliares

### **FASE 5: Validación y Testing** ✅

#### 5.1: Pruebas funcionales
- [ ] Cambiar idioma a inglés en Settings → LanguageSelector
- [ ] Verificar que TODA la UI cambia
- [ ] Probar formatRelativeTime en orders panel
- [ ] Verificar navegación sidebar en ambos idiomas
- [ ] Validar estados de pedidos traducidos

#### 5.2: Pruebas técnicas
- [ ] No debe haber errores en consola
- [ ] `npm run i18n:audit` debe mostrar solo 5 strings (server defaults)
- [ ] TypeScript debe compilar sin errores
- [ ] Hot reload debe funcionar correctamente

## 🎯 Orden de Ejecución

### Paso 1: Corregir error crítico en orders-panel.tsx
1. Mover `formatRelativeTime` dentro del componente
2. Usar `tCommon` directamente (closure)
3. Reemplazar `"Sin registros"` con `tCommon('noRecords')`
4. Reemplazar `"Error al obtener pedidos"` con `tErrors('fetchOrdersError')`

### Paso 2: Agregar traducciones faltantes
1. Actualizar `messages/es/common.json` con tiempo relativo y noRecords
2. Actualizar `messages/en/common.json` con las mismas claves
3. Actualizar `messages/es/errors.json` con fetchOrdersError
4. Actualizar `messages/en/errors.json` con fetchOrdersError

### Paso 3: Verificar sidebar-nav.tsx
1. Revisar que todas las `titleKey` existen en dashboard.json
2. Si falta alguna, agregarla a ambos idiomas

### Paso 4: Auditoría completa
1. Ejecutar `npm run i18n:audit`
2. Identificar todos los textos hardcodeados restantes
3. Crear lista priorizada

### Paso 5: Migración sistemática
1. Migrar textos de prioridad ALTA
2. Probar cada página después de migrar
3. Continuar con prioridad MEDIA y BAJA

## ✅ Checklist de Validación Final

- [ ] orders-panel.tsx funciona sin errores
- [ ] formatRelativeTime muestra tiempos correctos en ambos idiomas
- [ ] Sidebar muestra todos los items correctamente traducidos
- [ ] LanguageSelector cambia todo el texto de la UI
- [ ] Estados de pedidos (Abierto, Preparando, Listo) traducidos
- [ ] Estados de pago (Pendiente, Pagado) traducidos
- [ ] Botones y acciones traducidos (Guardar, Cancelar, Eliminar)
- [ ] Mensajes de error traducidos
- [ ] Validaciones traducidas
- [ ] No hay textos en español cuando idioma = inglés
- [ ] No hay errores en consola del navegador
- [ ] Audit muestra solo 5 strings aceptables

## 📝 Notas Importantes

### ❌ NO HACER:
- No hardcodear strings directamente en componentes
- No usar texto condicional tipo `lang === 'es' ? 'Hola' : 'Hello'`
- No dejar traducciones a medio hacer
- No ignorar el audit script

### ✅ SÍ HACER:
- Usar `useTranslations('namespace')` en todos los componentes cliente
- Pasar traducciones como parámetros a funciones servidor
- Mantener claves organizadas por namespace
- Usar interpolación: `t('key', { variable: value })`
- Probar cada cambio en ambos idiomas
- Mantener paridad 1:1 entre es y en

## 🚀 Resultado Esperado

Al finalizar este plan:
1. **0 errores** en consola del navegador
2. **100% de UI traducible** entre español e inglés
3. **Sidebar correctamente escrito** en ambos idiomas
4. **Estados de pedidos dinámicos** según idioma seleccionado
5. **Tiempos relativos** ("Hace 5 minutos" / "5 minutes ago")
6. **Sistema robusto** listo para agregar más idiomas

---

**Fecha de creación**: Diciembre 1, 2025
**Estado**: 🔴 PENDIENTE DE EJECUCIÓN
**Prioridad**: 🔥 CRÍTICA
