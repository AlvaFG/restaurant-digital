# 🌍 Internacionalización (i18n) - Quick Start

## 🚀 Inicio Rápido

### Cambiar Idioma en la Aplicación

1. Inicia sesión en el sistema
2. Ve a **Configuración** en el menú lateral
3. Busca la sección **"Idioma / Language"**
4. Selecciona tu idioma preferido:
   - 🇪🇸 **Español**
   - 🇺🇸 **English**

Tu preferencia se guardará automáticamente y se aplicará en toda la aplicación.

---

## 👨‍💻 Para Desarrolladores

### Usar Traducciones en un Componente

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function MyComponent() {
  // Obtener traductor para un namespace
  const t = useTranslations('common');
  
  return (
    <div>
      <button>{t('save')}</button>
      <button>{t('cancel')}</button>
      <p>{t('loading')}</p>
    </div>
  );
}
```

### Usar Múltiples Namespaces

```tsx
export function OrderPanel() {
  const tCommon = useTranslations('common');
  const tDashboard = useTranslations('dashboard');
  const tCustomer = useTranslations('customer');
  
  return (
    <div>
      <h1>{tDashboard('orders')}</h1>
      <button>{tCommon('add')}</button>
      <p>{tCustomer('emptyCart')}</p>
    </div>
  );
}
```

### Interpolación de Variables

```tsx
const t = useTranslations('customer');

// Con variables
<p>{t('tableNumber', { number: 5 })}</p>
// Output: "Mesa 5" (ES) o "Table 5" (EN)

// Con pluralización
<p>{t('itemsCount', { count: items.length })}</p>
// Output: "0 items", "1 item", "5 items"
```

### Formatear Fechas y Moneda

```tsx
import { formatCurrency, formatDate, formatNumber } from '@/lib/format';
import { useI18n } from '@/contexts/i18n-context';

export function OrderSummary({ order }) {
  const { locale } = useI18n();

  return (
    <div>
      {/* Moneda formateada según locale */}
      <p>Total: {formatCurrency(order.totalCents, locale)}</p>
      {/* ES: $15,50 (ARS) | EN: $15.50 (USD) */}
      
      {/* Fecha formateada */}
      <p>Fecha: {formatDate(order.createdAt, locale)}</p>
      {/* ES: 15 dic 2024, 14:30 | EN: Dec 15, 2024, 2:30 PM */}
      
      {/* Números con separadores correctos */}
      <p>Items: {formatNumber(order.itemCount, locale)}</p>
      {/* ES: 1.234 | EN: 1,234 */}
    </div>
  );
}
```

### Obtener Locale Actual

```tsx
import { useI18n } from '@/contexts/i18n-context';
import { useLocale } from 'next-intl';

export function MyComponent() {
  // Opción 1: Desde contexto
  const { locale, setLocale } = useI18n();
  
  // Opción 2: Desde next-intl
  const currentLocale = useLocale();
  
  return <p>Idioma actual: {locale}</p>;
}
```

---

## 📁 Namespaces Disponibles

| Namespace | Uso | Ejemplos |
|-----------|-----|----------|
| `common` | Textos comunes y genéricos | save, cancel, delete, loading |
| `customer` | Flujo público QR | addToCart, checkout, emptyCart |
| `dashboard` | Panel de administración | orders, tables, zones, menu |
| `config` | Configuración | settings, language, theme |
| `auth` | Autenticación | login, logout, password |
| `errors` | Mensajes de error | serverError, notFound |
| `validations` | Validaciones | required, invalidEmail |
| `analytics` | Analítica | sales, revenue, reports |

---

## 🔍 Auditar Textos Hardcoded

Ejecuta el auditor para encontrar textos que necesitan ser traducidos:

```bash
npm run i18n:audit
```

Esto te mostrará:
- Archivos con textos hardcoded
- Ubicación exacta (líneas)
- Total de issues a resolver

---

## ➕ Agregar Nueva Traducción

### 1. Determina el namespace correcto

- ¿Es texto común? → `common.json`
- ¿Es del flujo QR? → `customer.json`
- ¿Es del dashboard? → `dashboard.json`
- ¿Es de configuración? → `config.json`

### 2. Agrega la clave en AMBOS idiomas

```json
// messages/es/common.json
{
  "newKey": "Nuevo texto en español"
}

// messages/en/common.json
{
  "newKey": "New text in English"
}
```

### 3. Usa la clave en tu componente

```tsx
const t = useTranslations('common');
<span>{t('newKey')}</span>
```

---

## 🎯 Mejores Prácticas

### ✅ HACER

```tsx
// ✅ Usar traductor
const t = useTranslations('common');
<button>{t('save')}</button>

// ✅ Usar formateadores
formatCurrency(price, locale)

// ✅ Reutilizar claves comunes
t('save') // en lugar de crear 'saveOrder', 'saveTable', etc.
```

### ❌ NO HACER

```tsx
// ❌ Hardcodear texto
<button>Guardar</button>

// ❌ Formatear manualmente
const price = `$${(cents / 100).toFixed(2)}`;

// ❌ Duplicar claves
// Si common.save existe, NO crear dashboard.saveOrder
```

---

## 📖 Documentación Completa

Para más información detallada:

- **[I18N_GUIDE.md](./I18N_GUIDE.md)** - Guía técnica completa
- **[I18N_GLOSARIO.md](./I18N_GLOSARIO.md)** - Glosario de términos ES↔EN
- **[PLAN_I18N_COMPLETO.md](./PLAN_I18N_COMPLETO.md)** - Plan maestro de implementación
- **[I18N_IMPLEMENTATION_SUMMARY.md](./I18N_IMPLEMENTATION_SUMMARY.md)** - Resumen ejecutivo

---

## 🆘 Troubleshooting

### Las traducciones no se actualizan

**Solución:** Refrescar después de cambiar idioma
```tsx
setLocale('en');
router.refresh();
```

### Clave no encontrada

**Solución:** Verificar que existe en ambos idiomas
```bash
grep -r "missingKey" messages/
```

### Formato incorrecto de fecha

**Solución:** Usar funciones de `lib/format.ts`
```tsx
// ❌ Incorrecto
new Date().toLocaleDateString()

// ✅ Correcto
formatDate(new Date(), locale)
```

---

## 📊 Estado Actual

### ✅ Completado
- Infraestructura completa de i18n
- 8 namespaces con 500+ traducciones
- Formateadores centralizados
- Selector de idioma funcional
- Documentación completa

### 🚧 En Progreso
- Migración de componentes existentes
- ~30 textos hardcoded identificados
- Tests de integración

---

## 🔗 Links Útiles

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Intl API (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

---

**¿Preguntas?** Consulta la documentación completa o contacta al equipo de desarrollo.
