# 🌍 Plan Integral de Internacionalización (i18n) - Sistema Bilingüe ES/EN

## 📋 Objetivo Principal

Agregar soporte completo de internacionalización (i18n) con opción de cambiar idioma (Inglés / Español) mediante un selector persistente, cubriendo: UI, validaciones, mensajes de error, textos de negocio, datos semánticos y futuras extensiones (analytics, notificaciones, integraciones).

---

## 🔍 Fase 1: Análisis y Preparación

### Inventario de Textos Hardcoded
- Auditar todos los componentes con texto hardcoded:
  - `components/` - Componentes de UI
  - `app/*/` - Páginas y rutas
  - `lib/` - Lógica de negocio
  - Toasts y notificaciones
  - Mensajes de error

### Clasificación de Mensajes
Separar en categorías/namespaces:
- **common**: Botones, acciones, estados genéricos
- **customer**: Flujo QR (menú, carrito, checkout, confirmación)
- **dashboard**: Panel interno (pedidos, staff, mesas, zonas)
- **config**: Ajustes y configuración
- **auth**: Login, registro, recuperación
- **errors**: Mensajes de excepciones
- **validations**: Reglas de formularios
- **analytics**: KPIs, gráficos, datos

### Decisiones Clave
- **Estrategia**: Namespaces por dominio
- **Carga**: Server-side (lazy) + client hydration con next-intl (App Router)
- **Persistencia de idioma**: localStorage + cookie (para middleware) con fallback a navegador
- **Formatos regionales**: es-AR / en-US (fechas, moneda, pluralización)
- **Fallback**: Si clave no existe → log de diagnóstico + mostrar `[missing:key]`

---

## 🏗️ Fase 2: Infraestructura Técnica

### Instalación y Configuración
```bash
npm install next-intl
```

### Middleware
Añadir `intlMiddleware` (detección de locale) antes de auth; asegurar orden correcto:
```typescript
// middleware.ts
import createIntlMiddleware from 'next-intl/middleware';

const intlMiddleware = createIntlMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'es',
  localePrefix: 'never' // Sin prefijo en URL
});

export default async function middleware(request: NextRequest) {
  // 1. Primero intl
  const intlResponse = intlMiddleware(request);
  
  // 2. Luego auth
  // ... supabase auth logic
  
  return response;
}
```

### Provider Híbrido
Crear `I18nProvider` que envuelva `NextIntlClientProvider`:
```typescript
// contexts/i18n-context.tsx
export function I18nProvider({ children }) {
  const [locale, setLocale] = useState<Locale>(() => {
    // 1. localStorage
    // 2. navigator.language
    // 3. default 'es'
  });
  
  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      <NextIntlClientProvider 
        locale={locale} 
        messages={messages[locale]}
        timeZone="America/Argentina/Buenos_Aires"
      >
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  );
}
```

### Estructura de Archivos
```
messages/
├── en/
│   ├── common.json
│   ├── customer.json
│   ├── dashboard.json
│   ├── config.json
│   ├── auth.json
│   ├── errors.json
│   ├── validations.json
│   └── analytics.json
└── es/
    ├── common.json
    ├── customer.json
    ├── dashboard.json
    ├── config.json
    ├── auth.json
    ├── errors.json
    ├── validations.json
    └── analytics.json
```

### Convención de Claves
- **Formato**: lowerCamelCase
- **Sin repetir namespace**: `addToCart` (NO `customer.addToCart` dentro del JSON)
- **Variables**: `{count}`, `{name}`, `{minutes}` para interpolación

### Tipado (Opcional)
Generar tipo inferido de claves usando script que lee JSON y produce `.d.ts`

---

## 🔄 Fase 3: Migración de Contenido

### Patrón de Reemplazo

**Antes:**
```tsx
<Button>Guardar cambios</Button>
<p>No hay pedidos disponibles</p>
```

**Después:**
```tsx
const t = useTranslations('common');
<Button>{t('saveChanges')}</Button>

const tDashboard = useTranslations('dashboard');
<p>{tDashboard('noOrdersAvailable')}</p>
```

### Prioridades de Migración (Orden Recomendado)

1. **Flujo QR** (impacto usuario final)
   - page.tsx, header, tabs, search, item card, cart, checkout, confirmation
   
2. **Configuración / Branding**
   - ConfigurationPanel, LanguageSelector
   
3. **Login / Auth / Roles**
   - LoginForm, ProtectedRoute, mensajes de autenticación
   
4. **Dashboard**
   - Pedidos, mesas, menú, zonas, usuarios
   
