# Project Roadmap - Restaurant Management System

**Última actualización**: 2025-01-09  
**Versión actual**: 0.5.0 (M5 completado)  
**Próximo milestone**: M6 - QR Ordering  

---

## 📊 Estado General

| Milestone | Estado | Completado | Fecha |
|-----------|--------|------------|-------|
| M1 - Setup Inicial | ✅ Completado | 100% | 2024-09 |
| M2 - Gestión de Mesas | ✅ Completado | 100% | 2024-10 |
| M3 - Sistema de Pedidos | ✅ Completado | 100% | 2024-11 |
| M4 - Analytics | ✅ Completado | 100% | 2024-12 |
| M5 - Pagos Online | ✅ Completado | 100% | 2025-01 |
| **M6 - QR Ordering** | 🚧 En Progreso | 0% | 2025-02 |
| M7 - Performance & Scale | 📋 Planeado | 0% | 2025-03 |
| M8 - Producción | 📋 Planeado | 0% | 2025-04 |

---

## ✅ M1 - Setup Inicial (Completado)

**Fecha**: Septiembre 2024  
**Branch**: `feature/initial-setup`

### Objetivos
- Configurar proyecto base con Next.js 14 y TypeScript
- Implementar autenticación básica
- Establecer estructura de componentes
- Configurar testing y linting

### Tareas Completadas
- [x] Configurar Next.js 14.2 con App Router
- [x] Setup TypeScript 5 con strict mode
- [x] Configurar Tailwind CSS + shadcn/ui
- [x] Implementar AuthContext y ProtectedRoute
- [x] Crear DashboardLayout y SidebarNav
- [x] Setup Vitest + React Testing Library
- [x] Configurar ESLint y Prettier
- [x] Crear documentación inicial (PROJECT_OVERVIEW, PROJECT_GUIDELINES)

### Deliverables
- ✅ Proyecto base funcional
- ✅ Sistema de autenticación (mock)
- ✅ Estructura de rutas
- ✅ Componentes UI base
- ✅ CI/CD setup básico

---

## ✅ M2 - Gestión de Mesas (Completado)

**Fecha**: Octubre 2024  
**Branch**: `feature/table-management`

### Objetivos
- Implementar modelo de estados de mesa
- Crear vista visual del salón
- Editor de layout de mesas
- APIs CRUD de mesas

### Tareas Completadas
- [x] Definir state machine de mesas (libre → ocupada → pagando → libre)
- [x] Implementar TableStore con persistencia
- [x] API endpoints `/api/tables` (GET, POST, PATCH, DELETE)
- [x] Componente TableMap con vista visual
- [x] Editor de layout con drag & drop
- [x] SalonLiveView para monitoreo en tiempo real
- [x] Integración WebSocket para actualizaciones
- [x] Tests de API (4 tests)
- [x] Tests de state transitions

### Deliverables
- ✅ Vista de salón en tiempo real
- ✅ Editor de layout funcional
- ✅ APIs de mesas completas
- ✅ State machine validado
- ✅ Tests passing

---

## ✅ M3 - Sistema de Pedidos (Completado)

**Fecha**: Noviembre 2024  
**Branch**: `feature/orders-system`

### Objetivos
- Implementar gestión completa de pedidos
- Crear menú digital
- Sistema de notificaciones en tiempo real
- APIs robustas con validaciones

### Tareas Completadas
- [x] Implementar OrderStore con validaciones
- [x] API `/api/order` (GET, POST, PATCH)
- [x] Sistema de workflow (pendiente → preparando → servido → completado)
- [x] MenuStore con categorías, items, alérgenos
- [x] API `/api/menu` completa
- [x] OrdersPanel - Vista de gestión de pedidos
- [x] OrderForm - Formulario de creación
- [x] Integración WebSocket (order:created, order:updated)
- [x] Validación de stock
- [x] Cálculo automático de totales, descuentos, propinas
- [x] Tests comprehensivos (17 tests API, 8 tests componentes)

### Deliverables
- ✅ Panel de gestión de pedidos funcional
- ✅ Menú digital completo
- ✅ Notificaciones en tiempo real
- ✅ Validaciones robustas
- ✅ 25 tests passing

---

## ✅ M4 - Analytics (Completado)

**Fecha**: Diciembre 2024  
**Branch**: `feature/analytics`

### Objetivos
- Dashboard de analytics con métricas clave
- Reportes de ocupación y ventas
- Tracking de cubiertos

### Tareas Completadas
- [x] AnalyticsDashboard component
- [x] API `/api/analytics/covers`
- [x] Métricas: ocupación promedio, rotación, revenue
- [x] Filtros por fecha
- [x] Gráficos interactivos
- [x] Integración con TableStore para tracking

### Deliverables
- ✅ Dashboard de analytics funcional
- ✅ Métricas en tiempo real
- ✅ Filtros y visualizaciones

---

## ✅ M5 - Pagos Online (Completado)

**Fecha**: Enero 2025  
**Branch**: `feature/backend-payments-mercadopago`

