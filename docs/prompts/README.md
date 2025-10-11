# 📝 Prompts para Revisión y Optimización del Proyecto

Esta carpeta contiene prompts diseñados para guiar la revisión, optimización y mejora del proyecto Restaurant Management System.

---

## 📚 ÍNDICE DE PROMPTS

### 🔍 Revisión Completa (Actual)

**`PROMPT_REVISION_COMPLETA_PROYECTO.md`**  
Prompt maestro para realizar una auditoría integral del proyecto que incluye:
- ✅ Revisión y debug de servicios
- ✅ Optimización de código y performance
- ✅ Internacionalización completa a español
- ✅ Reorganización de documentación
- ✅ Limpieza de archivos obsoletos

**Cuándo usar:** Antes de pasar a la siguiente fase del proyecto o como auditoría periódica.

---

### 📋 Otros Prompts Disponibles

**`m6-implementation-prompt.md`**  
Prompt para implementación del Milestone 6 (QR Ordering System).

**`salon-editor-unificado.md`**  
Prompt para unificar el editor de salón y mejorar la experiencia de gestión de mesas.

---

## 🚀 CÓMO USAR ESTOS PROMPTS

### 1. Para Revisión Completa

```bash
# 1. Leer documentación en orden
docs/RESUMEN_EJECUTIVO_REVISION.md        # Empezar aquí
docs/prompts/PROMPT_REVISION_COMPLETA_PROYECTO.md  # Detalles completos
docs/CHECKLIST_REVISION_COMPLETA.md       # Lista de tareas
docs/GUIA_IMPLEMENTACION_MEJORAS.md       # Ejemplos prácticos
docs/ORGANIZACION_DOCUMENTACION.md        # Plan de docs

# 2. Ejecutar script de análisis
.\scripts\revision-completa.ps1 -DryRun

# 3. Crear rama de trabajo
git checkout -b feature/revision-completa-2025-10

# 4. Seguir el checklist
```

### 2. Para Implementación de Features

```bash
# Leer el prompt específico
cat docs/prompts/m6-implementation-prompt.md

# Seguir las instrucciones del prompt
```

### 3. Para Mejorar Componentes Específicos

```bash
# Leer el prompt del componente
cat docs/prompts/salon-editor-unificado.md

# Implementar las mejoras sugeridas
```

---

## 📦 ESTRUCTURA DE UN PROMPT COMPLETO

Un buen prompt debe incluir:

1. **Objetivo claro** - Qué se quiere lograr
2. **Contexto** - Estado actual del proyecto
3. **Instrucciones detalladas** - Pasos específicos a seguir
4. **Criterios de éxito** - Cómo saber que se completó
5. **Ejemplos** - Código antes/después cuando aplique
6. **Referencias** - Links a documentación relevante
7. **Checklist** - Tareas verificables

---

## 🎯 PROMPTS POR CASO DE USO

### Auditoría y Revisión
- ✅ `PROMPT_REVISION_COMPLETA_PROYECTO.md` - Auditoría integral
- [ ] `PROMPT_CODE_REVIEW.md` - Review de código (TODO)
- [ ] `PROMPT_SECURITY_AUDIT.md` - Auditoría de seguridad (TODO)

### Implementación de Features
- ✅ `m6-implementation-prompt.md` - QR Ordering
- ✅ `salon-editor-unificado.md` - Editor de salón
- [ ] `PROMPT_PAYMENT_SPLIT.md` - División de cuentas (TODO)
- [ ] `PROMPT_ANALYTICS_ENHANCEMENT.md` - Mejoras analítica (TODO)

### Optimización
- ✅ `PROMPT_REVISION_COMPLETA_PROYECTO.md` - Optimización general
- [ ] `PROMPT_PERFORMANCE_OPTIMIZATION.md` - Performance específica (TODO)
- [ ] `PROMPT_BUNDLE_SIZE_REDUCTION.md` - Reducir bundle (TODO)