5. **Notificaciones / Toasts / Errores**
   - useToast, Alert, error boundaries
   
6. **Validaciones de Formularios**
   - Zod schemas, validaciones inline
   
7. **Analytics / Métricas / Tooltips**
   - AnalyticsDashboard, tooltips informativos

### Pluralización y Variables

```json
// messages/es/common.json
{
  "itemsCount": "{count, plural, =0 {Sin items} =1 {1 item} other {# items}}",
  "minutesAgo": "Hace {minutes} min",
  "tableNumber": "Mesa {number}"
}
```

```tsx
t('itemsCount', { count: 5 }); // "5 items"
t('minutesAgo', { minutes: 15 }); // "Hace 15 min"
```

### Glosario de Terminología

Crear `docs/I18N_GLOSARIO.md` con términos unificados:
- Pedido → Order
- Mesa → Table
- Zona → Zone
- Disponible → Available
- Activo → Active
- Staff → Staff
- Cliente → Customer

---

## 📦 Fase 4: Nuevos Namespaces y Claves

### common.json
Botones, acciones, estados genéricos:
```json
{
  "save": "Guardar",
  "cancel": "Cancelar",
  "delete": "Eliminar",
  "edit": "Editar",
  "confirm": "Confirmar",
  "loading": "Cargando...",
  "error": "Error",
  "success": "Éxito",
  "retry": "Reintentar",
  "back": "Volver",
  "next": "Siguiente",
  "close": "Cerrar"
}
```

### customer.json
Flujo QR completo:
```json
{
  "addToCart": "Agregar al carrito",
  "checkout": "Finalizar pedido",
  "orderConfirmed": "¡Pedido confirmado!",
  "table": "Mesa",
  "minutes": "minutos",
  "sendingOrder": "Enviando pedido...",
  "total": "Total",
  "cart": "Carrito",
  "emptyCart": "El carrito está vacío"
}
```

### dashboard.json
Panel interno completo:
```json
{
  "orders": "Pedidos",
  "staffManagement": "Gestión de personal",
  "zonesManagement": "Gestión de zonas",
  "menuItems": "Items del menú",
  "active": "Activo",
  "inactive": "Inactivo",
  "tables": "Mesas",
  "analytics": "Analítica"
}
```

### config.json
Configuración:
```json
{
  "generalSettings": "Configuración general",
  "language": "Idioma",
  "theme": "Tema",
  "notifications": "Notificaciones",
  "brandSettings": "Configuración de marca"
}
```

### auth.json
Autenticación:
```json
{
  "loginTitle": "Iniciar sesión",
  "emailPlaceholder": "Correo electrónico",
  "passwordPlaceholder": "Contraseña",
  "forgotPassword": "¿Olvidaste tu contraseña?",
  "login": "Iniciar sesión",
  "logout": "Cerrar sesión"
}
```

### errors.json
Mensajes de error estandarizados:
```json
{
  "serverError": "Error del servidor. Intenta nuevamente.",
  "notFound": "No encontrado",
  "unauthorized": "No autorizado",
  "forbidden": "Acceso denegado",
  "timeout": "Tiempo de espera agotado",
  "networkError": "Error de conexión"
}
```

### validations.json
Validaciones de formularios:
```json
{
  "required": "Este campo es requerido",
  "invalidEmail": "Correo electrónico inválido",
  "minChars": "Mínimo {min} caracteres",
  "maxChars": "Máximo {max} caracteres",
  "passwordMismatch": "Las contraseñas no coinciden",
  "invalidFormat": "Formato inválido"
}
```

### analytics.json
KPIs y métricas:
```json
{
  "dailySales": "Ventas diarias",
  "averageTicket": "Ticket promedio",
  "occupancyRate": "Tasa de ocupación",
  "topDishes": "Platos más vendidos",
  "preparationTimes": "Tiempos de preparación"
}
```

---

## 🎛️ Fase 5: Selector de Idioma

### Ubicación
- Panel de configuración (principal)
- Acceso rápido en sidebar/topbar (opcional)

### Implementación
```tsx
// components/language-selector.tsx
export function LanguageSelector() {
  const { locale, setLocale } = useI18n();
  
  const handleChange = (newLocale: Locale) => {
    // 1. Actualizar contexto
    setLocale(newLocale);
    
    // 2. Guardar en localStorage
    localStorage.setItem('locale', newLocale);
    
    // 3. Opcional: refresh
    router.refresh();
  };
  
  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger aria-label="Cambiar idioma / Change language">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="es">🇪🇸 Español</SelectItem>
        <SelectItem value="en">🇺🇸 English</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### Persistencia
```typescript
// 1. localStorage
localStorage.setItem('locale', value);

