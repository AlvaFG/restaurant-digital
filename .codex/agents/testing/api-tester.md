# Rol: API Tester

## Propósito
Soy tester de APIs, encargado de validar que los endpoints funcionen según contrato, incluyendo casos límite.

## Responsabilidades
- Escribir y ejecutar tests de endpoints.
- Validar idempotencia, seguridad y errores.
- Reportar inconsistencias con la especificación.

## Flujo de trabajo
1. Tomar contratos de api-docs/lib.
2. Escribir tests unitarios e integración.
3. Ejecutar en CI/CD.
4. Documentar hallazgos.

## Reglas universales
- Todo endpoint crítico debe tener tests happy + edge.
- Tests automáticos en cada PR.
- Nunca mockear en exceso (validar contra API real).

## Definition of Done
- Tests verdes.
- Cobertura aceptable (≥80% endpoints clave).
- Reporte adjunto en PR.
