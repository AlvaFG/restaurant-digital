# 📚 Plan de Organización de Documentación

**Fecha:** 11 de Octubre de 2025  
**Objetivo:** Consolidar toda la documentación en una estructura clara, navegable y profesional.

---

## 🎯 Objetivos

1. **Centralizar** toda la documentación en `/docs`
2. **Eliminar duplicados** y archivos obsoletos
3. **Crear estructura lógica** por categorías
4. **Facilitar navegación** con índices claros
5. **Mantener histórico** sin contaminar documentación activa

---

## 📂 Nueva Estructura Propuesta

```
docs/
│
├── README.md                          # 🏠 Índice principal navegable
│
├── 01-inicio/                         # 🚀 Getting Started
│   ├── README.md
│   ├── instalacion.md                 # Requisitos, setup, instalación
│   ├── configuracion.md               # Variables de entorno, secrets
│   ├── primeros-pasos.md             # Tutorial básico
│   └── glosario.md                    # Términos del dominio
│
├── 02-arquitectura/                   # 🏗️ Diseño del Sistema
│   ├── README.md
│   ├── vision-general.md             # Overview del sistema
│   ├── estructura-proyecto.md        # Organización de carpetas
│   ├── patrones-diseno.md            # Decisiones arquitectónicas
│   ├── flujo-datos.md                # Data flow y estado
│   ├── base-datos/
│   │   ├── README.md
│   │   ├── esquema.md                # Tablas y relaciones
│   │   ├── migraciones.md            # Historial de cambios DB
│   │   ├── seguridad-rls.md          # Row Level Security
│   │   └── multi-tenancy.md          # Arquitectura multi-tenant
│   └── autenticacion/
│       ├── README.md
│       ├── flujo-auth.md             # Flujo de autenticación
│       ├── roles-permisos.md         # RBAC system
│       └── supabase-integration.md   # Integración con Supabase Auth
│
├── 03-desarrollo/                     # 👨‍💻 Guías para Desarrolladores
│   ├── README.md
│   ├── guia-contribucion.md          # Cómo contribuir
│   ├── convenciones-codigo.md        # Estándares de código
│   ├── git-workflow.md               # Branching strategy
│   ├── testing/
│   │   ├── README.md
│   │   ├── tests-unitarios.md
│   │   ├── tests-integracion.md
│   │   └── tests-e2e.md
│   ├── debugging/
│   │   ├── README.md
│   │   ├── herramientas.md
│   │   └── problemas-comunes.md
│   └── agentes-ia/
│       ├── README.md
│       ├── guia-uso.md               # Cómo usar agentes de IA
│       └── configuracion.md          # Setup de agentes
│
├── 04-features/                       # ⚡ Funcionalidades
│   ├── README.md
│   ├── gestion-pedidos/
│   │   ├── README.md
│   │   ├── flujo-pedido.md
│   │   ├── estados-pedido.md
│   │   └── notificaciones.md
│   ├── sistema-mesas/
│   │   ├── README.md
│   │   ├── estados-mesa.md
│   │   ├── editor-salon.md
│   │   └── ocupacion-tiempo-real.md
│   ├── codigo-qr/
│   │   ├── README.md
│   │   ├── generacion-qr.md
│   │   ├── menu-cliente.md
│   │   └── personalizacion-items.md
│   ├── pagos/
│   │   ├── README.md
│   │   ├── arquitectura-pagos.md
│   │   ├── mercadopago.md
│   │   ├── otros-gateways.md
│   │   └── dividir-cuenta.md
│   ├── analytics/
│   │   ├── README.md
│   │   ├── metricas.md
│   │   ├── reportes.md
│   │   └── dashboards.md
│   ├── alertas/
│   │   ├── README.md
│   │   ├── tipos-alertas.md
│   │   └── configuracion.md
│   └── usuarios/
│       ├── README.md
│       ├── roles.md
│       └── gestion-usuarios.md
│
├── 05-api/                            # 🔌 API Reference
│   ├── README.md                      # Índice de endpoints
│   ├── autenticacion.md               # POST /api/auth/*
│   ├── pedidos.md                     # CRUD /api/orders
│   ├── mesas.md                       # CRUD /api/tables
│   ├── menu.md                        # GET /api/menu
│   ├── pagos.md                       # POST /api/payments
│   ├── analytics.md                   # GET /api/analytics
│   ├── qr.md                          # GET /api/qr
│   ├── usuarios.md                    # CRUD /api/users
│   ├── alertas.md                     # CRUD /api/alerts
│   └── websockets.md                  # WebSocket events
│
├── 06-despliegue/                     # 🚀 Deployment
│   ├── README.md
│   ├── preparacion.md                 # Pre-deploy checklist
│   ├── variables-entorno.md           # Env vars requeridas
│   ├── vercel.md                      # Deploy en Vercel
│   ├── supabase-prod.md              # Configuración Supabase prod
│   ├── dominio-dns.md                 # Setup dominio
│   ├── monitoreo.md                   # Logging y monitoring
│   └── rollback.md                    # Plan de rollback
│
├── 07-historico/                      # 📜 Archivo e Histórico
│   ├── README.md
│   ├── changelog.md                   # Cambios por versión
│   ├── auditorias/
│   │   ├── 2025-10-11-auditoria-completa.md
│   │   └── 2025-10-11-revision-servicios.md
│   ├── migraciones/
│   │   ├── README.md
│   │   ├── de-mock-a-supabase.md
│   │   └── actualizaciones-schema.md
│   ├── sesiones-desarrollo/
│   │   ├── README.md
│   │   ├── 2025-01-10-sesion.md
│   │   ├── 2025-10-11-auth-integration.md
│   │   ├── 2025-10-11-migrations.md
│   │   └── [otras sesiones...]
│   ├── roadmaps/
│   │   ├── README.md
│   │   ├── m6-execution-plan.md
│   │   ├── milestones.md
│   │   └── [otros roadmaps...]
│   └── decisiones-arquitectonicas/
│       ├── README.md
│       ├── 001-supabase-vs-firebase.md
│       ├── 002-nextjs-app-router.md
│       └── [otras decisiones...]
│
└── 08-referencias/                    # 📖 Referencias y Recursos
    ├── README.md
    ├── glosario.md                    # Diccionario de términos
    ├── recursos-externos.md           # Links útiles
    ├── troubleshooting.md             # FAQ y soluciones
    ├── prompts/                       # Prompts para IA
    │   ├── README.md
    │   ├── revision-completa.md
    │   ├── implementacion-feature.md
    │   └── [otros prompts...]
    └── diagramas/                     # Diagramas visuales
        ├── arquitectura-sistema.png
        ├── flujo-pedido.png
        └── [otros diagramas...]
```