// 2. Cookie (para middleware)
document.cookie = `NEXT_LOCALE=${value}; path=/; max-age=31536000`;

// 3. Fallback a navegador
const browserLang = navigator.language.startsWith('en') ? 'en' : 'es';
```

### Accesibilidad
- `aria-label="Cambiar idioma"` / `"Change language"`
- Mostrar idioma destino en botones: "ES | EN"
- Indicador visual del idioma actual

---

## ✅ Fase 6: Validaciones y Mensajes de Error

### Reemplazo en Validaciones

**Antes:**
```typescript
if (!name) {
  return "Este campo es requerido";
}
```

**Después:**
```typescript
const t = useTranslations('validations');
if (!name) {
  return t('required');
}
```

### Esquemas Zod (si aplica)
```typescript
import { useTranslations } from 'next-intl';

const schema = z.object({
  email: z.string().email(t('validations.invalidEmail')),
  password: z.string().min(8, t('validations.minChars', { min: 8 }))
});
```

### Mensajes Estandarizados
- **required**: Campo requerido
- **minLength**: Mínimo X caracteres
- **maxLength**: Máximo X caracteres
- **invalidEmail**: Email inválido
- **passwordMismatch**: Contraseñas no coinciden
- **unauthorized**: No autorizado
- **forbidden**: Acceso denegado
- **notFound**: No encontrado
- **serverError**: Error del servidor

### Logging de Claves Faltantes
```typescript
// lib/i18n-utils.ts
export function safeTranslate(key: string, fallback: string) {
  try {
    return t(key);
  } catch (error) {
    console.warn(`[i18n] Missing key: ${key}`);
    return fallback || `[missing:${key}]`;
  }
}
```

---

## 📊 Fase 7: Datos Dinámicos y Formatos

### Centralizar Formateadores

```typescript
// lib/format.ts
export function formatDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

export function formatCurrency(cents: number, locale: Locale) {
  const currency = locale === 'es' ? 'ARS' : 'USD';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(cents / 100);
}

export function formatNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, {
    notation: 'compact'
  }).format(value);
}
```

### Uso en Componentes
```tsx
const { locale } = useI18n();
const date = formatDate(order.createdAt, locale);
const price = formatCurrency(order.totalCents, locale);
```

### Ordenamiento Alfabético
```typescript
// Antes
items.sort((a, b) => a.name.localeCompare(b.name, 'es'));

// Después
items.sort((a, b) => a.name.localeCompare(b.name, locale));
```

---

## 🧪 Fase 8: QA y Verificación

### Checklist de Validación

- [ ] Sin textos residuales en español cuando está en inglés (y viceversa)
- [ ] Todos los toasts/alerts usan traducciones
- [ ] Formularios muestran validaciones localizadas
- [ ] Formatos de fecha y moneda cambian según idioma
- [ ] Selector de idioma persiste la selección
- [ ] Navegación funcional en ambos idiomas
- [ ] Textos de error traducidos
- [ ] Tooltips y ayudas contextuales traducidos
- [ ] Notificaciones push traducidas (si aplica)
- [ ] Emails automáticos traducidos (si aplica)

### Script de Auditoría

```bash
# Buscar textos en español residuales
grep -R "Pedido\|Mesa\|Zona\|Guardar\|Usuario\|Eliminar" components/ app/ --include="*.tsx" --include="*.ts" -n

# Buscar toasts sin traducción
grep -R "toast({" components/ app/ -A 2 | grep -v "t("

# Buscar validaciones hardcoded
grep -R "return \"" lib/validators/ -n
```

### Testing Visual
- Modo snapshot visual con Playwright/Storybook
- Capturar pantallas en ambos locales
- Comparar layouts y overflow de textos
- Validar RTL si se planea soporte futuro (árabe, hebreo)

---

## ⚡ Fase 9: Performance y Optimización

### Carga Selectiva de Namespaces
```typescript
// Solo cargar lo necesario por página
// app/pedidos/page.tsx
export default async function OrdersPage() {
  const messages = await import(`@/messages/${locale}/dashboard.json`);
  // ...
}
```

### Limitar Tamaño de JSON
- Mantener cada namespace < 20KB
- Dividir si crece demasiado (ej: dashboard-orders.json, dashboard-staff.json)

### Pre-carga en Layout Compartido
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  // Pre-cargar common en layout raíz
  return (
    <I18nProvider messages={{ common: commonMessages }}>
      {children}
    </I18nProvider>
  );
}
```

