# 🍽️ Plan de Experiencia del Cliente Final
## Restaurant Management System

> **Documento de diseño**: Mejoras centradas en la experiencia del consumidor final  
> **Fecha**: Noviembre 3, 2025  
> **Versión**: 1.0  
> **Estado**: 📋 Planificación

---

## 📊 Situación Actual

### ✅ Lo que ya tenemos
- Sistema QR funcional para escanear y acceder al menú
- Catálogo de menú digital con categorías
- Carrito de compras básico
- Sistema de validación de sesiones
- Búsqueda de items en el menú

### ⚠️ Oportunidades de mejora
- **Experiencia visual limitada**: Sin imágenes de platos, UI básica
- **Falta de interacción**: No hay feedback del estado del pedido
- **Pago básico**: Sin opciones de dividir cuenta o propinas
- **Sin engagement**: No hay razón para que el cliente vuelva
- **Comunicación limitada**: No pueden llamar al mesero desde la app
- **Sin personalización**: Experiencia genérica, no memorable

---

## 🎯 Objetivos

### Objetivo Principal
**Transformar la experiencia del cliente en una ventaja competitiva** que aumente:
- ✨ **Satisfacción**: Net Promoter Score (NPS) > 70
- 💰 **Ticket promedio**: +15% por upselling inteligente
- 🔄 **Retención**: 40% de clientes recurrentes en 3 meses
- ⚡ **Velocidad de servicio**: -30% en tiempo de espera percibido
- ⭐ **Reviews**: +25% de reviews positivas online

### Objetivos Secundarios
- Reducir carga de trabajo del staff (meseros)
- Recolectar datos de preferencias del cliente
- Facilitar cross-selling y upselling
- Crear experiencias memorables y compartibles

---

## 🎨 Propuesta de Features

### 📱 Fase 1: Foundation (2-3 semanas)

#### 1.1 Pantalla de Bienvenida Personalizada 🌟
**Problema**: El cliente escanea el QR y va directo al menú sin contexto.

**Solución**:
```
┌─────────────────────────┐
│   [LOGO RESTAURANTE]    │
│                         │
│   "¡Bienvenido a        │
│    La Buena Mesa!"      │
│                         │
│   Mesa 12 - Zona Patio  │
│                         │
│   Tu mesero: Carlos     │
│                         │
│ [Comenzar a Ordenar] ⬇ │
└─────────────────────────┘
```

**Features**:
- Branding personalizado (logo, colores, font del restaurante)
- Información de la mesa y zona
- Nombre del mesero asignado (si aplica)
- Mensaje de bienvenida customizable
- WiFi password visible
- Plato especial del día destacado
- Animación de entrada suave

**Métricas**:
- Tiempo en pantalla de bienvenida < 3s
- Click-through rate > 95%

---

#### 1.2 Menú Visual Enhanced 📸
**Problema**: Los clientes necesitan ver los platos para decidir.

**Solución**:
```typescript
// Modelo de datos actualizado
interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  images: string[]  // Array de URLs
  imageAlt?: string
  video?: string    // URL opcional de video corto
  
  // Metadatos visuales
  badges: ('popular' | 'nuevo' | 'recomendado' | 'vegetariano')[]
  dietaryInfo: DietaryInfo
  preparationTime: number  // minutos
  spicyLevel?: 1 | 2 | 3
  
  // Social proof
  rating?: number  // 1-5 estrellas
  reviewCount?: number
  ordersThisWeek?: number
}
```

**UI Features**:
- Cards con imagen destacada (ratio 16:9)
- Vista de galería si hay múltiples imágenes
- Badges visuales: 🔥 Popular, ✨ Nuevo, 👨‍🍳 Chef's Choice
- Íconos de dieta: 🌱 Vegano, 🥛 Sin lactosa, 🌾 Sin gluten
- Nivel de picante visual: 🌶️ 🌶️🌶️ 🌶️🌶️🌶️
- Timer de preparación: ⏱️ "Listo en ~15 min"
- Rating con estrellas si disponible

**Filters & Sort**:
- Filtrar por alérgenos (con chips visuales)
- Filtrar por tipo de dieta
- Ordenar por: Popular, Precio, Tiempo prep, Rating
- Vista compacta / Vista con imágenes grandes

**Métricas**:
- Tasa de conversión (ver → agregar al carrito) > 35%
- Items por orden > 2.5

---

#### 1.3 Recomendaciones Inteligentes 🤖
**Problema**: Los clientes no saben qué pedir o se pierden opciones.

**Solución**:

