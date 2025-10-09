# Covers Analytics API

The covers tracking endpoints expose normalized table data, version metadata, and running totals used by the salon dashboard and reporting widgets. All responses include cache-busting headers so clients can detect updates without polling the entire store.

## PATCH /api/tables/:id/covers

Updates the current cover count for a single table. The payload must contain an integer current value between 0 and 500.

### Request

`http
PATCH /api/tables/6/covers
Content-Type: application/json

{
  "current": 4
}
`

### Success response

`http
HTTP/1.1 200 OK
x-table-store-version: 7
x-table-store-updated-at: 2025-09-26T17:48:12.091Z
Content-Type: application/json

{
  "data": {
    "id": "6",
    "number": 6,
    "zone": "Terraza",
    "seats": 8,
    "status": "libre",
    "covers": {
      "current": 4,
      "total": 18,
      "sessions": 3,
      "lastUpdatedAt": "2025-09-26T17:48:12.091Z",
      "lastSessionAt": "2025-09-26T15:03:40.002Z"
    }
  },
  "metadata": {
    "version": 7,
    "updatedAt": "2025-09-26T17:48:12.091Z",
    "totals": {
      "current": 12,
      "total": 134,
      "sessions": 42
    },
    "limits": {
      "maxCurrent": 500
    }
  }
}
`

### Error responses

`http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": { "message": "El campo 'current' debe ser un entero entre 0 y 500" }
}
`

`http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": { "message": "Mesa no encontrada" }
}
`

`http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": { "message": "No se pudieron actualizar los cubiertos" }
}
`

## GET /api/tables/:id/covers

Returns the last persisted cover snapshot using the same shape as the PATCH response. Use this endpoint to pre-fill forms or restore optimistic updates.

`http
HTTP/1.1 200 OK
x-table-store-version: 7
x-table-store-updated-at: 2025-09-26T17:48:12.091Z
Content-Type: application/json

{
  "data": {
    "id": "6",
    "number": 6,
    "zone": "Terraza",
    "seats": 8,
    "status": "libre",
    "covers": {
      "current": 4,
      "total": 18,
      "sessions": 3,
      "lastUpdatedAt": "2025-09-26T17:48:12.091Z",
      "lastSessionAt": "2025-09-26T15:03:40.002Z"
    }
  },
  "metadata": {
    "version": 7,
    "updatedAt": "2025-09-26T17:48:12.091Z",
    "totals": {
      "current": 12,
      "total": 134,
      "sessions": 42
    },
    "limits": {
      "maxCurrent": 500
    }
  }
}
`

## GET /api/analytics/covers

Aggregates cover metrics for every table and exposes derived metadata for dashboards.

`http
HTTP/1.1 200 OK
x-table-store-version: 7
x-table-store-updated-at: 2025-09-26T17:48:12.091Z
x-analytics-generated-at: 2025-09-26T17:48:12.128Z
Content-Type: application/json

{
  "data": {
    "tables": [
      {
        "id": "1",
        "number": 1,
        "zone": "Salón Principal",
        "seats": 4,
        "current": 0,
        "total": 26,
        "sessions": 8,
        "lastSessionAt": "2025-09-26T16:22:10.443Z",
        "lastUpdatedAt": "2025-09-26T16:25:55.901Z",
        "status": "libre"
      }
    ],
    "totals": {
      "current": 12,
      "total": 134,
      "sessions": 42
    }
  },
  "metadata": {
    "version": 7,
    "updatedAt": "2025-09-26T17:48:12.091Z",
    "generatedAt": "2025-09-26T17:48:12.128Z",
    "tableCount": 18,
    "totals": {
      "current": 12,
      "total": 134,
      "sessions": 42
    },
    "limits": {
      "maxCurrent": 500
    },
    "maxCurrentCovers": 500
  }
}
`

### Table fields

Each table entry exposes

| Campo            | Descripción                                                |
| ---------------- | ---------------------------------------------------------- |
| 
umber         | Número visible de la mesa                                  |
| zone           | Zona geográfica (
ull si no está asignada)               |
| current        | Cubiertos actualmente servidos en la mesa                  |
| 	otal          | Cubiertos acumulados en la jornada                         |
| sessions       | Cantidad de rotaciones completadas                         |
| lastSessionAt  | ISO-8601 del cierre más reciente (
ull si no existe)     |
| lastUpdatedAt  | Última vez que se ajustaron cubiertos manualmente          |
| status         | Estado actual de la mesa (libre, ocupada, etc.)        |

## Headers & Metadata

- x-table-store-version incrementa cada mutación para permitir invalidar caches.
- x-table-store-updated-at refleja el updatedAt global del store.
- x-analytics-generated-at indica cuándo se calculó la agregación.
- metadata.totals replica el resumen global para consumidores que no quieran recorrer todas las mesas.
- metadata.limits.maxCurrent define el máximo de cubiertos admitido por mesa (500 por defecto).

## Consideraciones de rendimiento

- Los endpoints se sirven con cache: no-store; use metadata.version para evitar lecturas redundantes.
- El store se normaliza y recalcula coverTotals en cada mutación, por lo que consultar /api/analytics/covers no requiere recorrer el historial.
- Validaciones aplican antes de mutar el store; los valores negativos o mayores a 500 generan 400 Bad Request.

## Extensiones futuras

- Cada actualización de cubiertos incluye un comentario TODO para emitir eventos WebSocket cuando se implemente Milestone 4.
- El metadata.limits.maxCurrent está preparado para parametrizar límites por salón o sucursal cuando se incorporen múltiples locales.