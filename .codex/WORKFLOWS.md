# Workflows

Este documento lista los scripts y flujos de trabajo estándar del proyecto.

---

## Scripts NPM
- `npm run dev` → levantar entorno local.
- `npm run build` → build de producción.
- `npm run lint` → ejecutar ESLint + Prettier.
- `npm run test` → correr tests unitarios.
- `npm run test:api` → correr tests de APIs.
- `npm run docs` → generar documentación (typedoc/storybook).
- `npm run check:deps` → revisar dependencias no usadas.
- `npm run typecheck` → validar tipos TypeScript.

## Flujo de desarrollo
1. Crear rama feature/*.
2. Implementar cambios.
3. Ejecutar lint, test y build antes de commit.
4. Subir PR → CI valida.
5. Merge a dev cuando pase revisión.

## CI/CD
- Workflow `CI` en `.github/workflows/ci.yml`.
- Se ejecuta en push y PR hacia `dev` y `feature/**`.
- Pasos: `npm ci`, `npm run lint`, `npm run build`, `npm test`.