**1. Slider "Para ti"** (personalizado por hora/clima/historial):
```
┌────────────────────────────┐
│  🌟 Recomendado para ti    │
├────────────────────────────┤
│ ←  [🍕] [🍝] [🥗] [🍰]  → │
└────────────────────────────┘
```

**2. "Combos sugeridos"**:
```
Agregaste: 🍝 Pasta Carbonara

┌──────────────────────────┐
│ Maridalo con:            │
│ 🍷 Vino Malbec    +$800  │
│ 🥖 Pan de ajo     +$350  │
│                [Agregar] │
└──────────────────────────┘
```

**3. "Lo más pedido ahora"**:
- Sección dinámica que actualiza según pedidos en tiempo real
- Social proof: "15 personas pidieron esto en la última hora"

**Lógica de recomendaciones**:
```typescript
// Algoritmo simple pero efectivo
function getRecommendations(context: {
  timeOfDay: 'breakfast' | 'lunch' | 'dinner'
  weather?: 'hot' | 'cold' | 'rainy'
  cartItems: CartItem[]
  userHistory?: OrderHistory
  tableSize: number
}): MenuItem[] {
  // 1. Complementos del carrito actual
  const complements = findComplements(context.cartItems)
  
  // 2. Popular en este horario
  const trending = getTrendingByTime(context.timeOfDay)
  
  // 3. Weather-based (ej: sopa si llueve)
  const weatherFit = getWeatherRecommendations(context.weather)
  
  // 4. Para compartir si mesa > 2 personas
  const sharing = context.tableSize > 2 
    ? getSharingPlates() 
    : []
  
  return [...complements, ...trending, ...weatherFit, ...sharing]
    .slice(0, 10)
}
```

**Métricas**:
- Click rate en recomendaciones > 40%
- Upsell success rate > 20%
- AOV (Average Order Value) +15%

---

### 📦 Fase 2: Engagement (3-4 semanas)

#### 2.1 Tracking de Pedido en Tiempo Real ⏱️
**Problema**: El cliente no sabe si su pedido fue recibido o cuánto falta.

**Solución**:

**Estado visual del pedido**:
```
┌──────────────────────────────┐
│  Tu Pedido #1247             │
├──────────────────────────────┤
│                              │
│  ✅ Recibido      12:34 PM   │
│  🔄 En cocina     12:36 PM   │
│  ⏳ Listo pronto  ~5 min     │
│  🍽️ Servido       --:--     │
│                              │
│  [Ver Detalles]              │
└──────────────────────────────┘
```

**Timeline interactivo**:
```typescript
type OrderStatus = 
  | 'received'    // Recibido por el sistema
  | 'confirmed'   // Confirmado por cocina
  | 'preparing'   // En preparación
  | 'ready'       // Listo para servir
  | 'serving'     // Mesero lo lleva
  | 'served'      // En la mesa

interface OrderUpdate {
  orderId: string
  status: OrderStatus
  timestamp: Date
  estimatedTime?: number  // minutos restantes
  message?: string        // Mensaje personalizado
  itemsReady?: string[]   // IDs de items listos
}
```

**Features**:
- WebSocket para actualizaciones en tiempo real
- Notificación push cuando esté listo
- Indicador visual por item (útil para mesas grandes)
- Barra de progreso animada
- Mensajes personalizados: "Tu pizza está en el horno 🔥"

**Gamification**:
- Mostrar tiempo de prep real vs estimado
- "Record de velocidad hoy: 12 min ⚡"
- Confetti animation cuando se completa

**Métricas**:
- Reducción en consultas "¿Cuánto falta?" al staff: -60%
- Customer anxiety score: < 2/5
- Satisfacción con tiempo de espera: > 4/5

---

#### 2.2 Sistema de Comunicación con Staff 📞
**Problema**: Cliente necesita llamar al mesero para diferentes cosas.

**Solución**:

**Floating Action Button (FAB)**:
```
┌──────────────────────┐
│                      │
│   [Menú aquí]       │
│                      │
│                      │
│              [🔔]    │  ← FAB fijo abajo derecha
└──────────────────────┘
```

**Menu de opciones al tocar**:
```
┌────────────────────────┐
│ ¿En qué te ayudamos?   │
├────────────────────────┤
│ 💧 Necesito agua       │
│ 🍽️ Cubiertos/Serv.    │
│ 🧻 Necesito servilletas│
│ 💳 Traigan la cuenta   │
│ 👋 Llamar mesero       │
│ ❓ Tengo una pregunta  │
└────────────────────────┘
```

