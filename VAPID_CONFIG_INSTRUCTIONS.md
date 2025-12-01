# 🔐 VAPID Keys - Configuración Supabase

## Paso 2: Configurar Secrets en Supabase Edge Functions

### 1. Ve a Supabase Dashboard
- URL: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/functions

### 2. Ve a la sección "Edge Functions" → "Secrets"

### 3. Agrega estas 3 secrets (una por una):

**Secret 1:**
```
Name: VAPID_PUBLIC_KEY
Value: BKORfBnXIOdwwVDR46_GoJ11qimcOJeqaSiMCsOK9iOrDXAp3yv2GDLPLQdkD_UKOx7O_0RCew36lw7PaqPcV2w
```

**Secret 2:**
```
Name: VAPID_PRIVATE_KEY
Value: rdjeSK3YYZFjYInI2PXACmdjSiBM4W85qKKExOmKTx0
```

**Secret 3:**
```
Name: VAPID_SUBJECT
Value: mailto:tu-email@restaurant.com
```
*(Cambia "tu-email@restaurant.com" por tu email real)*

---

## Paso 3: Agregar a .env.local

Agrega esta línea a tu archivo `.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BKORfBnXIOdwwVDR46_GoJ11qimcOJeqaSiMCsOK9iOrDXAp3yv2GDLPLQdkD_UKOx7O_0RCew36lw7PaqPcV2w
```

---

## ⚠️ IMPORTANTE
- NO compartas las VAPID keys públicamente
- NO comitees este archivo a git (ya está en .gitignore)
- Guarda backup de vapid-keys.json en lugar seguro

---

## ✅ Verificación
Una vez configurado, puedes verificar que funciona ejecutando:
```bash
# Desplegar la Edge Function
npx supabase functions deploy send-push
```

O probar manualmente desde el código frontend con el hook `usePushNotifications`.
