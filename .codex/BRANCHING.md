# Branching Strategy

Este documento define cómo gestionar ramas en git.

---

## Ramas principales
- **main** → código estable, solo merges de release.
- **dev** → integración continua, merges desde feature/*.

## Ramas de trabajo
- **feature/** → nuevas funcionalidades.
- **fix/** → correcciones puntuales.
- **hotfix/** → arreglos urgentes que van directo a main.

## Flujo de trabajo
1. Crear rama desde dev.
2. Desarrollar cambios.
3. Abrir PR hacia dev.
4. Revisar y aprobar PR.
5. Merge → CI/CD valida automáticamente.

## Releases
- Rama `release/x.y.z` desde dev.
- QA y validación.
- Merge a main → tag versión SemVer.