**Backend - Cola de Solicitudes**:
```typescript
interface ServiceRequest {
  id: string
  tableId: string
  tableNumber: number
  zone: string
  type: 
    | 'water'
    | 'cutlery'
    | 'napkins'
    | 'bill'
    | 'waiter'
    | 'question'
    | 'complaint'
  priority: 'low' | 'medium' | 'high'
  message?: string
  status: 'pending' | 'acknowledged' | 'resolved'
  createdAt: Date
  acknowledgedAt?: Date
  resolvedAt?: Date
  assignedTo?: string  // staff user ID
}
```

**Panel para Staff**:
```
┌─────────────────────────────┐
│ 🔔 Solicitudes Activas (5)  │
├─────────────────────────────┤
│ 🔴 Mesa 12 - Patio          │
│    💳 Pedir cuenta          │
│    Hace 2 min    [Atender]  │
├─────────────────────────────┤
│ 🟡 Mesa 7 - Interior        │
│    💧 Necesito agua         │
│    Hace 5 min    [Atender]  │
└─────────────────────────────┘
```

**Features**:
- Notificación push al staff inmediata
- Color coding por prioridad
- Tiempo de espera visible
- Métricas de response time por mesero
- Auto-escalate si no se atiende en 5 min

**Customer Feedback Loop**:
```
Mesa 12 solicitó: 💳 Cuenta

  ↓ Staff marca como "Atendido"
  
Cliente recibe:
"✅ Carlos está llevando la cuenta
 a tu mesa"
```

**Métricas**:
- Response time promedio < 3 min
- % de solicitudes resueltas < 5 min: > 85%
- Reducción de llamados verbales: -40%

---

#### 2.3 Split Payment & Propinas 💰
**Problema**: Dividir la cuenta es tedioso y las propinas son ambiguas.

**Solución**:

**1. Dividir cuenta (varios métodos)**:

**Método A: Por persona**
```
┌──────────────────────────┐
│ Total: $8,400            │
│                          │
│ ¿Entre cuántos?          │
│  [1] [2] [3] [4] [5+]    │
│                          │
│ Seleccionado: 4 personas │
│ Cada uno paga: $2,100    │
│                          │
│ [Continuar al Pago]      │
└──────────────────────────┘
```

**Método B: Por items**
```
┌──────────────────────────┐
│ Selecciona tus consumos  │
├──────────────────────────┤
│ ☑️ Hamburguesa  $1,500   │
│ ☑️ Coca Cola    $600     │
│ ☐  Pizza        $1,800   │
│ ☑️ Flan         $800     │
├──────────────────────────┤
│ Tu total: $2,900         │
│ [Pagar mi parte]         │
└──────────────────────────┘
```

**Método C: Monto personalizado**
```
Ingresá cuánto querés pagar:
$ [_______]

Restante del total: $5,100
```

**2. Propinas inteligentes**:
```
┌────────────────────────────┐
│ Subtotal:        $2,100    │
│ Propina:                   │
│                            │
│  [ 10% ]  $210  ←Selected  │
│  [ 15% ]  $315             │
│  [ 20% ]  $420             │
│  [Otro]   $___             │
│  [Sin propina]             │
├────────────────────────────┤
│ Total a pagar:   $2,310    │
│                            │
│ [Pagar con MercadoPago]    │
└────────────────────────────┘
```

**Features avanzadas**:
- Propina va directo al mesero (transparencia)
- Opción de agregar mensaje con la propina
- QR para pagar en efectivo en caja
- Guardar método de pago para próxima vez
- Factura digital por email automática

**Flow completo**:
```typescript
// 1. Cliente revisa cuenta
GET /api/tables/{tableId}/bill

// 2. Decide método de split
POST /api/tables/{tableId}/split
{
  method: 'equal' | 'items' | 'custom',
  participants: number | { userId: string, items: string[] }[]
}

// 3. Cada uno paga su parte
POST /api/payments/split-payment
{
  billId: string,
  amount: number,
  tipAmount: number,
  tipMessage?: string,
  paymentMethod: 'mercadopago' | 'cash'
}

// 4. Sistema confirma cuando todos pagaron
WebSocket → 'bill_fully_paid'

// 5. Staff recibe notificación
// 6. Mesa se marca como "listo para limpiar"
```

**Métricas**:
- Uso de split payment: > 30% de mesas
- Propina promedio: 13-15%
- Tiempo de checkout: -50%
- Errores en pagos: < 2%

---

### 🎁 Fase 3: Loyalty & Growth (4-5 semanas)

#### 3.1 Programa de Lealtad "Taste Points" 🎯
**Problema**: Clientes no tienen incentivo para volver.

**Solución**:

