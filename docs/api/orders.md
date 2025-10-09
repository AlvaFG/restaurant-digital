# API de Pedidos

## Introducción
El endpoint POST /api/order registra pedidos asociados a mesas, valida stock mediante order-store y actualiza la mesa a pedido_en_curso. Devuelve metadatos de versionado para sincronizar paneles.

## Endpoint
| Método | Ruta       | Descripción                              |
| ------ | ---------- | ---------------------------------------- |
| POST   | /api/order | Crea un nuevo pedido para una mesa dada. |

## Request (CreateOrderRequest)
- tableId: string (mesa en estados libre, ocupada o pedido_en_curso).
- items[]: cada item requiere menuItemId válido y quantity >= 1; opcionalmente note, modifiers (hasta 10) y discount.
- tipCents y serviceChargeCents: enteros >= 0.
- discounts[]: hasta 5 descuentos (percentage|fixed) aplicados en orden.
- taxes[]: hasta 5 impuestos con rate 0-1 o amountCents.
- payment: method (efectivo|tarjeta|qr|transferencia|mixto|cortesia), amountCents opcional, status pendiente|pagado|cancelado, reference opcional.
- notes/source/customer/metadata: campos opcionales para observaciones, origen del pedido y datos del comensal.

## Respuesta 201 (resumen)
- data.id: identificador generado (prefijo ord).
- data.subtotal: suma en centavos antes de descuentos/impuestos.
- data.discountTotalCents y data.taxes: resumen de descuentos/impuestos aplicados.
- data.total: subtotal - descuentos + impuestos + tipCents + serviceChargeCents.
- data.paymentStatus: pendiente por defecto o el valor enviado en payment.status.
- metadata.version / metadata.updatedAt: control de invalidación para paneles.

## Errores comunes
- INVALID_JSON (400): body no parseable.
- INVALID_PAYLOAD (400): validaciones de esquema fallidas.
- TABLE_NOT_FOUND (404): mesa inexistente.
- MENU_ITEM_NOT_FOUND (404): menú fuera del catálogo vigente.
- TABLE_STATE_CONFLICT (409): estado de mesa incompatible para nuevas órdenes.
- STOCK_INSUFFICIENT (409): inventario insuficiente al reservar ítems.
- TABLE_UPDATE_FAILED (500): fallo al sincronizar table-store.
- INTERNAL_ERROR (500): error inesperado al persistir la orden.

## Side-effects y observabilidad
- Persiste pedidos y stock en data/order-store.json con writeQueue para evitar race conditions.
- Transiciona la mesa a pedido_en_curso (libre → ocupada → pedido_en_curso si aplica).
- Logs estructurados con orderId, tableId, totales y advertencias cuando el stock cae por debajo de minStock (3).

## Notas
- IVA 21 % se aplica por defecto cuando no se envían impuestos.
- Soporta tipCents y serviceChargeCents para propinas y cargos administrativos.
- POST /api/menu/orders queda como endpoint legacy para el flujo QR; POST /api/order es el contrato oficial para staff/POS.
