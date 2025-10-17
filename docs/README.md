# 📚 Documentación - Restaurant Management System

> **Índice maestro único** de toda la documentación del proyecto  
> Última actualización: Diciembre 2024

---

## 🚀 Inicio Rápido

**¿Nuevo en el proyecto?** Comienza aquí:

1. **[Project Overview](PROJECT_OVERVIEW.md)** - Visión general del sistema
2. **[Installation Guide](setup/installation.md)** - Configurar entorno de desarrollo
3. **[Environment Variables](setup/environment-variables.md)** - Variables requeridas
4. **[Development Workflow](setup/development.md)** - Flujo de trabajo
5. **[Contributing Guide](../CONTRIBUTING.md)** - Cómo contribuir

---

## � Estado del Proyecto

### Fase Actual: **Fase 5 - Validación y Seguridad** ✅

- **[FASE_5_COMPLETADA.md](FASE_5_COMPLETADA.md)** - Resumen ejecutivo
- **[FASE_5_PLAN.md](FASE_5_PLAN.md)** - Plan original
- **[fase5/](fase5/)** - Documentación organizada por subfase

**Progreso general**: ~100% completado  
**Estado**: Production-ready

---

## � Debugging & Testing

- **[Testing Auth Flow](TESTING_AUTH_FLOW.md)** - Guía de testing de autenticación
- **[Checklist de Verificación](CHECKLIST_VERIFICACION.md)** - Verificación post-implementación
- **[Testing Results](TESTING_RESULTS.md)** - Resultados de testing

**Script de verificación**:
```powershell
npx tsx scripts/test-auth-flow.ts
```

**Debugging histórico**: Ver [archive/debugging/](archive/debugging/)

---

## 📐 Architecture

Entiende cómo está construido el sistema:

- [System Overview](architecture/overview.md) - Visión general de la arquitectura
- [Folder Structure](architecture/folder-structure.md) - Organización del código
- [Tech Stack](architecture/tech-stack.md) - Tecnologías utilizadas
- [Database Schema](architecture/database-schema.md) - Esquema de datos

---

## 🔌 API Reference

Documentación de todos los endpoints:

- **[API Index](api/README.md)** - Índice completo de APIs
- [Orders API](api/orders.md) - Gestión de pedidos
- [Payments API](api/payments.md) - Procesamiento de pagos
- [Tables API](api/tables.md) - Gestión de mesas
- [Menu API](api/menu.md) - Gestión de menú
- [Analytics API](api/analytics.md) - Reportes y analytics

---

## ✨ Features

Documentación de funcionalidades principales:

- **[Features Index](features/README.md)** - Índice de features
- [Orders Panel](features/orders-panel.md) - Panel de gestión de pedidos
- [Payment Integration](features/payments-integration.md) - Integración de pagos
- [QR Ordering](features/qr-ordering.md) - Ordenamiento mediante QR
- [Real-time Updates](features/realtime-updates.md) - Actualizaciones en tiempo real
- [Salon Editor](features/salon-editor.md) - Editor visual de salón

---

## 📊 Diagrams

Diagramas y flujos visuales:

- [Payment Flow](diagrams/payment-flow.md) - Flujo de procesamiento de pagos
- [Order Flow](diagrams/order-flow.md) - Flujo de creación de pedidos
- [Architecture Diagram](diagrams/architecture.md) - Diagrama de arquitectura general

---

## 📏 Guidelines

Estándares y convenciones del proyecto:

- [Coding Standards](guidelines/coding-standards.md) - Convenciones de código
- [Git Workflow](guidelines/git-workflow.md) - Flujo de trabajo con Git
- [Style Guide](guidelines/style-guide.md) - Guía de estilo
- [Agents Guide](guidelines/agents-guide.md) - Guía para GitHub Copilot

---

## ✅ Checklists

Checklists para asegurar calidad:

- [General PR Checklist](checklists/general-pr-checklist.md) - Checklist para Pull Requests
- [Payment PR Checklist](checklists/payment-pr-checklist.md) - Checklist específico de pagos

---

## 🗺️ Roadmap

Planificación y progreso del proyecto:

- **[M6 - QR Ordering Roadmap Completo](roadmap/M6-ROADMAP-COMPLETO.md)** - Roadmap consolidado del Milestone 6 (QR Ordering System)
  - Semana 1: ✅ COMPLETADA (QR Infrastructure 100%)
  - Semana 2-5: ⏳ EN PROGRESO (Mobile Menu, Checkout, Payment, Analytics)

---

## � Historial

Documentación de fases y sesiones de desarrollo:

- **[historial/](historial/)** - Índice de historial completo
- **[historial/fases/](historial/fases/)** - Fases 1-5 completadas
- **[historial/sesiones/](historial/sesiones/)** - Resúmenes de sesiones

