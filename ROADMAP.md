| Milestone                             | Tarea                                                          | Rama                                 | Responsable                          | Estado     |
| ------------------------------------- | -------------------------------------------------------------- | ------------------------------------ | ------------------------------------ | ---------- |
| **1 � Setup inicial & base t�cnica**  | Configurar CI/CD basico (lint, test, build)                    | `feature/ci-setup`                   | DevOps Automator                     | Hecho       |
| **2 � Core de mesas**                 | Definir modelo de estados de mesa (libre, ocupada, pago)       | `feature/lib-table-states`           | Lib Logic Owner                      | Pendiente  |
| **2 � Core de mesas**                 | Crear mapa visual de mesas en frontend                         | `feature/ui-table-map`               | Frontend Dev + UI Designer           | Hecho       |
| **2 � Core de mesas**                 | Backend para actualizar estado de mesa                         | `feature/backend-tables-api`         | Backend Architect                    | Hecho       |
| **2 � Core de mesas**                 | Anal�ticas b�sicas de cubiertos por mesa                       | `feature/backend-covers-tracking`    | Backend Architect + Analytics Reporter | Pendiente |
| **3 � Men� digital (tablet + QR)**    | API de categor�as, platos, precios y al�rgenos                 | `feature/backend-menu-api`           | Backend Architect                    | Pendiente  |
| **3 � Men� digital (tablet + QR)**    | Pantalla de men� en frontend (tablet/QR)                       | `feature/frontend-menu-page`         | Frontend Dev                         | Pendiente  |
| **3 � Men� digital (tablet + QR)**    | Flujo QR (acceso a men� desde celular)                         | `feature/mobile-qr-flow`             | Mobile App Builder                   | Pendiente  |
| **3 � Men� digital (tablet + QR)**    | Documentar `GET /menu` y `POST /order`                         | `feature/docs-api-menu`              | API Docs Writer                      | Pendiente  |
| **4 � Pedidos y notificaciones**      | Endpoint `POST /order`                                         | `feature/backend-orders-api`         | Backend Architect                    | Pendiente  |
| **4 � Pedidos y notificaciones**      | Vista de pedidos activos en staff/admin                        | `feature/frontend-orders-panel`      | Frontend Dev                         | Pendiente  |
| **4 � Pedidos y notificaciones**      | Notificaciones en tiempo real (sockets)                        | `feature/lib-socket-events`          | Lib Logic Owner + DevOps Automator   | Pendiente  |
| **4 � Pedidos y notificaciones**      | Tests de API de pedidos                                        | `feature/test-api-orders`            | API Tester                           | Pendiente  |
| **5 � Pagos digitales**               | Integrar pasarela de pago (Mercado Pago / Stripe / Google Pay) | `feature/backend-payments-api`       | Backend Architect                    | Pendiente  |
| **5 � Pagos digitales**               | Pantalla de checkout en frontend                               | `feature/ui-payment-screen`          | Frontend Dev                         | Pendiente  |
| **5 � Pagos digitales**               | L�gica de cambio de estado mesa tras pago                      | `feature/lib-payment-flow`           | Lib Logic Owner                      | Pendiente  |
| **5 � Pagos digitales**               | Tests de flujo de pago                                         | `feature/test-payment-flow`          | Workflow Optimizer + API Tester      | Pendiente  |
| **6 � Anal�ticas y m�tricas**         | Dashboard de ventas (d�a, mesa, producto)                      | `feature/frontend-analytics-dashboard` | Frontend Dev + Analytics Reporter  | Pendiente  |
| **6 � Anal�ticas y m�tricas**         | M�trica de cubiertos atendidos                                 | `feature/backend-covers-metrics`     | Backend Architect                    | Pendiente  |
| **6 � Anal�ticas y m�tricas**         | Filtrar m�tricas por producto/categor�a                        | `feature/backend-product-analytics`  | Backend Architect                    | Pendiente  |
| **7 � Documentaci�n & QA**            | Gu�a de instalaci�n y despliegue                              | `feature/docs-setup-guide`           | Doc Writer                           | Pendiente  |
| **7 � Documentaci�n & QA**            | Documentaci�n de APIs completas                                | `feature/docs-api-complete`          | API Docs Writer                      | Pendiente  |
| **7 � Documentaci�n & QA**            | Tests de performance (checkout, carga de men�)                 | `feature/test-performance-checkout`  | Performance Benchmarker              | Pendiente  |
| **7 � Documentaci�n & QA**            | Optimizaci�n de flujos cr�ticos                                | `feature/test-workflow-optimization` | Workflow Optimizer                   | Pendiente  |