---

## 🔄 Plan de Migración

### Fase 1: Crear Estructura Base

```powershell
# Crear directorios
New-Item -ItemType Directory -Path docs/01-inicio
New-Item -ItemType Directory -Path docs/02-arquitectura/base-datos
New-Item -ItemType Directory -Path docs/02-arquitectura/autenticacion
New-Item -ItemType Directory -Path docs/03-desarrollo/testing
New-Item -ItemType Directory -Path docs/03-desarrollo/debugging
New-Item -ItemType Directory -Path docs/03-desarrollo/agentes-ia
New-Item -ItemType Directory -Path docs/04-features/gestion-pedidos
New-Item -ItemType Directory -Path docs/04-features/sistema-mesas
New-Item -ItemType Directory -Path docs/04-features/codigo-qr
New-Item -ItemType Directory -Path docs/04-features/pagos
New-Item -ItemType Directory -Path docs/04-features/analytics
New-Item -ItemType Directory -Path docs/04-features/alertas
New-Item -ItemType Directory -Path docs/04-features/usuarios
New-Item -ItemType Directory -Path docs/05-api
New-Item -ItemType Directory -Path docs/06-despliegue
New-Item -ItemType Directory -Path docs/07-historico/auditorias
New-Item -ItemType Directory -Path docs/07-historico/migraciones
New-Item -ItemType Directory -Path docs/07-historico/sesiones-desarrollo
New-Item -ItemType Directory -Path docs/07-historico/roadmaps
New-Item -ItemType Directory -Path docs/07-historico/decisiones-arquitectonicas
New-Item -ItemType Directory -Path docs/08-referencias/prompts
New-Item -ItemType Directory -Path docs/08-referencias/diagramas
```

### Fase 2: Mapear Archivos Existentes

#### Desde la raíz del proyecto:

| Archivo Actual | Destino |
|----------------|---------|
| `README.md` | Mantener + Mejorar |
| `AGENTS.md` | `docs/03-desarrollo/agentes-ia/guia-uso.md` |
| `CHANGELOG.md` | `docs/07-historico/changelog.md` |
| `CONTRIBUTING.md` | `docs/03-desarrollo/guia-contribucion.md` |
| `PROJECT_OVERVIEW.md` | `docs/02-arquitectura/vision-general.md` |
| `PROJECT_GUIDELINES.md` | `docs/03-desarrollo/convenciones-codigo.md` |
| `RESUMEN_REORGANIZACION.md` | `docs/07-historico/auditorias/reorganizacion.md` |
| `REPORTE_AUDITORIA_COMPLETA.md` | `docs/07-historico/auditorias/2025-10-11-completa.md` |