**Sistema de Puntos**:
```typescript
interface LoyaltyAccount {
  userId: string
  phoneNumber: string  // Identificador principal
  points: number
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  
  stats: {
    totalVisits: number
    totalSpent: number
    lastVisit: Date
    favoriteItems: string[]
    avgOrderValue: number
  }
  
  rewards: Reward[]
  achievements: Achievement[]
}

// Regla simple: $100 pesos = 1 punto
// 100 puntos = $1,000 en descuento
```

**UI - Onboarding en primera visita**:
```
┌─────────────────────────────┐
│  🎉 ¡Primera vez aquí!      │
│                             │
│  Registrate y empezá a      │
│  acumular Taste Points      │
│                             │
│  📱 Tu número:              │
│  [+54 _______________]      │
│                             │
│  [Registrarme] [Omitir]     │
└─────────────────────────────┘
```

**Widget visible en toda la app**:
```
┌──────────────────────────┐
│ 🏆 Tu cuenta             │
│ ────────────────────────│
│ 847 puntos               │
│ ⭐ Gold Member           │
│ 53 pts para tu próximo  │
│ descuento de $500        │
└──────────────────────────┘
```

**Recompensas escalonadas**:
```
100 pts  →  $100 de descuento
500 pts  →  Postre gratis
1000 pts →  $1,000 de descuento
2000 pts →  Entrada gratis
5000 pts →  Plato principal gratis
```

**Tiers con beneficios**:
```
🥉 Bronze (0-499 pts)
   • 5% descuento cumpleaños

🥈 Silver (500-1499 pts)
   • Todo lo anterior +
   • Welcome drink gratis
   • 10% off en cumpleaños

🥇 Gold (1500-4999 pts)
   • Todo lo anterior +
   • Postre gratis mensual
   • Priority seating
   • 15% off cumpleaños

💎 Platinum (5000+ pts)
   • Todo lo anterior +
   • Mesa VIP siempre disponible
   • 20% off todos los martes
   • Degustación mensual gratis
   • 20% off cumpleaños
```

**Gamification - Achievements**:
```
🍕 "Pizza Lover"
   Pedí 10 pizzas → +50 pts bonus

🍷 "Sommelier"
   Probá 5 vinos diferentes → +100 pts

🌮 "Explorador"
   Pedí de todas las categorías → +200 pts

👥 "Socialite"
   Vení con 5+ personas 3 veces → +150 pts

⚡ "Madrugador"
   Visitá antes de 10 AM → +50 pts
```

**Referral Program**:
```
Invita amigos:
Tu amigo → Postre gratis en 1ra visita
Vos     → +200 pts por cada referido
```

**Métricas**:
- Sign-up rate: > 60% de nuevos clientes
- Repeat visit rate: > 40% en 30 días
- Referral conversion: > 25%
- Points redemption rate: > 70%

---

#### 3.2 Encuesta Post-Visita & Feedback 📊
**Problema**: No sabemos qué piensan los clientes.

**Solución**:

**Timing perfecto**: 2 horas después de que pagaron (cuando aún lo recuerdan pero no están apurados).

**SMS/WhatsApp automático**:
```
Hola! Gracias por venir a [Restaurante] 🍽️

¿Cómo estuvo todo? 
Contestá en 30 seg y ganá 50 pts 🎁

[Calificar ahora] 👈
```

**Survey súper corta (< 1 min)**:

**Paso 1: Rating rápido**
```
┌─────────────────────────┐
│ ¿Cómo estuvo tu        │
│ experiencia?            │
│                         │
│  😡 😟 😐 🙂 😍       │
│                         │
│ [Selecciona uno]        │
└─────────────────────────┘
```

**Paso 2: Drill-down (solo si ≤ 😐)**
```
¿Qué podríamos mejorar?

☐ Velocidad del servicio
☐ Calidad de la comida
☐ Limpieza
☐ Atención del staff
☐ Precios
☐ Menú/Variedad
☐ Otro: [_______]
```

**Paso 3: NPS (opcional)**
```
¿Recomendarías [Restaurante]
a un amigo?

0  1  2  3  4  5  6  7  8  9  10
|--|--|--|--|--|--|--|--|--|--|--|
Nada probable      Muy probable
```

**Paso 4: Review pública (si ≥ 🙂)**
```
¡Nos alegra que te haya gustado! 🎉

¿Nos dejarías una review en Google?
Te tomaría 1 minuto y nos ayudaría
muchísimo ❤️

[Dejar Review] [Ahora no]

+100 pts bonus por review
```

