# 🌐 Sistema de Internacionalización (i18n)

> Guía completa de implementación y uso del sistema i18n con next-intl  
> **Última actualización**: Diciembre 1, 2025

---

## 📋 Resumen

El proyecto ahora incluye soporte completo de internacionalización con **next-intl**, permitiendo cambiar entre Español (ES) e Inglés (EN) en toda la aplicación.

### ✅ Características Implementadas

- ✅ Soporte para ES (Español) e EN (English)
- ✅ Detección automática de idioma del navegador
- ✅ Persistencia de preferencia de idioma
- ✅ Server-Side Rendering (SSR) con traducciones
- ✅ Rutas localizadas (opcional: `/en`, `/es`)
- ✅ Selector de idioma en Configuración
- ✅ Formateo de fechas, números y monedas
- ✅ Pluralización automática
- ✅ Namespace organization

---

## 🏗️ Arquitectura

### Estructura de Archivos

```
restaurant-management/
├── app/
│   └── [locale]/              # Layout con locale dinámico
│       └── layout.tsx         # Root layout con NextIntlClientProvider
├── messages/                  # Archivos de traducción
│   ├── en/
│   │   ├── common.json       # Traducciones comunes (botones, labels)
│   │   ├── customer.json     # Traducciones de experiencia cliente
│   │   └── config.json       # Traducciones de configuración
│   └── es/
│       ├── common.json
│       ├── customer.json
│       └── config.json
├── components/
│   └── language-selector.tsx # Selector de idioma
├── lib/
│   └── i18n-navigation.ts    # Helpers de navegación localizados
├── i18n.ts                   # Configuración principal
└── middleware.ts             # Middleware con detección de locale
```

---

## 🚀 Uso Básico

### 1. En Componentes Cliente ("use client")

```tsx
"use client"

import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');
  
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button>{t('save')}</button>
    </div>
  );
}
```

### 2. En Componentes Servidor (Server Components)

```tsx
import { getTranslations } from 'next-intl/server';

export default async function MyPage() {
  const t = await getTranslations('common');
  
  return <h1>{t('welcome')}</h1>;
}
```

### 3. Múltiples Namespaces

```tsx
"use client"

import { useTranslations } from 'next-intl';

export function ConfigPanel() {
  const t = useTranslations('config');
  const tCommon = useTranslations('common');
  
  return (
    <div>
      <h1>{t('configuration')}</h1>
      <button>{tCommon('save')}</button>
    </div>
  );
}
```

### 4. Interpolación de Variables

```tsx
// En messages/es/common.json
{
  "greeting": "Hola, {name}!"
}

// En el componente
const t = useTranslations('common');
<p>{t('greeting', { name: 'Juan' })}</p>
// Output: "Hola, Juan!"
```

### 5. Pluralización

```tsx
// En messages/es/customer.json
{
  "itemCount": "{count, plural, =0 {Sin artículos} one {1 artículo} other {{count} artículos}}"
}

// En el componente
const t = useTranslations('customer');
<p>{t('itemCount', { count: 5 })}</p>
// Output: "5 artículos"
```

---

## 📝 Agregar Nuevas Traducciones

### Paso 1: Agregar clave en ambos idiomas

**messages/es/common.json:**
```json
{
  "newFeature": "Nueva característica",
  "description": "Esta es una descripción"
}
```

**messages/en/common.json:**
```json
{
  "newFeature": "New feature",
  "description": "This is a description"
}
```

### Paso 2: Usar en el componente

```tsx
const t = useTranslations('common');
<div>
  <h2>{t('newFeature')}</h2>
  <p>{t('description')}</p>
</div>
```

---

## 🎨 Selector de Idioma

### Uso del Componente

Ya existe un componente `LanguageSelector` integrado en Configuración:

```tsx
import { LanguageSelector } from "@/components/language-selector"

export function MySettings() {
  return (
    <div>
      <LanguageSelector />
      {/* Resto del contenido */}
    </div>
  )
}
```

El selector:
- Muestra el idioma actual
- Permite cambiar entre ES/EN
- Persiste la preferencia
- Usa transiciones suaves
- Actualiza la URL automáticamente

---

## 🔧 Formateo Avanzado

### Fechas

```tsx
import { useFormatter } from 'next-intl';

export function DateDisplay() {
  const format = useFormatter();
  const date = new Date('2025-12-01');
  
  return (
    <div>
      <p>{format.dateTime(date, { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>
      {/* ES: "1 de diciembre de 2025" */}
      {/* EN: "December 1, 2025" */}
    </div>
  );
}
```

### Números y Monedas

```tsx
import { useFormatter } from 'next-intl';

export function PriceDisplay() {
  const format = useFormatter();
  
  return (
    <div>
      <p>{format.number(1500.50, { 
        style: 'currency', 
        currency: 'ARS' 
      })}</p>
      {/* Output: "$1.500,50" (ES) o "$1,500.50" (EN) */}
    </div>
  );
}
```

