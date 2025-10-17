# 🧪 Guía de Testing - Botón Eliminar Zona

## 📋 Preparación

### Requisitos Previos
- ✅ Aplicación corriendo en modo desarrollo
- ✅ Base de datos Supabase configurada
- ✅ Usuario autenticado con rol admin
- ✅ Al menos 3 zonas creadas:
  - 1 zona SIN mesas asignadas
  - 1 zona CON mesas asignadas
  - 1 zona adicional para pruebas

### Iniciar Servidor de Desarrollo
```powershell
npm run dev
```

Navegar a: `http://localhost:3000/mesas`

---

## 🎯 Suite de Pruebas

### Test 1: Visibilidad del Botón ✅

**Objetivo:** Verificar que el botón aparece solo cuando corresponde

**Pasos:**
1. Ir a `/mesas`
2. En el filtro de zona, seleccionar "Todas las zonas"
3. **Resultado esperado:** ❌ NO debe aparecer botón de papelera
4. Seleccionar "Sin zona"
5. **Resultado esperado:** ❌ NO debe aparecer botón de papelera
6. Seleccionar cualquier zona específica (ej: "Terraza")
7. **Resultado esperado:** ✅ DEBE aparecer botón de papelera rojo

**Criterios de éxito:**
- [ ] Botón NO visible en "Todas las zonas"
- [ ] Botón NO visible en "Sin zona"
- [ ] Botón SÍ visible al seleccionar zona específica
- [ ] Botón tiene color rojo (destructivo)
- [ ] Botón muestra icono de papelera

---

### Test 2: Eliminar Zona Sin Mesas 🗑️

**Objetivo:** Verificar flujo completo de eliminación exitosa

**Setup:**
- Crear zona de prueba: "Zona Test 1" (sin asignar mesas)

**Pasos:**
1. Ir a `/mesas`
2. Seleccionar "Zona Test 1" en el filtro
3. Click en botón de papelera
4. **Verificar:** Aparece diálogo con título "¿Eliminar zona Zona Test 1?"
5. **Verificar:** Mensaje indica que es permanente
6. **Verificar:** Hay botones "Cancelar" y "Eliminar zona"
7. Click en "Eliminar zona"
8. **Verificar:** Botón cambia a "Eliminando..."
9. **Verificar:** Aparece toast verde: "Zona eliminada"
10. **Verificar:** Filtro vuelve a "Todas las zonas"
11. **Verificar:** "Zona Test 1" ya no aparece en el selector

**Criterios de éxito:**
- [ ] Diálogo muestra información correcta
- [ ] Estado de carga visible
- [ ] Toast de éxito aparece
- [ ] Filtro se resetea correctamente
- [ ] Zona desaparece de la lista
- [ ] Consola muestra logs de eliminación

---

### Test 3: Intentar Eliminar Zona Con Mesas ⛔

**Objetivo:** Verificar que no se puede eliminar zona con mesas

**Setup:**
- Usar zona existente con mesas (ej: "Salón Principal" con 2 mesas)

**Pasos:**
1. Ir a `/mesas`
2. Seleccionar "Salón Principal" en el filtro
3. **Verificar:** Se muestran las mesas de esa zona
4. Click en botón de papelera
5. **Verificar:** Título: "No se puede eliminar la zona Salón Principal"
6. **Verificar:** Mensaje indica número de mesas (ej: "tiene 2 mesa(s)")
7. **Verificar:** Solo hay botón "Entendido" (NO hay "Eliminar zona")
8. Click en "Entendido"
9. **Verificar:** Diálogo se cierra
10. **Verificar:** Zona sigue existiendo en el selector
11. **Verificar:** Filtro NO se resetea

**Criterios de éxito:**
- [ ] Diálogo muestra advertencia clara
- [ ] Cuenta correcta de mesas
- [ ] NO hay opción de eliminar
- [ ] Solo botón "Entendido"
- [ ] Zona permanece intacta
- [ ] NO hay toast de éxito

---

### Test 4: Cancelar Eliminación ↩️

**Objetivo:** Verificar que se puede cancelar la operación

**Pasos:**
1. Ir a `/mesas`
2. Seleccionar zona sin mesas
3. Click en botón de papelera
4. **Verificar:** Diálogo de confirmación aparece
5. Click en "Cancelar"
6. **Verificar:** Diálogo se cierra
7. **Verificar:** NO aparece toast
8. **Verificar:** Zona sigue existiendo
9. **Verificar:** Filtro NO cambia

**Criterios de éxito:**
- [ ] Botón "Cancelar" funciona
- [ ] Diálogo se cierra
- [ ] No hay cambios en el sistema
- [ ] Zona permanece seleccionada

---

### Test 5: Manejo de Errores 🚨

**Objetivo:** Verificar comportamiento ante errores

**Pasos:**
1. Desconectar internet (simular error de red)
2. Ir a `/mesas`
3. Seleccionar zona sin mesas
4. Click en botón de papelera
5. Click en "Eliminar zona"
6. **Verificar:** Toast rojo de error aparece
7. **Verificar:** Mensaje de error es claro
8. **Verificar:** Diálogo se cierra
9. **Verificar:** Zona NO fue eliminada

**Criterios de éxito:**
- [ ] Error se maneja gracefully
- [ ] Toast destructivo aparece
- [ ] Mensaje de error claro
- [ ] Sistema no queda en estado inconsistente

---

### Test 6: Actualización de UI 🔄

**Objetivo:** Verificar que la UI se actualiza correctamente

