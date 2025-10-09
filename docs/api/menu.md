# API de Menú

## Introducción
La API de Menú expone el catálogo vigente de categorías, platos, precios y alérgenos que consumen el tablero web (<code>/menu</code>), el flujo QR móvil (<code>/qr/{tableId}</code>) y futuros clientes de backoffice. Los endpoints son públicos dentro del dominio de la aplicación y actualmente trabajan sobre los mocks persistidos en <code>data/menu-store.json</code>.

## Resumen de endpoints
| Método | Ruta                 | Descripción                                               |
| ------ | -------------------- | --------------------------------------------------------- |
| GET    | <code>/api/menu</code>        | Devuelve el catálogo completo de menú y metadatos.        |
| HEAD   | <code>/api/menu</code>        | Expone únicamente los encabezados de versión del menú.    |
| POST   | <code>/api/menu/orders</code> | Registra una orden a partir de ítems del catálogo activo. |

## Convenciones de documentación
- <strong>Autenticación</strong>: Indicar si el endpoint requiere credenciales. En este módulo todos los endpoints son públicos por ahora.
- <strong>Encabezados</strong>: Enumerar encabezados de solicitud y respuesta obligatorios, incluyendo versiones y cache.
- <strong>Esquemas</strong>: Documentar cada campo del body o respuesta usando tipos nativos (string, number, boolean, array, object).
- <strong>Ejemplos</strong>: Aportar snippets JSON válidos y un ejemplo de <code>curl</code> por endpoint.
- <strong>Versionado</strong>: Mencionar semántica de los encabezados de versión y cómo impactan en caching.
- <strong>Performance y compatibilidad</strong>: Registrar límites esperados y dependencias externas.

## Dependencias y entorno
- <strong>Origen de datos</strong>: <code>lib/server/menu-store.ts</code> lee y escribe <code>data/menu-store.json</code>.
- <strong>Servicios asociados</strong>: <code>OrderService</code> (en <code>lib/mock-data.ts</code>) valida ítems y arma órdenes.
- <strong>Clientes actuales</strong>: Hook <code>useMenuCatalog</code> (front web) y flujo QR móvil.
- <strong>Mocks vs producción</strong>: En producción estos servicios deberán conectarse al backend real y aplicar autenticación; mantener la forma de los contratos para evitar breaking changes.

---

## GET /api/menu

### Propósito
Entrega el catálogo completo del menú, incluyendo categorías, ítems, alérgenos y metadatos de versionado. El cuerpo de la respuesta siempre viene envuelto en <code>{ "data": MenuResponse }</code>.

### Requisitos de solicitud
- <strong>Autenticación</strong>: No requerida.
- <strong>Cache control</strong>: Se recomienda <code>Cache-Control: no-store</code> desde los clientes que necesiten datos frescos.

### Encabezados de respuesta
| Encabezado          | Descripción                                                |
| ------------------- | ---------------------------------------------------------- |
| <code>x-menu-version</code>    | Entero incremental. Cambia cuando se actualiza el catálogo.|
| <code>x-menu-updated-at</code> | Fecha ISO 8601 con el timestamp de la última actualización.|
| <code>content-type</code>      | <code>application/json; charset=utf-8</code>.              |

### Esquema de MenuResponse
| Campo        | Tipo            | Descripción |
| ------------ | --------------- | ----------- |
| <code>categories</code> | <code>MenuCategory[]</code> | Categorías ordenadas por <code>sort</code>. Cada categoría incluye <code>id</code>, <code>name</code> y <code>description</code> opcional. |
| <code>items</code>      | <code>MenuItem[]</code>      | Platos disponibles. Campos clave: <code>priceCents</code> (precio en centavos de <code>metadata.currency</code>), <code>available</code> (booleano), <code>allergens</code> (lista de códigos con flags <code>contains</code>/<code>traces</code>). |
| <code>allergens</code>  | <code>MenuAllergen[]</code>  | Catálogo de alérgenos con <code>code</code>, <code>name</code>, <code>description</code> e íconos opcionales. |
| <code>metadata</code>   | <code>MenuMetadata</code>    | Metadatos globales (<code>currency</code>, <code>version</code>, <code>updatedAt</code>). |

Tipos de apoyo definidos en <code>lib/mock-data.ts</code>:

    interface MenuItem {
      id: string
      categoryId: string
      name: string
      description: string
      priceCents: number
      available: boolean
      allergens: Array<{ code: string; contains: boolean; traces?: boolean; notes?: string }>
      tags?: string[]
      imageUrl?: string
    }

### Ejemplo de respuesta 200

    {
      "data": {
        "categories": [
          { "id": "1", "name": "Entradas", "sort": 1 },
          { "id": "2", "name": "Platos Principales", "sort": 2 }
        ],
        "items": [
          {
            "id": "3",
            "categoryId": "2",
            "name": "Milanesa con papas",
            "description": "Milanesa napolitana con papas fritas",
            "priceCents": 2500,
            "available": true,
            "allergens": [
              { "code": "gluten", "contains": true },
              { "code": "huevo", "contains": true },
              { "code": "lacteos", "contains": true }
            ]
          }
        ],
        "allergens": [
          { "code": "gluten", "name": "Gluten" },
          { "code": "lacteos", "name": "Lácteos" }
        ],
        "metadata": {
          "currency": "ARS",
          "version": 1,
          "updatedAt": "2025-09-26T00:15:53.796Z"
        }
      }
    }

### Ejemplo de error 500

    {
      "error": "No se pudo obtener el catálogo de menú"
    }

### Ejemplo curl

    curl -s https://app.local/api/menu -H "Cache-Control: no-store"