### Números con Separadores

```tsx
const format = useFormatter();

<p>{format.number(1234567)}</p>
// ES: "1.234.567"
// EN: "1,234,567"
```

---

## 🗺️ Navegación Localizada

### Link Component

```tsx
import { Link } from '@/lib/i18n-navigation';

export function Navigation() {
  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/configuracion">Configuración</Link>
    </nav>
  );
}
```

El componente `Link` automáticamente:
- Mantiene el locale actual en la URL
- No requiere prefijo `/es` o `/en`
- Funciona igual que `next/link`

### useRouter con i18n

```tsx
import { useRouter } from '@/lib/i18n-navigation';

export function MyComponent() {
  const router = useRouter();
  
  const navigate = () => {
    router.push('/dashboard');
    // Navega a /es/dashboard o /en/dashboard según el locale actual
  };
  
  return <button onClick={navigate}>Ir al Dashboard</button>;
}
```

---

## 🌍 Agregar Nuevo Idioma

### Paso 1: Actualizar `i18n.ts`

```typescript
export const locales = ['en', 'es', 'pt'] as const; // Agregar 'pt'
export type Locale = (typeof locales)[number];
```

### Paso 2: Crear carpeta de traducciones

```
messages/
└── pt/
    ├── common.json
    ├── customer.json
    └── config.json
```

### Paso 3: Agregar traducciones

Copia y traduce los archivos de `messages/es/` a `messages/pt/`.

### Paso 4: Actualizar selector de idioma

```tsx
// components/language-selector.tsx
const LANGUAGE_OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' }, // Nuevo
]
```

---

## 🎯 Best Practices

### ✅ DO

- **Usar namespaces**: Organiza traducciones por feature (`common`, `customer`, `config`)
- **Claves descriptivas**: `restaurantNameRequired` en vez de `error1`
- **Mantener sincronizados**: Cada clave debe existir en todos los idiomas
- **Interpolación de variables**: `{name}` en vez de concatenación
- **Pluralización ICU**: Usa sintaxis ICU para plurales
- **Traducciones completas**: Incluye descripciones, tooltips, mensajes de error

### ❌ DON'T

- **No hardcodear texto**: `"Guardar"` → `t('save')`
- **No concatenar strings**: `"Hola " + name` → `t('greeting', {name})`
- **No duplicar claves**: Reutiliza traducciones comunes
- **No mezclar idiomas**: Una página completamente en un idioma
- **No olvidar labels**: Botones, inputs, placeholders deben estar traducidos

---

## 🧪 Testing

### Test de Traducciones

```tsx
import { NextIntlClientProvider } from 'next-intl';
import { render } from '@testing-library/react';
import messages from '@/messages/en/common.json';

test('renders translated text', () => {
  const { getByText } = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <MyComponent />
    </NextIntlClientProvider>
  );
  
  expect(getByText('Save')).toBeInTheDocument();
});
```

---

## 📊 Cobertura Actual

### ✅ Traducido Completo

- `components/configuration-panel.tsx` - Panel de configuración
- `components/language-selector.tsx` - Selector de idioma
- Toast messages (guardado, errores)
- Validaciones de formulario

### 🚧 Pendiente de Traducir

- `app/(public)/qr/[tableId]/page.tsx` - Experiencia cliente QR
- `components/menu-item-dialog.tsx` - Diálogos de menú
- `components/orders-panel.tsx` - Panel de pedidos
- `components/salon-zones-panel.tsx` - Panel de salón
- Resto de componentes del dashboard

---

## 🔄 Migración desde Provider Casero

Si encuentras código usando el provider anterior (`useI18n`), migra así:

### Antes (Provider casero)
```tsx
import { useI18n } from '@/contexts/i18n-context';

const { t } = useI18n();
<button>{t('common.save')}</button>
```

### Después (next-intl)
```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('common');
<button>{t('save')}</button>
```

**Nota**: El provider casero (`contexts/i18n-context.tsx`) ya no se usa y puede eliminarse.

---

## 📚 Recursos

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [ICU Message Format](https://formatjs.io/docs/core-concepts/icu-syntax/)
- [ISO 639-1 Language Codes](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)

---

## 🐛 Troubleshooting

### Error: "useTranslations must be used within NextIntlClientProvider"

**Solución**: Asegúrate de que el componente esté dentro del layout `[locale]`.

### Traducciones no aparecen

1. Verifica que la clave existe en `messages/{locale}/{namespace}.json`
2. Confirma que el namespace es correcto: `useTranslations('common')`
3. Revisa la consola por errores de sintaxis JSON

### Locale no cambia al usar el selector

1. Verifica que `middleware.ts` esté configurado correctamente
2. Confirma que `i18n.ts` incluye el locale
3. Limpia cache del navegador y reinicia dev server

---

**Última actualización**: Diciembre 1, 2025  
**Versión**: 1.0  
**Mantenedor**: [@AlvaFG](https://github.com/AlvaFG)
