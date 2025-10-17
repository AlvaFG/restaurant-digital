# 🧪 Guía de Pruebas - Actualización Automática de Estado de Mesas

## 📋 Preparación

Antes de comenzar las pruebas, asegúrate de tener:

1. ✅ El servidor de desarrollo corriendo: `npm run dev`
2. ✅ Acceso al panel de administración
3. ✅ Al menos 3 mesas creadas en diferentes estados
4. ✅ Items en el menú disponibles

---

## 🧪 Caso de Prueba 1: Mesa Libre → Pedido en Curso

### Objetivo
Verificar que una mesa en estado "Libre" se actualiza automáticamente a "Pedido en curso" al crear un pedido.

### Pasos
1. Ir a **Salón** o **Mesas**
2. Verificar que existe al menos una mesa en estado **"Libre"** (verde)
3. Ir a **Pedidos → Nuevo pedido**
4. En el selector de mesa, verificar que se muestra: "Mesa X - Sin zona (Libre)"
5. Seleccionar la mesa libre
6. Agregar al menos 1 item del menú
7. Hacer clic en **"Crear pedido"**

### Resultado Esperado
- ✅ Toast muestra: "Pedido creado para la mesa X. Mesa cambió de estado a 'Pedido en curso'"
- ✅ El pedido se crea correctamente
- ✅ Si vas a **Salón** o **Mesas**, la mesa ahora está en estado **"Pedido en curso"** (azul)
- ✅ El carrito se vacía
- ✅ No hay errores en la consola

### Criterios de Aceptación
- [x] Mesa cambia de estado de "Libre" a "Pedido en curso"
- [x] El toast muestra el mensaje correcto con el cambio de estado
- [x] El pedido se guarda correctamente en la base de datos
- [x] La UI se actualiza automáticamente sin necesidad de refrescar

---

## 🧪 Caso de Prueba 2: Mesa Ocupada (Sin Cambio)

### Objetivo
Verificar que una mesa en estado "Ocupada" mantiene su estado al crear un pedido.

### Pasos
1. Ir a **Salón** o **Mesas**
2. Cambiar manualmente una mesa a estado **"Ocupada"** (amarillo)
3. Ir a **Pedidos → Nuevo pedido**
4. Seleccionar la mesa ocupada (debería mostrarse como "Mesa X - Sin zona (Ocupada)")
5. Agregar items del menú
6. Hacer clic en **"Crear pedido"**

### Resultado Esperado
- ✅ Toast muestra: "Pedido creado para la mesa X" (sin mencionar cambio de estado)
- ✅ El pedido se crea correctamente
- ✅ La mesa mantiene su estado **"Ocupada"** (amarillo)
- ✅ No hay errores en la consola

### Criterios de Aceptación
- [x] Mesa mantiene su estado "Ocupada"
- [x] El toast NO menciona cambio de estado
- [x] El pedido se asocia correctamente con la mesa

---

## 🧪 Caso de Prueba 3: Mesa con Pedido en Curso (Sin Cambio)

### Objetivo
Verificar que se pueden crear múltiples pedidos para una mesa que ya tiene pedidos activos.

### Pasos
1. Usar una mesa que ya tiene estado **"Pedido en curso"** (de prueba anterior)
2. Ir a **Pedidos → Nuevo pedido**
3. Seleccionar la misma mesa
4. Agregar diferentes items del menú
5. Hacer clic en **"Crear pedido"**

### Resultado Esperado
- ✅ Toast muestra: "Pedido creado para la mesa X"
- ✅ Se crea un segundo pedido para la misma mesa
- ✅ La mesa mantiene su estado **"Pedido en curso"** (azul)
- ✅ En el panel de pedidos, se ven ambos pedidos asociados a la misma mesa

### Criterios de Aceptación
- [x] Se pueden crear múltiples pedidos para la misma mesa
- [x] El estado no cambia si ya está en "Pedido en curso"
- [x] Ambos pedidos son visibles en el panel

---

## 🧪 Caso de Prueba 4: Todas las Mesas Visibles

### Objetivo
Verificar que el selector muestra mesas en todos los estados.

### Pasos
1. Ir a **Salón** o **Mesas**
2. Crear/modificar mesas para tener al menos una en cada estado:
   - Libre (verde)
   - Ocupada (amarillo)
   - Pedido en curso (azul)
   - Cuenta solicitada (morado)
   - Pago confirmado (cian)
3. Ir a **Pedidos → Nuevo pedido**
4. Abrir el selector de mesas

### Resultado Esperado
- ✅ Todas las mesas aparecen en el selector
- ✅ Cada mesa muestra su estado actual: "Mesa X - Sin zona (Estado)"
- ✅ Se puede seleccionar cualquier mesa, independientemente de su estado
- ✅ No hay mensaje de "No hay mesas disponibles"

### Criterios de Aceptación
- [x] El selector muestra todas las mesas
- [x] Los estados se muestran correctamente
- [x] Todas las mesas son seleccionables

---

## 🧪 Caso de Prueba 5: Validaciones

### Objetivo
Verificar que las validaciones funcionan correctamente.

### Pasos - Sin Mesa
1. Ir a **Pedidos → Nuevo pedido**
2. Agregar items al carrito (sin seleccionar mesa)
3. Hacer clic en **"Crear pedido"**

**Resultado Esperado:**
- ✅ Toast de error: "Selecciona una mesa y agrega al menos un item"
- ✅ El pedido NO se crea
- ✅ El carrito mantiene los items