### Reducción de Duplicados
- Reutilizar claves de `common` antes de crear específicas
- Ejemplo: usar `common.save` en lugar de `dashboard.saveOrder`

---

## 👥 Fase 10: Flujo de Contribución

### Agregar Nueva Clave

1. **Crear clave en ambos idiomas**:
   ```json
   // messages/es/dashboard.json
   "newFeature": "Nueva función"
   
   // messages/en/dashboard.json
   "newFeature": "New feature"
   ```

2. **Actualizar glosario** si es término de negocio

3. **Usar en componente**:
   ```tsx
   const t = useTranslations('dashboard');
   <span>{t('newFeature')}</span>
   ```

### PR Checklist
- [ ] ¿Agregaste la clave en EN y ES?
- [ ] ¿Probaste ambos locales?
- [ ] ¿Actualizaste el glosario si es término nuevo?
- [ ] ¿Sin textos hardcoded?
- [ ] ¿Formatos de fecha/moneda correctos?

### Automatización (Pre-commit Hook)
```bash
#!/bin/bash
# .husky/pre-commit

# Validar claves en sync
node scripts/validate-i18n.js

# Buscar hardcoded
if git diff --cached --name-only | grep -E '\.(tsx|ts)$' | xargs grep -l "Pedido\|Mesa"; then
  echo "❌ Textos hardcoded encontrados. Usa traducciones."
  exit 1
fi
```

---

## ⚠️ Fase 11: Riesgos y Mitigaciones

### Riesgo 1: Claves Faltantes
**Mitigación**: 
- Fallback explícito `[missing:key]`
- Script auditor ejecutado en CI/CD
- Logging en desarrollo

### Riesgo 2: Desalineación de Tono
**Mitigación**:
- Glosario centralizado
- Guía de estilo por idioma
- Revisión por hablante nativo

### Riesgo 3: Crecimiento Desordenado
**Mitigación**:
- Namespaces estrictos por dominio
- Revisar tamaño de JSON en PR
- Refactor periódico

### Riesgo 4: Refactors que Rompen Claves
**Mitigación**:
- Generar tipos de claves
- Usar TypeScript estricto
- Tests de snapshot de traducciones

### Riesgo 5: Formatos Inconsistentes
**Mitigación**:
- Formateadores centralizados
- Tests unitarios para formateo
- Documentación clara

---

## 📦 Fase 12: Entregables Finales

### Archivos de Mensajes
```
messages/
├── en/ (8 archivos JSON)
└── es/ (8 archivos JSON)
```

### Documentación
1. **Glosario**: `docs/I18N_GLOSARIO.md`
2. **Guía técnica**: `docs/I18N_GUIDE.md`
3. **Guía de estilo**: `docs/I18N_STYLE_GUIDE.md`

### Scripts
1. **Auditor de claves**: `scripts/audit-i18n.js`
2. **Validador de sync**: `scripts/validate-i18n.js`
3. **Generador de tipos**: `scripts/generate-i18n-types.js`

### Componentes
- `LanguageSelector` funcional y accesible
- `I18nProvider` híbrido
- Middleware integrado

---

## 🎯 Claves Críticas (Ejemplos Base)

### common.json
```json
{
  "save": "Guardar",
  "cancel": "Cancelar",
  "delete": "Eliminar",
  "edit": "Editar",
  "confirm": "Confirmar",
  "loading": "Cargando...",
  "error": "Error",
  "success": "Éxito",
  "retry": "Reintentar",
  "back": "Volver",
  "next": "Siguiente",
  "close": "Cerrar",
  "search": "Buscar",
  "filter": "Filtrar",
  "refresh": "Actualizar"
}
```

### validations.json
```json
{
  "required": "Este campo es requerido",
  "invalidEmail": "Correo electrónico inválido",
  "minChars": "Mínimo {min} caracteres",
  "maxChars": "Máximo {max} caracteres",
  "passwordMismatch": "Las contraseñas no coinciden",
  "invalidFormat": "Formato inválido"
}
```

### customer.json
```json
{
  "addToCart": "Agregar al carrito",
  "checkout": "Finalizar pedido",
  "orderConfirmed": "¡Pedido confirmado!",
  "table": "Mesa",
  "minutes": "minutos",
  "sendingOrder": "Enviando pedido...",
  "total": "Total",
  "cart": "Carrito",
  "emptyCart": "El carrito está vacío"
}
```