**Pasos:**
1. Anotar número total de zonas en selector
2. Eliminar una zona sin mesas
3. **Verificar:** Contador de zonas se actualiza
4. Reabrir selector de zonas
5. **Verificar:** Zona eliminada NO aparece
6. **Verificar:** Otras zonas siguen disponibles
7. Recargar página (F5)
8. **Verificar:** Cambios persisten

**Criterios de éxito:**
- [ ] UI se actualiza sin recargar
- [ ] Cambios persisten en DB
- [ ] No hay glitches visuales
- [ ] Contador actualiza correctamente

---

### Test 7: Estados de Carga ⏳

**Objetivo:** Verificar feedback visual durante operaciones

**Pasos:**
1. Seleccionar zona sin mesas
2. Abrir DevTools → Network → Throttling → Slow 3G
3. Click en botón de papelera
4. Click en "Eliminar zona"
5. **Observar:** Botón cambia a "Eliminando..."
6. **Observar:** Botón se deshabilita
7. **Observar:** Botón "Cancelar" se deshabilita
8. Esperar respuesta
9. **Verificar:** Estados vuelven a normal

**Criterios de éxito:**
- [ ] Botón muestra estado de carga
- [ ] Elementos se deshabilitan apropiadamente
- [ ] Usuario no puede hacer doble-click
- [ ] Estados vuelven a normal al finalizar

---

### Test 8: Logging y Debugging 📊

**Objetivo:** Verificar que se registran eventos correctamente

**Pasos:**
1. Abrir DevTools → Console
2. Seleccionar zona sin mesas
3. Click en botón de papelera
4. Click en "Eliminar zona"
5. **Verificar en consola:**
   - Log: "Eliminando zona"
   - Incluye: zoneId, zoneName, userId
   - Log: "Zona eliminada exitosamente"

**Criterios de éxito:**
- [ ] Logs aparecen en consola
- [ ] Incluyen información relevante
- [ ] No hay errores en consola
- [ ] Formato es consistente

---

### Test 9: Responsive Design 📱

**Objetivo:** Verificar funcionamiento en diferentes tamaños

**Pasos:**
1. Ir a `/mesas`
2. Resize ventana a móvil (375px)
3. **Verificar:** Botón de papelera visible y accesible
4. Click funciona correctamente
5. Resize a tablet (768px)
6. **Verificar:** Todo funciona igual
7. Resize a desktop (1920px)
8. **Verificar:** Todo funciona igual

**Criterios de éxito:**
- [ ] Botón accesible en móvil
- [ ] Diálogo se muestra correctamente
- [ ] Touch events funcionan
- [ ] No hay overflow

---

### Test 10: Accesibilidad ♿

**Objetivo:** Verificar accesibilidad del feature

**Pasos:**
1. Usar navegación por teclado:
   - Tab hasta el selector de zona
   - Seleccionar zona con flechas
   - Tab hasta botón de papelera
   - Enter para abrir diálogo
   - Tab entre botones
   - Enter para confirmar
2. **Verificar:** Todo accesible por teclado
3. Usar screen reader (NVDA/JAWS)
4. **Verificar:** Elementos son anunciados correctamente

**Criterios de éxito:**
- [ ] Navegación por teclado funciona
- [ ] Focus visible en todos los elementos
- [ ] Screen reader anuncia elementos
- [ ] Tooltips son accesibles

---

## 📊 Checklist Final

### Funcionalidad
- [ ] Botón aparece/desaparece correctamente
- [ ] Eliminación exitosa funciona
- [ ] Prevención de eliminación funciona
- [ ] Cancelación funciona
- [ ] Manejo de errores funciona
- [ ] UI se actualiza correctamente
- [ ] Estados de carga funcionan

### UX/UI
- [ ] Mensajes son claros
- [ ] Colores apropiados
- [ ] Tooltips informativos
- [ ] Toasts visibles
- [ ] Responsive design funciona
- [ ] Animaciones suaves

### Técnico
- [ ] No hay errores en consola
- [ ] Logging correcto
- [ ] Sin memory leaks
- [ ] Build exitoso
- [ ] TypeScript sin errores

### Accesibilidad
- [ ] Navegación por teclado
- [ ] Screen reader compatible
- [ ] Contraste adecuado
- [ ] Focus visible

---

## 🐛 Bugs Conocidos

### En Desarrollo
Ninguno detectado hasta el momento.

### Para Investigar
- [ ] Comportamiento con conexión intermitente
- [ ] Performance con muchas zonas (100+)
- [ ] Concurrent deletions (múltiples usuarios)

---

## 📝 Notas de Testing

### Datos de Prueba Sugeridos
```sql
-- Zona sin mesas (para pruebas de eliminación)
INSERT INTO zones (name, tenant_id) 
VALUES ('Test Zone 1', 'your-tenant-id');

-- Zona con mesas (para pruebas de prevención)
INSERT INTO zones (name, tenant_id) 
VALUES ('Test Zone 2', 'your-tenant-id');

INSERT INTO tables (number, zone_id, tenant_id)
VALUES (999, 'zone-id-from-above', 'your-tenant-id');
```

### Limpieza Post-Testing
```sql
-- Eliminar datos de prueba
DELETE FROM tables WHERE number = 999;
DELETE FROM zones WHERE name LIKE 'Test Zone%';
```

---

## ✅ Sign-off

### Desarrollador
- **Nombre:** _____________
- **Fecha:** _____________
- **Firma:** ✅ Código implementado y build exitoso

### QA
- **Nombre:** _____________
- **Fecha:** _____________
- **Firma:** ⏳ Pendiente de testing

### Producto
- **Nombre:** _____________
- **Fecha:** _____________
- **Firma:** ⏳ Pendiente de aprobación

---

**Estado:** ✅ **LISTO PARA QA**