**Dashboard para el restaurante**:
```
┌─────────────────────────────────┐
│ Satisfacción - Últimos 30 días  │
├─────────────────────────────────┤
│ 😍 68% (↑ 5%)                   │
│ 🙂 22% (↓ 2%)                   │
│ 😐 7%  (↓ 1%)                   │
│ 😟 2%  (↓ 1%)                   │
│ 😡 1%  (↓ 1%)                   │
├─────────────────────────────────┤
│ NPS Score: 72 (Excellent) ✨    │
│                                  │
│ Temas más mencionados:           │
│ 1. "rápido" (48 menciones) ✅   │
│ 2. "delicioso" (41) ✅          │
│ 3. "caro" (12) ⚠️               │
└─────────────────────────────────┘
```

**Alertas automáticas**:
```typescript
// Si rating es 😡 o 😟
if (rating <= 2) {
  // 1. Notificar al manager inmediatamente
  notify(manager, {
    title: '🚨 Cliente insatisfecho',
    mesa: tableNumber,
    problema: issues,
    urgente: true
  })
  
  // 2. Enviar mensaje al cliente
  sendSMS(customer, `
    Lamentamos mucho que no hayas tenido
    una buena experiencia. Nuestro manager
    ${manager.name} se contactará contigo
    en las próximas horas para solucionarlo.
    
    Como disculpa, tu próxima visita tiene
    20% de descuento.
  `)
  
  // 3. Crear cupón automático
  createCoupon(customer, {
    discount: 0.2,
    expiresIn: '30 days'
  })
}
```

**Métricas**:
- Survey completion rate: > 40%
- NPS score: > 70 (Excellent)
- Google review conversion: > 15%
- Issue resolution time: < 24h

---

#### 3.3 Experiencias Especiales & Social 📸
**Problema**: La experiencia no es "instagrameable".

**Solución**:

**1. Plato del día interactivo**
```
┌─────────────────────────────┐
│  ✨ Especial del Chef       │
│                             │
│  [FOTO PROFESIONAL]         │
│                             │
│  Risotto de hongos trufados │
│  Solo hoy - 15 porciones    │
│                             │
│  💬 "El mejor risotto que   │
│      probé en mi vida"      │
│      - @maria.foodie        │
│                             │
│  [Quiero este! 🤤]          │
└─────────────────────────────┘
```

**2. Social sharing con incentivo**
```
✨ Compartí tu experiencia

[📸 Foto del plato]

"Comiendo en @RestauranteLaBuenaMesa
🍝 Risotto espectacular!

#LaBuenaMesa #Foodie #BuenosAires"

[📱 Compartir en Instagram]
[🐦 Compartir en Twitter]

+ 100 puntos por compartir
+ 50 puntos si etiquetás al restaurante
```

**3. Momentos especiales**
```typescript
// Detectar ocasiones especiales
interface SpecialOccasion {
  type: 'birthday' | 'anniversary' | 'firstTime' | 'proposal'
  date: Date
  details?: string
}

// Trigger automático
if (occasion.type === 'birthday') {
  // 1. Decorar la mesa virtual
  showConfetti()
  playHappyBirthday()
  
  // 2. Sorpresa del staff
  notifyStaff({
    message: '🎂 Mesa 12 - Cumpleaños',
    action: 'Llevar postre con velita'
  })
  
  // 3. Descuento sorpresa
  applyDiscount(bill, 0.15)
}
```

**4. Menu items con stories**
```
[Tapa en item del menú]

┌─────────────────────────┐
│ 🎥 Historia del plato   │
├─────────────────────────┤
│ [VIDEO 15 seg]          │
│                         │
│ "Esta receta la heredé  │
│  de mi nonna italiana"  │
│                         │
│  - Chef Marco           │
│                         │
│ [❤️ Me gusta] [👨‍🍳 Ver más]│
└─────────────────────────┘
```

**5. Reto del mes**
```
🏆 RETO DE NOVIEMBRE

"Pizza Master Challenge"

Pedí las 5 pizzas especiales
del mes y ganá:

🎁 Cena gratis para 2
📸 Tu foto en nuestro mural
👕 Remera oficial

Progreso: ●●●○○
3/5 completadas

[Ver mi progreso]
```

**Métricas**:
- Social shares per month: > 200
- Tag rate: > 30%
- Special occasion detection: > 80%
- Challenge completion: > 10%

---

## 🏗️ Arquitectura Técnica

### Frontend