### Documentación
- ✅ `ORGANIZACION_DOCUMENTACION.md` - Reorganizar docs
- [ ] `PROMPT_API_DOCUMENTATION.md` - Documentar API (TODO)
- [ ] `PROMPT_USER_GUIDE.md` - Guía de usuario (TODO)

---

## 💡 TIPS PARA CREAR NUEVOS PROMPTS

### Estructura Recomendada

```markdown
# [Título del Prompt]

**Objetivo:** [Descripción breve]  
**Tiempo estimado:** [X días/horas]  
**Prioridad:** [Alta/Media/Baja]

---

## Contexto Actual
[Descripción del estado actual]

## Objetivo Detallado
[Qué se quiere lograr específicamente]

## Instrucciones Paso a Paso

### 1. [Nombre del paso]
[Instrucciones detalladas]

### 2. [Siguiente paso]
[Más instrucciones]

## Criterios de Éxito
- [ ] Criterio 1
- [ ] Criterio 2

## Ejemplos de Código
[Código de ejemplo si aplica]

## Referencias
- [Link 1]
- [Link 2]
```

### Mejores Prácticas

1. **Ser específico** - Evitar ambigüedades
2. **Incluir ejemplos** - Mostrar cómo se ve el resultado esperado
3. **Dividir en pasos** - Tareas pequeñas y manejables
4. **Agregar checkboxes** - Para trackear progreso
5. **Incluir métricas** - Definir éxito cuantitativamente
6. **Listar prerequisitos** - Qué se necesita antes de empezar
7. **Agregar troubleshooting** - Problemas comunes y soluciones

---

## 📊 ESTADO DE LOS PROMPTS

| Prompt | Estado | Última Actualización | Autor |
|--------|--------|---------------------|-------|
| PROMPT_REVISION_COMPLETA_PROYECTO.md | ✅ Completo | 2025-10-11 | GitHub Copilot |
| m6-implementation-prompt.md | ✅ Completo | [Fecha] | - |
| salon-editor-unificado.md | ✅ Completo | [Fecha] | - |
| PROMPT_CODE_REVIEW.md | ⏳ Pendiente | - | - |
| PROMPT_SECURITY_AUDIT.md | ⏳ Pendiente | - | - |

---

## 🔗 LINKS RELACIONADOS

### Documentación del Proyecto
- [README Principal](../../README.md)
- [Guía de Contribución](../03-desarrollo/guia-contribucion.md)
- [Arquitectura](../02-arquitectura/vision-general.md)

### Documentos de la Revisión Actual
- [Resumen Ejecutivo](../RESUMEN_EJECUTIVO_REVISION.md)
- [Checklist Completo](../CHECKLIST_REVISION_COMPLETA.md)
- [Guía de Implementación](../GUIA_IMPLEMENTACION_MEJORAS.md)
- [Organización de Docs](../ORGANIZACION_DOCUMENTACION.md)

### Scripts
- [Script de Revisión](../../scripts/revision-completa.ps1)

---

## 🤝 CONTRIBUIR

### Agregar un Nuevo Prompt

1. Crear archivo en `docs/prompts/PROMPT_[NOMBRE].md`
2. Seguir la estructura recomendada
3. Actualizar este README con link al prompt
4. Actualizar la tabla de estado
5. Hacer commit con mensaje descriptivo

```bash
git add docs/prompts/
git commit -m "docs(prompts): agregar prompt para [funcionalidad]"
```

### Mejorar un Prompt Existente

1. Abrir el archivo del prompt
2. Hacer mejoras manteniendo estructura
3. Actualizar fecha en tabla de estado
4. Crear PR con descripción de cambios

---

## 📞 SOPORTE

Si tienes dudas sobre cómo usar estos prompts:

1. **Leer la documentación completa** en el orden sugerido
2. **Revisar los ejemplos** en la guía de implementación
3. **Ejecutar el script** en modo dry-run primero
4. **Consultar el checklist** para ver el progreso esperado

---

**Última actualización:** 11 de Octubre de 2025  
**Mantenido por:** Equipo de desarrollo
