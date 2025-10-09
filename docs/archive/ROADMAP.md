| Milestone                           | Tarea                                                          | Rama                                 | Responsable                          | Estado     |
| ----------------------------------- | -------------------------------------------------------------- | ------------------------------------ | ------------------------------------ | ---------- |
| **1 - Setup inicial & base tecnica** | Configurar CI/CD basico (lint, test, build)                    | `feature/ci-setup`                   | DevOps Automator                     | Hecho      |
| **2 - Core de mesas**               | Definir modelo de estados de mesa (libre, ocupada, pago)       | `feature/lib-table-states`           | Lib Logic Owner                      | Hecho      |
| **2 - Core de mesas**               | Crear mapa visual de mesas en frontend                         | `feature/ui-table-map`               | Frontend Dev + UI Designer           | Hecho      |
| **2 - Core de mesas**               | Unificar vista Salon (Estado/Edici�n/Zonas)                    | `feature/salon-unificado`            | Frontend Dev + UI Designer           | Hecho      |
| **2 - Core de mesas**               | Anal�ticas b�sicas de cubiertos por mesa                       | `feature/backend-covers-tracking`    | Backend Architect + Analytics Reporter | En curso      |
| **3 - Men� digital (tablet + QR)**  | API de categorias, platos, precios y alergias                  | `feature/backend-menu-api`           | Backend Architect                    | Hecho      |
| **3 - Men� digital (tablet + QR)**  | Pantalla de men� en frontend (tablet/QR)                       | `feature/frontend-menu-page`         | Frontend Dev                         | Hecho      |
| **3 - Men� digital (tablet + QR)**  | Flujo QR (acceso a men� desde celular)                         | `feature/mobile-qr-flow`             | Mobile App Builder                   | Hecho      |
| **3 - Men� digital (tablet + QR)**  | Documentar `GET /menu` y `POST /order`                         | `feature/docs-api-menu`              | API Docs Writer                      | Hecho      |
| **4 - Pedidos y notificaciones**    | Endpoint `POST /order`                                         | `feature/test-api-orders`            | Backend Architect                    | Hecho      |
| **4 - Pedidos y notificaciones**    | Vista de pedidos activos en staff/admin                        | `feature/test-api-orders`            | Frontend Dev                         | Hecho |
| **4 - Pedidos y notificaciones**    | Notificaciones en tiempo real (sockets)                        | `feature/test-api-orders`            | Lib Logic Owner + DevOps Automator   | Hecho  |
| **4 - Pedidos y notificaciones**    | Tests de API de pedidos                                        | `feature/test-api-orders`            | API Tester                           | Hecho      |
| **4 - Pedidos y notificaciones**    | Documentacion API de ordenes                                   | `feature/test-api-orders`            | API Docs Writer                      | Hecho      |
| **5 - Pagos digitales**             | Integrar pasarela de pago (Mercado Pago / Stripe / Google Pay) | `feature/backend-payments-api`       | Backend Architect                    | Pendiente  |
| **5 - Pagos digitales**             | Pantalla de checkout en frontend                               | `feature/ui-payment-screen`          | Frontend Dev                         | Pendiente  |
| **5 - Pagos digitales**             | Logica de cambio de estado mesa tras pago                      | `feature/lib-payment-flow`           | Lib Logic Owner                      | Pendiente  |
| **5 - Pagos digitales**             | Tests de flujo de pago                                         | `feature/test-payment-flow`          | Workflow Optimizer + API Tester      | Pendiente  |
| **6 - Analiticas y metricas**       | Dashboard de ventas (dia, mesa, producto)                      | `feature/frontend-analytics-dashboard` | Frontend Dev + Analytics Reporter  | Hecho      |
| **6 - Analiticas y metricas**       | Metrica de cubiertos atendidos                                 | `feature/backend-covers-metrics`     | Backend Architect                    | Hecho      |
| **6 - Analiticas y metricas**       | Filtrar metricas por producto/categoria                        | `feature/backend-product-analytics`  | Backend Architect                    | Pendiente  |
| **7 - Documentacion & QA**          | Guia de instalacion y despliegue                               | `feature/docs-setup-guide`           | Doc Writer                           | Pendiente  |
| **7 - Documentacion & QA**          | Documentacion de APIs completas                                | `feature/docs-api-complete`          | API Docs Writer                      | Pendiente  |
| **7 - Documentacion & QA**          | Tests de performance (checkout, carga de menu)                 | `feature/test-performance-checkout`  | Performance Benchmarker              | Pendiente  |
| **7 - Documentacion & QA**          | Optimizacion de flujos criticos                                | `feature/test-workflow-optimization` | Workflow Optimizer                   | Pendiente  |