```
app/
├── (customer)/              # Nueva sección para clientes
│   ├── layout.tsx           # Layout específico (branding)
│   ├── welcome/             # Pantalla bienvenida
│   ├── menu/                # Menú mejorado
│   ├── cart/                # Carrito enhanced
│   ├── order-tracking/      # Seguimiento pedido
│   ├── payment/             # Split payment
│   ├── loyalty/             # Programa lealtad
│   └── feedback/            # Encuesta
│
components/
├── customer/
│   ├── welcome-screen.tsx
│   ├── menu-item-card-enhanced.tsx
│   ├── recommendations-slider.tsx
│   ├── order-status-tracker.tsx
│   ├── service-request-fab.tsx
│   ├── split-payment-modal.tsx
│   ├── tip-selector.tsx
│   ├── loyalty-widget.tsx
│   ├── points-animation.tsx
│   └── feedback-survey.tsx
│
hooks/
├── use-customer-session.ts
├── use-recommendations.ts
├── use-order-tracking.ts
├── use-service-request.ts
├── use-loyalty-account.ts
└── use-feedback.ts
```

### Backend (Supabase)

```sql
-- Nuevas tablas

-- Loyalty Program
CREATE TABLE loyalty_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number varchar(20) UNIQUE NOT NULL,
  email varchar(255),
  name varchar(100),
  points integer DEFAULT 0,
  tier varchar(20) DEFAULT 'bronze',
  total_visits integer DEFAULT 0,
  total_spent numeric(10,2) DEFAULT 0,
  last_visit timestamp,
  created_at timestamp DEFAULT now()
);

CREATE TABLE loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES loyalty_accounts(id),
  order_id uuid REFERENCES orders(id),
  points_earned integer,
  points_spent integer,
  transaction_type varchar(50),
  description text,
  created_at timestamp DEFAULT now()
);

CREATE TABLE loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  description text,
  points_required integer NOT NULL,
  reward_type varchar(50), -- discount, free_item, upgrade
  value jsonb,
  active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- Service Requests
CREATE TABLE service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES tables(id),
  session_id uuid,
  request_type varchar(50) NOT NULL,
  priority varchar(20) DEFAULT 'medium',
  message text,
  status varchar(20) DEFAULT 'pending',
  assigned_to uuid REFERENCES users(id),
  created_at timestamp DEFAULT now(),
  acknowledged_at timestamp,
  resolved_at timestamp
);

-- Customer Feedback
CREATE TABLE customer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid REFERENCES tables(id),
  order_id uuid REFERENCES orders(id),
  loyalty_account_id uuid REFERENCES loyalty_accounts(id),
  
  -- Ratings
  overall_rating integer CHECK (overall_rating BETWEEN 1 AND 5),
  nps_score integer CHECK (nps_score BETWEEN 0 AND 10),
  
  -- Specific aspects
  food_rating integer,
  service_rating integer,
  ambiance_rating integer,
  value_rating integer,
  
  -- Open feedback
  comment text,
  issues jsonb, -- Array of issue categories
  
  -- Metadata
  submitted_at timestamp DEFAULT now(),
  responded_at timestamp,
  response_text text
);

-- Order Tracking
CREATE TABLE order_status_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  status varchar(50) NOT NULL,
  estimated_ready_time timestamp,
  message text,
  updated_by uuid REFERENCES users(id),
  created_at timestamp DEFAULT now()
);

-- Item Images
CREATE TABLE menu_item_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES menu_items(id),
  image_url text NOT NULL,
  alt_text varchar(255),
  display_order integer DEFAULT 0,
  uploaded_at timestamp DEFAULT now()
);

-- Social Sharing
CREATE TABLE social_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loyalty_account_id uuid REFERENCES loyalty_accounts(id),
  order_id uuid REFERENCES orders(id),
  platform varchar(50), -- instagram, twitter, facebook
  shared_at timestamp DEFAULT now(),
  points_awarded integer
);
```

### API Routes

```typescript
// Loyalty
POST   /api/loyalty/signup
GET    /api/loyalty/account/:phone
POST   /api/loyalty/redeem
GET    /api/loyalty/rewards
GET    /api/loyalty/history

// Service Requests
POST   /api/service-requests
GET    /api/service-requests/:tableId
PATCH  /api/service-requests/:id/acknowledge
PATCH  /api/service-requests/:id/resolve

// Feedback
POST   /api/feedback
GET    /api/feedback/stats
PATCH  /api/feedback/:id/respond

// Order Tracking
GET    /api/orders/:orderId/status
POST   /api/orders/:orderId/status
// WebSocket: ws://api/orders/:orderId/track

// Recommendations
GET    /api/recommendations/:tableId
POST   /api/recommendations/track-click
```

### Estado Global

```typescript
// contexts/customer-context.tsx
interface CustomerContextValue {
  // Session
  session: CustomerSession | null
  isGuest: boolean
  
  // Loyalty
  loyaltyAccount: LoyaltyAccount | null
  points: number
  tier: LoyaltyTier
  
  // Current order
  currentOrder: Order | null
  orderStatus: OrderStatus
  
  // Actions
  signInWithPhone: (phone: string) => Promise<void>
  earnPoints: (amount: number) => void
  redeemReward: (rewardId: string) => Promise<void>
  requestService: (type: ServiceRequestType) => Promise<void>
  submitFeedback: (feedback: Feedback) => Promise<void>
}
```

