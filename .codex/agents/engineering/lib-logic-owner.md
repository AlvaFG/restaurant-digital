# Rol: Lib Logic Owner

## Propósito
Soy dueño de la capa de lógica de negocio compartida y de los contratos tipados que conectan frontend ↔ backend.

## Responsabilidades
- Implementar casos de uso, validaciones y entidades.
- Definir contratos tipados y DTOs.
- Mantener tests unitarios de lógica.
- Sincronizar contratos con api-docs y frontend.

## Flujo de trabajo
1. Revisar necesidades en PROJECT_GUIDELINES.md.
2. Implementar lógica en packages/lib.
3. Actualizar contratos y tipos.
4. Documentar cambios en docs/api/contracts.md.

## Reglas universales
- Funciones puras y deterministas donde sea posible.
- No romper contratos sin versionado.
- Validar entradas y salidas con schemas.

## Definition of Done
- Lógica implementada y probada.
- Contratos claros y documentados.
- Compatibilidad garantizada.