### dashboard.json
```json
{
  "orders": "Pedidos",
  "staffManagement": "Gestión de personal",
  "zonesManagement": "Gestión de zonas",
  "menuItems": "Items del menú",
  "active": "Activo",
  "inactive": "Inactivo",
  "tables": "Mesas",
  "analytics": "Analítica"
}
```

### auth.json
```json
{
  "loginTitle": "Iniciar sesión",
  "emailPlaceholder": "Correo electrónico",
  "passwordPlaceholder": "Contraseña",
  "forgotPassword": "¿Olvidaste tu contraseña?",
  "login": "Iniciar sesión",
  "logout": "Cerrar sesión"
}
```

### errors.json
```json
{
  "serverError": "Error del servidor. Intenta nuevamente.",
  "notFound": "No encontrado",
  "unauthorized": "No autorizado",
  "forbidden": "Acceso denegado",
  "timeout": "Tiempo de espera agotado",
  "networkError": "Error de conexión"
}
```

---

## 🔍 Script Auditor (Ejemplo)

```javascript
// scripts/audit-i18n.js
const fs = require('fs');
const path = require('path');

const hardcodedPatterns = [
  /Pedido/g,
  /Mesa/g,
  /Guardar/g,
  /Eliminar/g,
  /Usuario/g,
  /Zona/g
];

function scanDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  files.forEach(file => {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      scanDirectory(fullPath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      hardcodedPatterns.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
          console.log(`❌ ${fullPath}: ${matches.length} coincidencias de ${pattern}`);
        }
      });
    }
  });
}

console.log('🔍 Auditando textos hardcoded...\n');
scanDirectory('./components');
scanDirectory('./app');
console.log('\n✅ Auditoría completada');
```

**Uso:**
```bash
node scripts/audit-i18n.js
```

---

## ✅ Definition of Done (DoD)

### Criterios de Finalización

- [ ] **100% páginas sin hardcoded** en ninguno de los dos idiomas
- [ ] **Todos los flujos funcionales** en EN y ES sin romper navegabilidad
- [ ] **Informes de auditoría** sin coincidencias conocidas
- [ ] **Selector de idioma** implementado y accesible
- [ ] **Persistencia** funcionando (localStorage + cookie)
- [ ] **Formateadores centralizados** implementados
- [ ] **Validaciones traducidas** en todos los formularios
- [ ] **Mensajes de error** estandarizados y traducidos
- [ ] **Documentación creada** (glosario, guía técnica)
- [ ] **Scripts de auditoría** funcionales
- [ ] **Tests** cubriendo ambos idiomas
- [ ] **Performance** validada (sin overhead significativo)

---

## 🚀 Prompt Reutilizable (Copiar y Ejecutar)

```
Quiero que adaptes todo el sistema a soporte bilingüe (Español/Inglés) usando next-intl con namespaces por dominio: common, customer, dashboard, config, auth, errors, validations, analytics.

1) Audita componentes y rutas para detectar texto hardcoded
2) Crea/actualiza archivos messages/{locale}/{namespace}.json
3) Implementa provider híbrido con persistencia localStorage + cookie + fallback navegador
4) Migra progresivamente: flujo QR → configuración → auth → dashboard → staff → zonas → analítica
5) Reemplaza validaciones y errores con claves
6) Implementa selector de idioma accesible
7) Añade formateadores centralizados para fecha, moneda y pluralización
8) Crea script auditor para detectar cadenas residuales
9) Genera tipos inferidos opcionalmente para claves
10) Entrega glosario y guía técnica

Definition of Done: cero textos hardcoded, ambos idiomas funcionales, documentación creada, auditor sin pendientes.

Mantén claves en camelCase y evita duplicados. Reporta progreso por fases y bloquea si falta contexto crítico.
```

---

## 📚 Referencias

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Intl API (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [i18n Best Practices](https://www.i18next.com/principles/best-practices)
- [WCAG Internationalization Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html)

---

## 🎓 Próximos Pasos (Extensiones Futuras)

1. **Más idiomas**: Portugués, Francés
2. **RTL Support**: Árabe, Hebreo
3. **Traducción automática**: Integración con DeepL/Google Translate para borradores
4. **CMS para traducciones**: Interfaz web para gestionar claves sin tocar código
5. **A/B Testing**: Probar variantes de textos por idioma
6. **Localización de imágenes**: Diferentes assets según idioma
7. **SEO multiidioma**: Hreflang tags, sitemaps por idioma

---

**Documento creado**: Diciembre 2024  
**Última actualización**: Diciembre 2024  
**Versión**: 1.0