---

## 📊 Plan de Implementación

### Sprint 1 (Semana 1-2): Foundation
- ✅ Setup estructura (customer)
- ✅ Pantalla de bienvenida
- ✅ Menú con imágenes (schema + UI)
- ✅ Recomendaciones básicas

**Entregable**: Cliente puede ver menú mejorado con recomendaciones.

### Sprint 2 (Semana 3-4): Engagement
- ✅ Order tracking (backend + WebSocket)
- ✅ Service request system
- ✅ Notificaciones en tiempo real

**Entregable**: Cliente puede trackear su pedido y llamar al mesero.

### Sprint 3 (Semana 5-6): Payment
- ✅ Split payment (3 métodos)
- ✅ Tip selector
- ✅ Integración MercadoPago mejorada

**Entregable**: Cliente puede dividir cuenta y pagar desde el celular.

### Sprint 4 (Semana 7-8): Loyalty Foundation
- ✅ Sistema de puntos
- ✅ Tiers y beneficios
- ✅ Onboarding flow

**Entregable**: Cliente puede registrarse y empezar a acumular puntos.

### Sprint 5 (Semana 9-10): Loyalty Advanced
- ✅ Achievements
- ✅ Referral program
- ✅ Rewards redemption

**Entregable**: Sistema de lealtad completo y funcional.

### Sprint 6 (Semana 11-12): Feedback & Polish
- ✅ Feedback system
- ✅ Encuestas automáticas
- ✅ Social sharing
- ✅ Polish general de UX

**Entregable**: Customer experience completa end-to-end.

---

## 🎨 Diseño & UX

### Principios de Diseño

1. **Mobile-First**: Todo pensado para pantalla de celular
2. **One-Handed**: Botones principales accesibles con pulgar
3. **Fast**: Carga < 2s, animaciones < 300ms
4. **Clear**: Jerarquía visual obvia, CTAs destacados
5. **Delightful**: Micro-interacciones, feedback inmediato
6. **Accessible**: Contraste WCAG AA, touch targets 44px

### Color Palette (Customizable per restaurant)

```css
/* Theme Variables */
:root {
  /* Primary (Brand) */
  --primary: 24 73% 53%;        /* Naranja cálido */
  --primary-foreground: 0 0% 98%;
  
  /* Accent (Actions) */
  --accent: 142 71% 45%;        /* Verde success */
  --accent-foreground: 0 0% 98%;
  
  /* Semantic */
  --success: 142 71% 45%;
  --warning: 38 92% 50%;
  --error: 0 84% 60%;
  
  /* Neutrals */
  --background: 0 0% 98%;
  --foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
}
```

### Typography