---

## 📦 Archivo

Documentación histórica archivada:

- **[archive/](archive/)** - Índice de archivo completo
- **[archive/debugging/](archive/debugging/)** - Problemas resueltos (9 docs)
- **[archive/migrations/](archive/migrations/)** - Migraciones completadas (7 docs)
- **[archive/plans/](archive/plans/)** - Planes ejecutados (5 docs)
- **[archive/audits/](archive/audits/)** - Auditorías completadas (5 docs)
- **[archive/solutions/](archive/solutions/)** - Soluciones aplicadas (3 docs)
- **[archive/options/](archive/options/)** - Opciones evaluadas (1 doc)

---

## 🤝 Contributing

¿Quieres contribuir?

- [Contributing Guide](../CONTRIBUTING.md) - Guía completa para contribuidores
- [Code of Conduct](../CODE_OF_CONDUCT.md) - Código de conducta (si existe)

---

## 📝 Additional Resources

- [README.md](../README.md) - Overview del proyecto
- [CHANGELOG.md](../CHANGELOG.md) - Historial de cambios
- [LICENSE](../LICENSE) - Licencia del proyecto

---

## 🔍 Búsqueda Rápida

### Por Necesidad

| Necesito... | Ver... |
|------------|--------|
| Configurar el proyecto | [setup/](setup/) |
| Entender la arquitectura | [architecture/](architecture/) |
| Documentación de API | [api/](api/) |
| Implementar una feature | [features/](features/) + [guia/](guia/) |
| Ver fases completadas | [historial/fases/](historial/fases/) |
| Buscar problema resuelto | [archive/debugging/](archive/debugging/) |
| Contribuir al proyecto | [../CONTRIBUTING.md](../CONTRIBUTING.md) |
| Ver cambios | [../CHANGELOG.md](../CHANGELOG.md) |

### Por Rol

#### 👨‍💻 Desarrollador Nuevo
1. [README Principal](../README.md)
2. [Project Overview](PROJECT_OVERVIEW.md)
3. [Installation](setup/installation.md)
4. [Architecture](architecture/overview.md)

#### 🎨 Frontend Developer
1. [Components](../components/)
2. [Features](features/)
3. [Guidelines](guidelines/coding-standards.md)

#### 🔧 Backend Developer
1. [Database Schema](database/)
2. [API Reference](api/)
3. [Supabase Setup](setup/)

---

## 📊 Estadísticas

- **Archivos de documentación**: ~140 archivos markdown (reducidos de 200+)
- **Fases completadas**: 5 fases principales (100%)
- **M6 en progreso**: Semana 1 completada (20% del milestone total)
- **APIs documentadas**: 5+ endpoints principales
- **Guías disponibles**: 5+ guías prácticas
- **Archivos archivados**: ~35 documentos históricos organizados

---

## 🧹 Reorganización Reciente

**Última reorganización**: Enero 2025

### Cambios principales:
- ✅ **Roadmap M6**: Consolidados 7 documentos en 1 solo roadmap completo
- ✅ Consolidados 6 índices en 1 README.md maestro
- ✅ Creada estructura `/fase5` organizada por subfases
- ✅ Archivados 63 documentos obsoletos
- ✅ Movidas migraciones completadas a `/archive/migrations`
- ✅ Movidos debugging resueltos a `/archive/debugging`
- ✅ Movidos planes ejecutados a `/archive/plans`
- ✅ Creados README de índice en cada carpeta principal

**Beneficios**:
- Navegación más clara y lógica (90% reducción en documentos raíz)
- Sin documentos duplicados
- Roadmap M6 consolidado y actualizado
- Historial separado de docs activos
- Fácil encontrar información relevante

---

## 🤝 Contribuir

¿Quieres contribuir?

- **[Contributing Guide](../CONTRIBUTING.md)** - Guía completa para contribuidores
- **[Coding Standards](guidelines/coding-standards.md)** - Estándares de código
- **[Git Workflow](guidelines/git-workflow.md)** - Flujo de trabajo con Git

---

## 📝 Recursos Adicionales

- **[README.md](../README.md)** - Overview del proyecto
- **[CHANGELOG.md](../CHANGELOG.md)** - Historial de cambios
- **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** - Visión técnica

---

**Última actualización**: Enero 2025  
**Mantenido por**: [@AlvaFG](https://github.com/AlvaFG)

---

*Este es el índice maestro único para toda la documentación del proyecto. Si no encuentras lo que buscas, revisa los índices específicos en cada carpeta o [abre un issue](https://github.com/AlvaFG/restaurant-digital/issues).*