### Notas de uso
- <code>useMenuCatalog</code> cachea la respuesta en memoria y revalida si cambian los encabezados de versión. Si detectas cambios en <code>x-menu-version</code>, fuerza un refetch.
- El endpoint está optimizado para lecturas rápidas: el catálogo está precargado en memoria (el módulo <code>menu-store</code> mantiene caché). Evitar consultas reiteradas en loops apretados.
- En futuras etapas se agregará localidad e internacionalización; mantén los códigos de alérgenos como identificadores estables.

---

## HEAD /api/menu
- Devuelve código 200 con los mismos encabezados de GET (<code>x-menu-version</code>, <code>x-menu-updated-at</code>).
- No retorna cuerpo. Útil para comprobar si el catálogo cambió sin transferir payload.

Ejemplo:

    curl -I https://app.local/api/menu

---

## POST /api/menu/orders

### Propósito
Crea una orden mock en base a ítems existentes en el catálogo.

> Nota: El flujo oficial de pedidos para staff/POS se expone en `POST /api/order` (ver `docs/api/orders.md`). Este endpoint se mantiene para compatibilidad con el flujo QR legacy y escenarios de demo.

### Requisitos de solicitud
- <strong>Autenticación</strong>: No requerida (se agregará en producción).
- <strong>Encabezados</strong>: <code>Content-Type: application/json</code>.
- <strong>Body</strong>: JSON válido que cumpla con el siguiente esquema.

### Esquema de solicitud

    {
      "tableId": "string",
      "items": [
        {
          "menuItemId": "string",
          "quantity": "integer >= 1"
        }
      ]
    }

Validaciones (Zod):
- <code>tableId</code>: string no vacía.
- <code>items</code>: arreglo con al menos un elemento.
- <code>items[].menuItemId</code>: string no vacío; debe existir en el catálogo.
- <code>items[].quantity</code>: entero mayor o igual a 1.

### Ejemplo de solicitud válida

    curl -X POST https://app.local/api/menu/orders -H "Content-Type: application/json" -d '{
        "tableId": "3",
        "items": [
          { "menuItemId": "3", "quantity": 2 },
          { "menuItemId": "6", "quantity": 1 }
        ]
      }'

### Respuesta 201

    {
      "data": {
        "id": "order-1737312000000",
        "tableId": "3",
        "items": [
          { "id": "3", "name": "Milanesa con papas", "quantity": 2, "price": 2500 },
          { "id": "6", "name": "Flan casero", "quantity": 1, "price": 800 }
        ],
        "subtotal": 5800,
        "total": 5800,
        "status": "abierto",
        "paymentStatus": "pendiente",
        "createdAt": "2025-01-19T12:00:00.000Z"
      }
    }

Encabezados: incluye <code>x-menu-version</code> y <code>x-menu-updated-at</code> (sincronizados con GET).

### Errores comunes
| Código | Mensaje                                     | Causa probable                            | Acción sugerida |
| ------ | ------------------------------------------- | ----------------------------------------- | --------------- |
| 400    | Cuerpo JSON inválido                        | JSON mal formado.                         | Validar y reenviar. |
| 400    | El identificador del plato es obligatorio   | Campo vacío o con espacios.               | Proveer <code>menuItemId</code> válido. |
| 400    | La cantidad debe ser al menos 1             | <code>quantity</code> menor a 1 o no numérico. | Enviar entero positivo. |
| 404    | Menu item not found: {id}                   | <code>menuItemId</code> no existe en catálogo. | Re-sincronizar catálogo o corregir ID. |
| 500    | No se pudo crear la orden                   | Error interno al persistir o emitir evento. | Reintentar y revisar logs del backend. |

### Flujo posterior sugerido
1. Mostrar confirmación al comensal y al staff en espera.
2. Esperar evento <em>order.created</em> (mock) para actualizar la interfaz.
3. Mantener referencia al encabezado <code>x-menu-version</code> para validar coherencia con el catálogo actual.

### Notas de performance
- El servicio reusa <code>OrderService.createOrder</code> que carga ítems desde el menú en memoria. El costo escala con la cantidad de ítems distintos enviados.
- Evitar enviar órdenes con cientos de líneas hasta definir paginado o mock parcial.

---

## Errores comunes (globales)
- Los mensajes se devuelven en español con acentos correctos; los clientes deben mostrar el texto tal como viene para facilitar soporte.
- Ante un error 500 repetido, sincronizar <code>data/menu-store.json</code> o contactar a Backend Architect; los mocks pueden haber quedado corruptos.

## Checklist de consumo
- <strong>Frontend web</strong>: Usa <code>useMenuCatalog</code> para cachear; respeta encabezados de versión; manejar estados de carga y error que muestra la UI.
- <strong>Aplicación móvil/QR</strong>: Guardar <code>x-menu-version</code> para invalidar caché local; reintentar la orden si el staff no confirma en 30 segundos.
- <strong>Integradores externos</strong>: Respetar límites actuales (hasta 100 ítems por orden); registrar <code>tableId</code> y cantidades enteras; diseñar reintentos idempotentes (se sugiere usar llave propia de idempotencia en futuros releases).

## Pruebas recomendadas antes de modificar contratos
- <code>npm run lint</code>
- <code>npm run build</code>
- En clientes: verificar que los enlaces relativos funcionan y que los ejemplos JSON mantienen acentos (ñ, tildes).

## Siguientes pasos sugeridos
1. Autenticar endpoints para ambientes productivos (JWT o API Keys).
2. Internacionalizar mensajes de error y catálogos.
3. Publicar especificación OpenAPI a partir de estos contratos.