### Objetivos
- Integrar pasarela de pagos (MercadoPago)
- Implementar checkout flow completo
- Webhooks para actualizaciones automáticas
- Sistema robusto y seguro

### Tareas Completadas
- [x] **Backend**:
  - [x] PaymentStore con persistencia
  - [x] PaymentService con lógica de negocio
  - [x] MercadoPagoProvider (Checkout Pro)
  - [x] Payment Gateway Interface (abstracción)
  - [x] API `/api/payment` (GET, POST)
  - [x] API `/api/payment/[id]` (GET)
  - [x] Webhook `/api/webhook/mercadopago` con signature validation

- [x] **Frontend**:
  - [x] CheckoutButton component
  - [x] PaymentModal component
  - [x] Payment result pages (success/failure/pending)
  - [x] usePayment hook
  - [x] Integración en OrdersPanel

- [x] **Real-time**:
  - [x] WebSocket events: `payment:created`, `payment:updated`
  - [x] Sincronización automática de estado

- [x] **Documentation**:
  - [x] API documentation (`docs/api/payments.md`)
  - [x] Payment flow diagram
  - [x] Setup guide
  - [x] PR checklist

- [x] **Testing**:
  - [x] 13 tests de PaymentStore (pending fix)
  - [x] Manual testing completo

### Deliverables
- ✅ Integración MercadoPago funcional
- ✅ Checkout flow completo
- ✅ Webhooks validados
- ✅ Real-time updates
- ⚠️ Tests necesitan fixes (file I/O)

### Issues Conocidos
- ⚠️ Payment-store tests failing (13) - falta setup de data/
- ⚠️ Console.logs en código de producción (20+)
- ⚠️ File I/O puede optimizarse con cache

---

## 🚧 M6 - QR Ordering (En Progreso)

**Fecha estimada**: Febrero 2025  
**Branch**: `feature/qr-ordering`  
**Prioridad**: Alta

### Objetivos
- Permitir que clientes ordenen desde su celular
- Generación de códigos QR por mesa
- Vista mobile-optimizada del menú
- Proceso de checkout simplificado

### Tareas Planeadas

#### Backend
- [ ] Generar QR codes únicos por mesa
- [ ] API `/api/qr/[tableId]` para validar QR
- [ ] Session management temporal para clientes
- [ ] Validación de mesa disponible
- [ ] Rate limiting para prevenir abuse

#### Frontend
- [ ] Vista mobile del menú (`/qr/[tableId]`)
- [ ] Shopping cart para clientes
- [ ] Checkout flow simplificado
- [ ] Confirmación de pedido
- [ ] Estado de pedido en tiempo real

#### UX
- [ ] Diseño mobile-first
- [ ] Flujo optimizado para clientes
- [ ] Validaciones user-friendly
- [ ] Loading states apropiados
- [ ] Error handling claro

#### Documentation
- [ ] Flujo QR documentado
- [ ] API documentation
- [ ] Setup guide para QR generation
- [ ] UX best practices

#### Testing
- [ ] Tests de QR validation
- [ ] Tests de session management
- [ ] E2E tests del flujo completo
- [ ] Mobile testing en devices reales

### Dependencias
- ✅ M3 (Sistema de Pedidos) - Completado
- ✅ M5 (Pagos Online) - Completado

### Riesgos
- 🟡 UX mobile puede requerir iteraciones
- 🟡 Performance en conexiones lentas
- 🟢 Session management sin autenticación

---

## 📋 M7 - Performance & Scalability (Planeado)

**Fecha estimada**: Marzo 2025  
**Prioridad**: Alta

### Objetivos
- Migrar stores file-based a database
- Optimizar performance de APIs
- Implementar caching
- Mejorar bundle size

### Tareas Planeadas

#### Database Migration
- [ ] Diseñar schema de PostgreSQL/MongoDB
- [ ] Implementar repositories pattern
- [ ] Migrar PaymentStore → DB
- [ ] Migrar OrderStore → DB
- [ ] Migrar TableStore → DB
- [ ] Migrar MenuStore → DB
- [ ] Scripts de migración de datos

#### Performance
- [ ] Implementar Redis para caching
- [ ] Optimizar queries de DB
- [ ] Lazy loading de componentes pesados
- [ ] Code splitting optimizado
- [ ] Image optimization
- [ ] API response caching

#### Monitoring
- [ ] Setup de logging estructurado (Winston/Pino)
- [ ] Integración con Sentry para error tracking
- [ ] Performance monitoring (Lighthouse CI)
- [ ] APM setup (New Relic/DataDog)

#### Tests
- [ ] Performance benchmarks
- [ ] Load testing (k6/Artillery)
- [ ] Database query optimization tests

### KPIs Target
- API response time: <100ms (p50), <200ms (p95)
- Bundle size: <250KB First Load JS
- Lighthouse score: >90
- Test coverage: >85%

---

## 📋 M8 - Producción (Planeado)

**Fecha estimada**: Abril 2025  
**Prioridad**: Crítica

