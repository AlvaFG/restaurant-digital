# Project Guidelines

Este documento define las reglas y particularidades específicas del proyecto actual.
Los agentes deben **leer y respetar este archivo además de sus roles genéricos**.

---

## 1. Contexto del Proyecto
- Nombre del proyecto: Restaurante 360 Ops Console
- Descripción corta: Plataforma web centralizada para gestionar mesas, pedidos, pagos y analíticas en cadenas gastronómicas.
- Público objetivo: Gerentes de restaurantes, jefes de sala y equipos de soporte corporativo.
- Plataformas principales: Web (backoffice y panel de sala), tablets para staff, móviles vía flujo QR para clientes.
- Objetivos clave: Digitalizar la operación de salón, reducir tiempos de atención, tener visibilidad en tiempo real de ventas y simplificar lanzamientos multi-sucursal.

---

## 2. Reglas Específicas
### Frontend
- Trabajar en App Router (Next.js 14) con componentes server/client definidos explícitamente.
- Mantener la biblioteca de componentes en `components/ui` y reutilizar estilos Tailwind antes de crear CSS manual.
- Revisar accesibilidad (teclado, roles ARIA) y estados de carga/empty en cada vista.

### Backend
- Los contratos mock viven en `lib/mock-data.ts` y servicios en `lib/*.ts`; documentar cualquier cambio de firma en `PROJECT_OVERVIEW.md`.
- Evitar lógica duplicada en páginas; centralizar validaciones y helpers en `lib/` o `hooks/`.
- Toda nueva API deberá exponer tipos TypeScript (Request/Response) aunque todavía usemos mocks.

### Mobile
- Responsividad obligatoria ≥768px y vista optimizada para tablets; usar breakpoints definidos en Tailwind (`md`, `lg`).
- Flujos QR deben cargarse en <2s sobre redes 3G; validar en Lighthouse “Simulated fast 3G”.
- Documentar gestos o interacciones específicas en la nota de sesión del agente móvil.

### Lógica/Contratos
- Los eventos de socket se definen en `lib/socket.ts`; cualquier nuevo evento debe incluir tipo, payload y consumidor.
- Mantener enums y diccionarios (`ALERT_TYPE_*`, `TABLE_STATUS_*`) sincronizados entre backend mocks y frontend.
- Cambios de contrato requieren checklist en `PROJECT_GUIDELINES` > Integraciones y aviso a documentación.

### DevOps
- Validar `npm run lint` y `npm run build` antes de abrir PR. No se permite `--force` en CI.
- Actualizar scripts en `scripts/` con comentarios y pruebas manuales; documentar comandos auxiliares en `WORKFLOWS.md`.
- Ejecutar `node scripts/update-roadmap.js` al finalizar una rama feature para mantener ROADMAP al día.

### UX/UI
- Seguir el design system propuesto (colores base `--brand-accent` y tipografías Inter / JetBrains Mono).
- Entregar wireframes o capturas en cada PR visual; documentar accesibilidad y microcopys relevantes.
- Mantener consistencia de iconografía (Lucide) y estados vacíos ilustrados.

### Documentación
- Actualizar `PROJECT_OVERVIEW.md` y la sección correspondiente del README cuando se agreguen features.
- Registrar manuales y guías técnicas en `.codex/agents/documentation/*` al finalizar cada iteración.
- Checklist de documentación debe completarse en el punto 7 antes de cerrar sprint.

### Testing
- Nuevos módulos requieren al menos pruebas manuales documentadas en la sesión del agente testing.
- Automatizar casos críticos (pedidos, pagos) en cuanto estén disponibles APIs reales; priorizar cobertura de regresión.
- Usar Lighthouse y k6 según lineamientos en `WORKFLOWS.md` para performance y carga.

---

## 3. Consideraciones de Negocio / Costos
- Mantener trazabilidad de tareas críticas para pagos y analíticas (alta prioridad comerciales).
- Optimizar tiempos de desarrollo compartiendo componentes y mocks; evitar desarrollo duplicado entre equipos.
- Evitar costos de infraestructura innecesarios: ambientes efímeros sólo cuando la feature impacte a varias áreas.

---

## 4. Integraciones Externas
- APIs: Mercado Pago (checkout), Stripe (fallback internacional), DataDog (logs), Slack (alertas operativas).
- SDKs: Mercado Pago SDK JS, Stripe JS, Socket.io client.
- Métodos de pago / autenticación: OAuth con Mercado Pago, API keys en Vault para Stripe, SSO corporativo (OAuth2) para staff.

---

## 5. Seguridad y Compliance
- Reglas de seguridad a seguir (ej. PCI DSS, GDPR).
- Logs obligatorios (accesos críticos, operaciones de pago y cambios de estado de mesa).
- Manejo de datos sensibles: nunca persistir tarjetas, enmascarar datos personales en logs, usar HTTPS en todos los entornos.

---

## 6. Requisitos Especiales
- Offline-first / sincronización para tablets; cola local cuando no haya conexión.
- Multi-idioma (es/en) y posibilidad de multi-marca controlada por tenant.
- Escalabilidad multi-cliente (multi-tenant) y soporte para 50 sucursales concurrentes.
- Otras restricciones: tiempos de respuesta <500 ms en endpoints críticos, disponibilidad 99.5 % mensual.

---

## 7. Check de Entrega
Antes de cerrar cada sprint o tarea importante, validar:
- [ ] Reglas específicas cumplidas.
- [ ] Integraciones probadas.
- [ ] Seguridad aplicada.
- [ ] Documentación actualizada.
