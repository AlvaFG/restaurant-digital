# Project Guidelines

Este documento define las reglas y particularidades espec�ficas del proyecto actual.
Los agentes deben **leer y respetar este archivo adem�s de sus roles gen�ricos**.

---

## 1. Contexto del Proyecto
- Nombre del proyecto: Restaurante 360 Ops Console
- Descripci�n corta: Plataforma web centralizada para gestionar mesas, pedidos, pagos y anal�ticas en cadenas gastron�micas.
- P�blico objetivo: Gerentes de restaurantes, jefes de sala y equipos de soporte corporativo.
- Plataformas principales: Web (backoffice y panel de sala), tablets para staff, m�viles v�a flujo QR para clientes.
- Objetivos clave: Digitalizar la operaci�n de sal�n, reducir tiempos de atenci�n, tener visibilidad en tiempo real de ventas y simplificar lanzamientos multi-sucursal.

---

## 2. Reglas Espec�ficas
### Frontend
- Trabajar en App Router (Next.js 14) con componentes server/client definidos expl�citamente.
- Mantener la biblioteca de componentes en `components/ui` y reutilizar estilos Tailwind antes de crear CSS manual.
- Revisar accesibilidad (teclado, roles ARIA) y estados de carga/empty en cada vista.
- El cat�logo de men� se resuelve con `useMenuCatalog` (`app/menu/_hooks/use-menu-catalog.ts`); reutilizarlo para vistas relacionadas y usar su `refetch` en lugar de duplicar fetches.

### Backend
- Los contratos mock viven en `lib/mock-data.ts` y servicios en `lib/*.ts`; documentar cualquier cambio de firma en `PROJECT_OVERVIEW.md`.
- Evitar l�gica duplicada en p�ginas; centralizar validaciones y helpers en `lib/` o `hooks/`.
- Toda nueva API deber� exponer tipos TypeScript (Request/Response) aunque todav�a usemos mocks.
- Las APIs de men� deben incluir los headers `x-menu-version` y `x-menu-updated-at` en todas las respuestas GET/HEAD para control de versiones en tablets y flujo QR.

### Mobile
- Responsividad obligatoria =768px y vista optimizada para tablets; usar breakpoints definidos en Tailwind (`md`, `lg`).
- Flujos QR deben cargarse en <2s sobre redes 3G; validar en Lighthouse �Simulated fast 3G�.
- Documentar gestos o interacciones espec�ficas en la nota de sesi�n del agente m�vil.

### L�gica/Contratos
- Los eventos de socket se definen en `lib/socket.ts`; cualquier nuevo evento debe incluir tipo, payload y consumidor.
- Mantener enums y diccionarios (`ALERT_TYPE_*`, `TABLE_STATUS_*`) sincronizados entre backend mocks y frontend.
- Cambios de contrato requieren checklist en `PROJECT_GUIDELINES` > Integraciones y aviso a documentaci�n.

### DevOps
- Validar `npm run lint` y `npm run build` antes de abrir PR. No se permite `--force` en CI.
- Actualizar scripts en `scripts/` con comentarios y pruebas manuales; documentar comandos auxiliares en `WORKFLOWS.md`.
- Ejecutar `node scripts/update-roadmap.js` al finalizar una rama feature para mantener ROADMAP al d�a.

### UX/UI
- Seguir el design system propuesto (colores base `--brand-accent` y tipograf�as Inter / JetBrains Mono).
- Entregar wireframes o capturas en cada PR visual; documentar accesibilidad y microcopys relevantes.
- Mantener consistencia de iconograf�a (Lucide) y estados vac�os ilustrados.

### Documentaci�n
- Actualizar `PROJECT_OVERVIEW.md` y la secci�n correspondiente del README cuando se agreguen features.
- Registrar manuales y gu�as t�cnicas en `.codex/agents/documentation/*` al finalizar cada iteraci�n.
- Checklist de documentaci�n debe completarse en el punto 7 antes de cerrar sprint.

### Testing
- Para el milestone 4 ejecutar `npm test` (Vitest) incluyendo la suite `app/api/__tests__/orders-api.test.ts` antes de QA/entrega.
- Nuevos m�dulos requieren al menos pruebas manuales documentadas en la sesi�n del agente testing.
- Automatizar casos cr�ticos (pedidos, pagos) en cuanto est�n disponibles APIs reales; priorizar cobertura de regresi�n.
- Usar Lighthouse y k6 seg�n lineamientos en `WORKFLOWS.md` para performance y carga.

---

## 3. Consideraciones de Negocio / Costos
- Mantener trazabilidad de tareas cr�ticas para pagos y anal�ticas (alta prioridad comerciales).
- Optimizar tiempos de desarrollo compartiendo componentes y mocks; evitar desarrollo duplicado entre equipos.
- Evitar costos de infraestructura innecesarios: ambientes ef�meros s�lo cuando la feature impacte a varias �reas.

---

## 4. Integraciones Externas
- APIs: Mercado Pago (checkout), Stripe (fallback internacional), DataDog (logs), Slack (alertas operativas).
- SDKs: Mercado Pago SDK JS, Stripe JS, Socket.io client.
- M�todos de pago / autenticaci�n: OAuth con Mercado Pago, API keys en Vault para Stripe, SSO corporativo (OAuth2) para staff.

---

## 5. Seguridad y Compliance
- Reglas de seguridad a seguir (ej. PCI DSS, GDPR).
- Logs obligatorios (accesos cr�ticos, operaciones de pago y cambios de estado de mesa).
- Manejo de datos sensibles: nunca persistir tarjetas, enmascarar datos personales en logs, usar HTTPS en todos los entornos.

---

## 6. Requisitos Especiales
- Offline-first / sincronizaci�n para tablets; cola local cuando no haya conexi�n.
- Multi-idioma (es/en) y posibilidad de multi-marca controlada por tenant.
- Escalabilidad multi-cliente (multi-tenant) y soporte para 50 sucursales concurrentes.
- Otras restricciones: tiempos de respuesta <500?ms en endpoints cr�ticos, disponibilidad 99.5?% mensual.

---

## 7. Check de Entrega
Antes de cerrar cada sprint o tarea importante, validar:
- [ ] Reglas espec�ficas cumplidas.
- [ ] Integraciones probadas.
- [ ] Seguridad aplicada.
- [ ] Documentaci�n actualizada.
