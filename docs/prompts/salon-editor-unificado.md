# Prompt: Integrar Salon y Editor de Mesas en una experiencia unificada

## Contexto
- El panel lateral separa actualmente "Salon" y "Editor de Mesas", pero ambos flujos dependen del mismo layout y comparten responsables (Frontend Dev + UI Designer segun ROADMAP.md:5).
- La vista `TableMap` ya soporta modo editable mediante la prop `editable`; el staff solo deberia operar sobre el estado en vivo.
- Se busca ofrecer una experiencia unica que exponga modos distintos segun permisos del usuario.

## Objetivo general
Unificar la operacion y configuracion del salon en una sola ruta (`/salon`), incorporando pestañas o toggles para los distintos modos de trabajo, manteniendo controles de permisos por rol y documentando los cambios.

## Alcance minimo
1. "Estado en vivo": mapa de mesas en modo operativo (sin panel de edicion), lista de alertas/pedidos relevantes.
2. "Edicion": reusar `TableMap` con `editable` para admins, con panel lateral y acciones existentes.
3. "Zonas": vista (estado inicial read-only) que permita a admins gestionar zonas del salon; staff no accede.
4. Actualizar la navegacion (`SidebarNav`) para que exista un unico item "Salon". El enlace previo a `/mesas/editor` debe redirigir o desaparecer.

## Pasos sugeridos
1. Revisar `app/salon/page.tsx` y `components/table-map.tsx` para definir la arquitectura de tabs (puede usarse `Tabs` de shadcn o un toggle group).
2. Implementar control de rol: si el usuario es `staff`, renderizar solo la pestaña "Estado en vivo"; si es `admin`, habilitar las tres pestañas.
3. Migrar la logica del editor actual (`app/mesas/editor/page.tsx`) dentro del modo "Edicion" del salon y eliminar/redirect la ruta antigua.
4. Crear componente o seccion para "Zonas" reutilizando `layout.zones`; permitir ajustes unicamente a admins (puede quedar como placeholder editable minimo, pero con estructura clara para futuras mejoras).
5. Actualizar `SidebarNav` para reflejar el item unico y asegurar que la ruta activa siga destacando correctamente.
6. Limpiar textos con problemas de encoding ("SalA3n", "ConfiguraciA3n") en las vistas que se toquen durante la tarea.
7. Si se requiere nueva logica de layout persistente, coordinar con el agente **Lib Logic Owner** y, de ser necesario, con **Backend Architect** para endpoints reales. Documentar cualquier dependencia pendiente.

## Documentacion y seguimiento
- Añadir una entrada a la seccion correspondiente de `ROADMAP.md` o un archivo de notas (`docs/CHANGELOG.md` si existe) que describa la unificacion del salon.
- Actualizar `PROJECT_OVERVIEW.md` (o la documentacion pertinente) para reflejar el nuevo flujo de acceso al editor.
- Registrar en la carpeta `.codex/agents` (ej. nota en `design` o `engineering`) cualquier decision relevante de UI/UX.

## Pruebas obligatorias
1. `npm run lint`
2. `npm run build`
3. Pruebas manuales:
   - Admin: navegar a `/salon`, recorrer las tres pestañas, editar una mesa y guardar; verificar que el state se actualiza.
   - Staff: iniciar sesion como `staff@staff.com`, confirmar que solo ve "Estado en vivo" y que las acciones funcionan.
   - Verificar que ningun enlace del sidebar queda roto (incluyendo navegacion directa a rutas antiguas).

## Criterios de aceptacion
- Admin y staff comparten la misma ruta `/salon` con modos controlados por rol.
- El antiguo `/mesas/editor` ya no aparece en la navegacion y redirige o muestra mensaje acorde.
- No se introducen regresiones en el listado de mesas ni en el modo editor existente.
- Documentacion y roadmap actualizados.
- Todos los tests y checks mencionados completados antes de cerrar.

## Coordinacion
- Trabajo liderado por **Frontend Dev + UI Designer**. Validar la experiencia de tabs con UI Designer antes del merge.
- Si surgen ajustes de persistencia o eventos en tiempo real, escalar a **Lib Logic Owner** y **Backend Architect** para evaluar APIs.
- Notificar a **Cross-Team Notifier** si el cambio impacta en otros clientes/tablets.

## Entregables
- PR con descripcion completa, evidencias (capturas o gif) de los tres modos y registro de pruebas.
- Documentacion actualizada segun seccion previa.
- Nota en ROADMAP/registro indicando el cierre de la tarea.