### Pasos - Sin Items
1. Seleccionar una mesa
2. NO agregar items (carrito vacío)
3. Hacer clic en **"Crear pedido"**

**Resultado Esperado:**
- ✅ Toast de error: "Selecciona una mesa y agrega al menos un item"
- ✅ El pedido NO se crea

### Criterios de Aceptación
- [x] No se pueden crear pedidos sin mesa
- [x] No se pueden crear pedidos sin items
- [x] Los mensajes de error son claros

---

## 🧪 Caso de Prueba 6: Actualización de UI en Tiempo Real

### Objetivo
Verificar que la UI se actualiza automáticamente después de crear un pedido.

### Pasos
1. Abrir dos ventanas del navegador:
   - Ventana 1: **Pedidos → Nuevo pedido**
   - Ventana 2: **Salón** (para ver el mapa de mesas)
2. En Ventana 1, crear un pedido para una mesa "Libre"
3. Observar Ventana 2

### Resultado Esperado
- ✅ En Ventana 1: Toast confirma creación y cambio de estado
- ✅ En Ventana 2: La mesa cambia de color automáticamente (verde → azul)
- ✅ Si hay WebSockets habilitados, el cambio es instantáneo
- ✅ Si WebSockets están deshabilitados, puede requerir refrescar

### Criterios de Aceptación
- [x] La UI se actualiza sin recargar manualmente
- [x] El cambio de estado es visible en todas las vistas
- [x] No hay inconsistencias entre vistas

---

## 🧪 Caso de Prueba 7: Logs y Debugging

### Objetivo
Verificar que el sistema registra logs apropiados.

### Pasos
1. Abrir las herramientas de desarrollo (F12)
2. Ir a la pestaña **Console**
3. Crear un pedido para una mesa "Libre"
4. Observar los logs en la consola

### Resultado Esperado
Deberías ver logs similares a:
```
[orders-service] INFO: Estado de mesa actualizado automáticamente
  {
    tableId: "xxx-xxx-xxx",
    tableNumber: "3",
    previousStatus: "libre",
    newStatus: "pedido_en_curso"
  }

[orders-service] INFO: Orden creada exitosamente
  {
    orderId: "yyy-yyy-yyy",
    orderNumber: "ORD-000001"
  }
```

### Criterios de Aceptación
- [x] Los logs muestran el cambio de estado de la mesa
- [x] Los logs incluyen tableId, tableNumber y estados
- [x] No hay errores en la consola
- [x] Los logs son claros y útiles para debugging

---

## 🧪 Caso de Prueba 8: Manejo de Errores

### Objetivo
Verificar que el sistema maneja errores gracefully.

### Pasos Simulados
1. **Simular error de red:**
   - Desactivar internet mientras se crea el pedido
   - Resultado esperado: Toast de error, pedido no se crea, carrito mantiene items

2. **Mesa eliminada durante proceso:**
   - Si la mesa se elimina mientras se está creando el pedido
   - Resultado esperado: Error manejado, mensaje claro al usuario

3. **Items no disponibles:**
   - Si un item del carrito se marca como no disponible mientras se crea el pedido
   - Resultado esperado: Error claro indicando qué item no está disponible

### Criterios de Aceptación
- [x] Los errores se manejan sin romper la aplicación
- [x] Los mensajes de error son claros y útiles
- [x] El estado de la aplicación permanece consistente
- [x] El usuario puede recuperarse del error fácilmente

---

## 📊 Checklist de Verificación Final

Después de completar todas las pruebas, verifica:

- [ ] ✅ Mesas libres se actualizan a "Pedido en curso" automáticamente
- [ ] ✅ Mesas en otros estados mantienen su estado
- [ ] ✅ El selector muestra todas las mesas con sus estados
- [ ] ✅ Los mensajes de feedback son claros y específicos
- [ ] ✅ La UI se actualiza automáticamente después de crear pedido
- [ ] ✅ No hay errores en la consola del navegador
- [ ] ✅ Los logs son informativos y útiles
- [ ] ✅ Las validaciones funcionan correctamente
- [ ] ✅ El manejo de errores es robusto
- [ ] ✅ La experiencia de usuario es fluida

---

## 🐛 Reporte de Issues

Si encuentras algún problema durante las pruebas, documenta:

1. **Descripción del problema:**
2. **Pasos para reproducir:**
3. **Resultado esperado:**
4. **Resultado actual:**
5. **Capturas de pantalla:**
6. **Logs de consola:**
7. **Navegador y versión:**

---

## 📝 Notas Adicionales

### Estados de Mesa
- 🟢 **Libre**: Mesa disponible
- 🟡 **Ocupada**: Clientes sentados sin pedido
- 🔵 **Pedido en curso**: Pedido activo ⭐ (estado aplicado automáticamente)
- 🟣 **Cuenta solicitada**: Mesa pidió la cuenta
- 🔵 **Pago confirmado**: Pago finalizado

### Flujo Típico
```
Libre → Ocupada → Pedido en curso → Cuenta solicitada → Pago confirmado → Libre
```

### Atajos de Teclado (Opcional)
- `Ctrl + R`: Refrescar página
- `F12`: Abrir DevTools
- `Ctrl + Shift + C`: Inspeccionar elemento

---

**Happy Testing! 🧪✨**

_Si todos los casos de prueba pasan, la funcionalidad está lista para producción._