### Objetivos
- Deploy a producción
- Setup de CI/CD completo
- Monitoring y alertas
- Documentation final

### Tareas Planeadas

#### Infrastructure
- [ ] Setup en Vercel/AWS/GCP
- [ ] Configurar dominio y SSL
- [ ] Setup de database en producción
- [ ] Redis en producción
- [ ] Backups automáticos
- [ ] Disaster recovery plan

#### CI/CD
- [ ] Pipeline completo (GitHub Actions)
- [ ] Tests automáticos en PR
- [ ] Deploy preview environments
- [ ] Rollback automático en errores
- [ ] Semantic versioning automático

#### Security
- [ ] Security audit completo
- [ ] Penetration testing
- [ ] OWASP compliance
- [ ] Rate limiting en producción
- [ ] DDoS protection
- [ ] Secrets management (Vault/AWS Secrets)

#### Monitoring & Alertas
- [ ] Uptime monitoring (Pingdom/UptimeRobot)
- [ ] Error alerting (Sentry)
- [ ] Performance alerts
- [ ] Log aggregation (ELK/Datadog)
- [ ] On-call rotation setup

#### Documentation
- [ ] Production deployment guide
- [ ] Runbook para operaciones
- [ ] Troubleshooting guide
- [ ] API documentation pública
- [ ] User manual

#### Go-Live
- [ ] Soft launch con usuarios beta
- [ ] Load testing en producción
- [ ] Monitoring 24/7 primera semana
- [ ] Hotfix process establecido
- [ ] Launch announcement

---

## 🔮 Backlog (Futuro)

### Features Potenciales
- **Reservas online**: Sistema de reservas para clientes
- **Programa de fidelidad**: Puntos y recompensas
- **Integración con delivery**: Rappi, Uber Eats, etc.
- **Multi-restaurant**: Support para múltiples sucursales
- **Gestión de inventario**: Control de stock y compras
- **RRHH integration**: Gestión de personal y turnos
- **Marketing automation**: Emails, SMS, notificaciones push
- **BI Dashboard**: Analytics avanzados con predicciones
- **App móvil nativa**: iOS/Android apps

### Technical Improvements
- **GraphQL API**: Alternativa a REST
- **Microservices**: Separar en servicios independientes
- **Event Sourcing**: Para audit trail completo
- **Internationalization**: Soporte multi-idioma
- **Dark mode**: Tema oscuro
- **Offline mode**: PWA con sync
- **Real-time collaboration**: Múltiples usuarios editando simultáneamente

---

## 📈 Métricas de Progreso

### Completitud del Proyecto

```
M1: ████████████████████ 100% ✅
M2: ████████████████████ 100% ✅
M3: ████████████████████ 100% ✅
M4: ████████████████████ 100% ✅
M5: ████████████████████ 100% ✅
M6: ░░░░░░░░░░░░░░░░░░░░   0% 🚧
M7: ░░░░░░░░░░░░░░░░░░░░   0% 📋
M8: ░░░░░░░░░░░░░░░░░░░░   0% 📋

Progreso total: ██████████░░░░░░░░░░ 50%
```

### Tests Coverage

| Área | Coverage | Target |
|------|----------|--------|
| API Routes | 100% | 90% ✅ |
| Components | 88% | 80% ✅ |
| Services | 75% | 70% ✅ |
| Stores | 32% | 70% ⚠️ |
| **Total** | **80%** | **75%** ✅ |

### Performance Metrics (Current)

| Métrica | Actual | Target M7 |
|---------|--------|-----------|
| API Response (p50) | ~50ms | <100ms ✅ |
| First Load JS | 254KB | <250KB ⚠️ |
| Build Time | 8s | <15s ✅ |
| Test Duration | 8.17s | <10s ✅ |

---

## 🎯 Prioridades Actuales

### Corto Plazo (Enero-Febrero 2025)
1. 🔴 **Arreglar payment-store tests** (bloqueante)
2. 🔴 **Implementar logger** (reemplazar console.logs)
3. 🟡 **Iniciar M6 - QR Ordering**
4. 🟡 **Optimizar performance de stores**

### Mediano Plazo (Marzo-Abril 2025)
1. 🟡 **M7 - Database migration**
2. 🟡 **M7 - Performance optimization**
3. 🟢 **M8 - Production deployment**

### Largo Plazo (Mayo 2025+)
1. 🟢 **Multi-restaurant support**
2. 🟢 **Mobile apps**
3. 🟢 **Advanced analytics**

---

## 📞 Contacto y Recursos

- **Repository**: [restaurant-digital](https://github.com/AlvaFG/restaurant-digital)
- **Branch actual**: `feature/backend-payments-mercadopago`
- **Project Board**: GitHub Projects (si configurado)
- **Documentation**: `/docs` folder
- **Changelog**: `CHANGELOG.md`

---

**Última actualización**: 2025-01-09  
**Mantenido por**: [@AlvaFG](https://github.com/AlvaFG)  
**Versión**: 2.0.0
