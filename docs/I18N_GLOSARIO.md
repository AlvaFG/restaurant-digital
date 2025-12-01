# 📖 Glosario de Internacionalización (i18n)

## Términos de Negocio Unificados

Este glosario asegura consistencia en las traducciones a través de todo el sistema.

### Español → English

#### Operaciones del Restaurante

| Español | English | Notas |
|---------|---------|-------|
| Pedido | Order | Usado para órdenes de clientes |
| Mesa | Table | Mesa física en el restaurante |
| Zona | Zone | Área o sección del salón |
| Menú | Menu | Lista de platos disponibles |
| Plato | Dish | Item individual del menú |
| Item | Item | Producto en el menú |
| Categoría | Category | Grupo de items del menú |
| Carrito | Cart | Carrito de compras del cliente |

#### Estados y Acciones

| Español | English | Notas |
|---------|---------|-------|
| Disponible | Available | Item o mesa disponible |
| No disponible | Unavailable | Temporalmente no disponible |
| Activo | Active | Estado activo/habilitado |
| Inactivo | Inactive | Estado deshabilitado |
| Pendiente | Pending | Esperando procesamiento |
| Preparando | Preparing | En cocina |
| Listo | Ready | Listo para servir |
| Servido | Served | Entregado al cliente |
| Completado | Completed | Finalizado |
| Cancelado | Cancelled | Cancelado |

#### Acciones Comunes

| Español | English | Notas |
|---------|---------|-------|
| Guardar | Save | Guardar cambios |
| Cancelar | Cancel | Deshacer acción |
| Eliminar | Delete | Borrar permanentemente |
| Editar | Edit | Modificar |
| Agregar | Add | Añadir nuevo |
| Quitar | Remove | Eliminar de lista |
| Confirmar | Confirm | Confirmar acción |
| Buscar | Search | Búsqueda |
| Filtrar | Filter | Aplicar filtros |
| Actualizar | Refresh/Update | Recargar o modificar |

#### Roles y Personal

| Español | English | Notas |
|---------|---------|-------|
| Personal | Staff | Personal del restaurante |
| Usuario | User | Usuario del sistema |
| Administrador | Administrator | Rol admin |
| Gerente | Manager | Rol gerencial |
| Mesero | Waiter | Personal de servicio |
| Cocina | Kitchen | Personal de cocina |
| Cajero | Cashier | Personal de caja |

#### Analítica y Reportes

| Español | English | Notas |
|---------|---------|-------|
| Analítica | Analytics | Análisis de datos |
| Reporte | Report | Informe |
| Ventas | Sales | Transacciones de venta |
| Ingresos | Revenue | Dinero recibido |
| Ticket promedio | Average ticket | Valor promedio de orden |
| Tasa de ocupación | Occupancy rate | % de mesas ocupadas |
| Tiempo de preparación | Preparation time | Tiempo en cocina |

#### Configuración

| Español | English | Notas |
|---------|---------|-------|
| Configuración | Configuration/Settings | Ajustes del sistema |
| Ajustes | Settings | Preferencias |
| Marca | Brand | Identidad de marca |
| Tema | Theme | Tema visual |
| Idioma | Language | Idioma de la interfaz |
| Notificaciones | Notifications | Alertas del sistema |
| Integraciones | Integrations | Servicios externos |

#### UI y Navegación

| Español | English | Notas |
|---------|---------|-------|
| Inicio | Home | Página principal |
| Panel | Dashboard | Panel de control |
| Resumen | Overview/Summary | Vista general |
| Detalles | Details | Información detallada |
| Gestión | Management | Administración de recursos |
| Salón | Salon | Vista del comedor |

#### Mensajes y Validaciones

| Español | English | Notas |
|---------|---------|-------|
| Error | Error | Mensaje de error |
| Éxito | Success | Operación exitosa |
| Advertencia | Warning | Mensaje de advertencia |
| Información | Information | Mensaje informativo |
| Requerido | Required | Campo obligatorio |
| Opcional | Optional | Campo no obligatorio |
| Inválido | Invalid | Valor no válido |

#### Tiempo y Fechas

| Español | English | Notas |
|---------|---------|-------|
| Fecha | Date | Día/mes/año |
| Hora | Time | Hora del día |
| Minutos | Minutes | Unidad de tiempo |
| Hace X min | X min ago | Tiempo relativo |
| Hoy | Today | Día actual |
| Ayer | Yesterday | Día anterior |

#### Pagos y Finanzas

| Español | English | Notas |
|---------|---------|-------|
| Precio | Price | Costo de item |
| Total | Total | Suma total |
| Subtotal | Subtotal | Antes de impuestos |
| Descuento | Discount | Reducción de precio |
| Impuesto | Tax | Cargo fiscal |
| Pago | Payment | Transacción de pago |
| Efectivo | Cash | Dinero en efectivo |
| Tarjeta | Card | Tarjeta de crédito/débito |

## Convenciones de Uso

### Capitalización

**Español:**
- Usar mayúscula inicial solo en títulos principales
- Acciones de botones: "Guardar cambios" (minúscula después de la primera palabra)
- Etiquetas: "Nombre de usuario" (minúscula)

**English:**
- Title Case para títulos principales: "Order Management"
- Sentence case para botones: "Save changes"
- Sentence case para etiquetas: "User name"

### Pluralización

Usar la característica de pluralización de next-intl:
```json
{
  "itemsCount": "{count, plural, =0 {Sin items} =1 {1 item} other {# items}}"
}
```

### Variables

Usar llaves para interpolación:
```json
{
  "tableNumber": "Mesa {number}",
  "minutesAgo": "Hace {minutes} min"
}
```

### Tono y Voz

**Español:**
- Informal pero profesional
- Tuteo ("Tu pedido" no "Su pedido")
- Directivo ("Ingresa tu nombre")

**English:**
- Professional and friendly
- Direct imperative ("Enter your name")
- Active voice preferred

## Términos a Evitar

### No usar

| ❌ Evitar | ✅ Usar | Razón |
|----------|--------|-------|
| Servicio de mesa | Mesa | Redundante |
| Órdenes | Pedidos | No es español natural |
| Checkout | Finalizar pedido | Anglicismo innecesario |
| Staff | Personal | Usar término español |

### Excepciones Permitidas

Algunos anglicismos son ampliamente aceptados:
- **QR** - Código QR (no traducir)
- **Email** - Correo electrónico (ambos aceptables)
- **WiFi** - No traducir

## Referencias Rápidas

### Formato de Moneda
- **ES:** $1.234,56 (ARS)
- **EN:** $1,234.56 (USD)

### Formato de Fecha
- **ES:** 15/12/2024, 14:30
- **EN:** 12/15/2024, 2:30 PM

### Separadores
- **ES:** Miles: punto (.), Decimales: coma (,)
- **EN:** Miles: coma (,), Decimales: punto (.)

---

**Última actualización:** Diciembre 2024  
**Versión:** 1.0