```css
/* Headings */
h1 { font-size: 2rem; font-weight: 700; line-height: 1.2; }
h2 { font-size: 1.5rem; font-weight: 600; line-height: 1.3; }
h3 { font-size: 1.25rem; font-weight: 600; line-height: 1.4; }

/* Body */
body { font-size: 1rem; line-height: 1.6; }
small { font-size: 0.875rem; }

/* Fonts */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Spacing System

```
4px   → gap-1
8px   → gap-2
16px  → gap-4
24px  → gap-6
32px  → gap-8
48px  → gap-12
```

### Components

Usaremos la biblioteca existente de shadcn/ui:
- `Button`, `Card`, `Badge`, `Avatar`
- `Sheet` (para carrito)
- `Tabs`, `Select`, `Input`
- `Toast` para notificaciones
- `Progress` para tracking

---

## 📈 Métricas de Éxito

### KPIs Principales

| Métrica | Baseline | Target | Plazo |
|---------|----------|--------|-------|
| **Adoption Rate** | 30% | 70% | 3 meses |
| Customer que usan QR vs papel | | | |
| | | | |
| **Satisfaction** | - | NPS > 70 | 3 meses |
| Net Promoter Score | | | |
| | | | |
| **Engagement** | - | 40% | 3 meses |
| Repeat visitors (30 días) | | | |
| | | | |
| **Revenue** | $100 | $115 | 3 meses |
| Average Order Value (AOV) | | (+15%) | |
| | | | |
| **Efficiency** | 20 min | 14 min | 3 meses |
| Time to checkout | | (-30%) | |
| | | | |
| **Loyalty** | 0% | 60% | 6 meses |
| Loyalty program signup | | | |

### Tracking

```typescript
// Analytics events
trackEvent('customer_qr_scan', { tableId, timestamp })
trackEvent('menu_view', { categoryId, itemId })
trackEvent('item_add_to_cart', { itemId, price })
trackEvent('recommendation_click', { itemId, position })
trackEvent('order_placed', { orderId, total, itemCount })
trackEvent('service_request', { type, responseTime })
trackEvent('payment_completed', { method, splitType, tipAmount })
trackEvent('loyalty_signup', { tier })
trackEvent('feedback_submitted', { rating, npsScore })
trackEvent('social_share', { platform })
```

---

## 🚀 Go-to-Market

### Fase 1: Soft Launch (Semana 1-2)
- 🎯 **Target**: 1 restaurante piloto
- 📊 **Objetivo**: Validar UX y tecnología
- 🧪 **A/B Test**: Welcome screen variations
- 📝 **Feedback**: Entrevistas con clientes (n=20)

### Fase 2: Beta Expansion (Semana 3-6)
- 🎯 **Target**: 5 restaurantes early adopters
- 📊 **Objetivo**: Refinar features y medir adoption
- 🎁 **Incentivo**: Primeros 100 clientes → 200 pts bonus
- 📢 **Marketing**: QR en mesas con "Nueva experiencia digital"

### Fase 3: Public Launch (Semana 7+)
- 🎯 **Target**: Todos los restaurantes de la plataforma
- 📊 **Objetivo**: Escalar y optimizar
- 🎁 **Promoción**: Programa de referidos activo
- 📢 **Marketing**: 
  - Social media campaign
  - Flyers en mesas
  - Email a base de clientes
  - Influencer partnerships

---

## 💡 Próximos Pasos

### Inmediatos (Esta semana)
1. ✅ Revisar y aprobar este documento
2. 📐 Crear wireframes detallados en Figma
3. 🎨 Definir brand guidelines del primer cliente piloto
4. 🗄️ Diseñar schema de DB completo
5. 👥 Definir equipo y roles

### Corto plazo (Próximas 2 semanas)
1. 🏗️ Setup de estructura de carpetas
2. 📱 Implementar pantalla de bienvenida
3. 🖼️ Sistema de carga de imágenes de menú
4. 🧪 Tests de performance mobile
5. 📊 Setup de analytics

---

## 🤔 Preguntas Abiertas

### Para Discutir

1. **Registro obligatorio vs opcional**: ¿Forzamos registro para loyalty o lo hacemos opcional?
   - **Pro obligatorio**: Más data, mejor personalization
   - **Contra**: Fricción en primera experiencia

2. **Pago por adelantado vs al final**: ¿Permitimos pagar al agregar cada item?
   - **Pro adelantado**: Menos abandono, más control
   - **Contra**: Menos flexible, experiencia rígida

3. **Staff notification**: ¿Notificaciones push, sonido, o ambos?
   - Considerar ambiente ruidoso del restaurante

4. **Monetización**: ¿Cobramos por tier de loyalty (Gold, Platinum)?
   - $2,000/mes por tier premium con más features

5. **Privacidad**: ¿Qué data guardamos y por cuánto tiempo?
   - GDPR compliance, políticas de retención

---

## 📚 Referencias & Inspiración

### Apps para estudiar
- **Tock**: Reservas + preorden
- **Toast**: POS + customer app
- **Zomato**: Loyalty + social
- **Starbucks**: Mejor loyalty program
- **Uber Eats**: Tracking en tiempo real
- **Duolingo**: Gamification excelente

### Benchmarks
- Industry NPS average: 32
- Industry repeat rate: 20-30%
- Industry tip average: 12-15%
- Mobile checkout conversion: 1.8% (industry)

---

## ✅ Checklist de Aprobación

Antes de empezar desarrollo:

- [ ] Stakeholders revisaron y aprobaron documento
- [ ] Budget asignado para las 3 fases
- [ ] Equipo de diseño tiene briefing claro
- [ ] Restaurante piloto identificado y comprometido
- [ ] Schema de DB revisado por DBA
- [ ] Plan de analytics definido
- [ ] Success criteria acordados
- [ ] Timeline aprobado

---

**Autor**: GitHub Copilot  
**Revisado por**: [Tu nombre]  
**Fecha**: Noviembre 3, 2025  
**Versión**: 1.0  
**Estado**: 📋 Pendiente aprobación

---

## 📞 Contacto

¿Dudas o sugerencias sobre este plan?

Abre un issue en GitHub con el tag `customer-experience` o contáctanos directamente.

---

**¡Transformemos la experiencia del cliente en nuestra ventaja competitiva! 🚀**