#### Desde docs/ actual:

| Archivo Actual | Destino |
|----------------|---------|
| `docs/database/*.md` | `docs/02-arquitectura/base-datos/` |
| `docs/payments/*.md` | `docs/04-features/pagos/` |
| `docs/api/*.md` | `docs/05-api/` |
| `docs/features/*.md` | `docs/04-features/[categoría]/` |
| `docs/roadmap/*.md` | `docs/07-historico/roadmaps/` |
| `docs/SESSION-SUMMARY-*.md` | `docs/07-historico/sesiones-desarrollo/` |
| `docs/M6-*.md` | `docs/07-historico/roadmaps/` |
| `docs/prompts/*.md` | `docs/08-referencias/prompts/` |
| `docs/diagrams/*.md` | `docs/08-referencias/diagramas/` |

### Fase 3: Crear README.md Maestro

Cada carpeta debe tener un `README.md` con:
- Descripción de la carpeta
- Lista de archivos con breve descripción
- Links a documentos relacionados

### Fase 4: Crear Índice Principal

`docs/README.md` debe ser el punto de entrada con:
- Tabla de contenidos clara
- Links a cada sección
- Guía rápida de qué buscar dónde

---

## 🗑️ Archivos a Eliminar

### Criterios de Eliminación

✅ **Eliminar SI:**
- Es duplicado exacto de otro archivo
- No se modificó en > 6 meses Y no es referencia
- Contiene información obsoleta
- Es temporal (.tmp, logs, cache)

❌ **NO Eliminar:**
- Decisiones arquitectónicas importantes
- Migraciones de base de datos
- Cambios significativos documentados
- Guías de onboarding

### Lista de Candidatos a Eliminar

*Nota: Revisar cada archivo antes de eliminar*

1. **Documentos de sesión muy antiguos** (> 6 meses)
   - Mantener solo los últimos 3 meses o hitos importantes

2. **Roadmaps obsoletos**
   - Si ya se completaron, mover a histórico con estado "Completado"

3. **Archivos duplicados**
   - Ejecutar script de detección de duplicados

4. **Documentos sin contenido o placeholder**
   - README.md vacíos
   - TODO.md sin completar

---

## ✅ Checklist de Implementación

### Preparación
- [ ] Hacer backup del repositorio
- [ ] Crear rama `docs/reorganizacion`
- [ ] Documentar estado actual

### Ejecución
- [ ] Crear estructura de carpetas
- [ ] Migrar archivos según mapeo
- [ ] Crear README.md en cada carpeta
- [ ] Crear índice principal
- [ ] Actualizar links rotos
- [ ] Eliminar archivos obsoletos
- [ ] Eliminar carpetas vacías

### Verificación
- [ ] Verificar que no hay links rotos
- [ ] Comprobar navegación desde docs/README.md
- [ ] Verificar que archivos importantes no se perdieron
- [ ] Ejecutar búsqueda de duplicados
- [ ] Revisar con equipo

### Finalización
- [ ] Commit de cambios
- [ ] Crear PR con descripción detallada
- [ ] Solicitar revisión
- [ ] Merge a main
- [ ] Actualizar documentación del proyecto

---

## 📊 Métricas de Éxito

Después de la reorganización:

- ✅ Tiempo para encontrar documentación < 2 minutos
- ✅ 0 documentos duplicados
- ✅ 100% de carpetas con README.md
- ✅ 0 links rotos en documentación
- ✅ Reducción del 30%+ en cantidad de archivos .md
- ✅ Estructura lógica y navegable

---

## 🚀 Próximos Pasos

Después de completar la reorganización:

1. **Mantener la estructura**
   - Documentar dónde va cada tipo de documento
   - Revisar periódicamente documentos obsoletos

2. **Automatizar mantenimiento**
   - Script para detectar links rotos
   - Script para encontrar duplicados
   - CI check para documentación

3. **Mejorar continuamente**
   - Feedback del equipo
   - Actualizar según necesidades
   - Agregar ejemplos y tutoriales

---

**Autor:** GitHub Copilot  
**Fecha:** 11 de Octubre de 2025  
**Versión:** 1.0
