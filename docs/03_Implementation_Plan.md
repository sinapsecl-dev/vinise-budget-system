# 🗓️ VINISE Budget System — Plan de Implementación Sprint-by-Sprint

**Duración total:** 8 semanas (Sprint 0 – Sprint 7)  
**Duración por sprint:** 1 semana  
**Equipo:** 1 desarrollador full-stack (Kevin) + soporte puntual  
**Velocity estimada:** 12-15 story points/sprint

---

## Sprint 0: Setup de Infraestructura
**Duración:** Semana 1 (3-4 días)  
**Objetivo:** Tener el proyecto corriendo end-to-end con auth funcional

### Tareas

| # | Tarea | SP | Estado |
|---|---|---|---|
| 0.1 | Crear proyecto Next.js 15 con App Router + TypeScript strict | 1 | ☐ |
| 0.2 | Configurar Tailwind CSS v4 + shadcn/ui (instalación base de componentes) | 1 | ☐ |
| 0.3 | Crear proyecto en Supabase (free tier) | 0.5 | ☐ |
| 0.4 | Configurar Supabase Auth con magic link | 2 | ☐ |
| 0.5 | Crear layout base: sidebar nav, header, contenido principal | 2 | ☐ |
| 0.6 | Implementar middleware de auth (proteger rutas) | 1 | ☐ |
| 0.7 | Crear tabla `users` + sync con Supabase Auth (trigger on_auth_user_created) | 1 | ☐ |
| 0.8 | Configurar roles (admin/editor) con RLS básico | 1 | ☐ |
| 0.9 | Deploy inicial en Vercel + configurar variables de entorno | 0.5 | ☐ |
| 0.10 | Configurar Zod schemas base + types globales | 1 | ☐ |
| 0.11 | Setup TanStack Query v5 provider | 0.5 | ☐ |

**Total SP:** ~11.5

### Criterios de Done
- [ ] `npm run dev` funciona sin errores
- [ ] Login con magic link funcional (envía email, autentica)
- [ ] Layout base responsive con sidebar
- [ ] Rutas protegidas redirigen a login si no autenticado
- [ ] Deploy exitoso en Vercel con dominio temporal
- [ ] Variables de entorno configuradas (.env.local + Vercel)

### Dependencias
- Cuenta Supabase creada
- Cuenta Vercel configurada
- API key de CMF Chile solicitada (puede tardar)

### Riesgos
| Riesgo | Mitigación |
|---|---|
| Supabase magic link puede caer en spam | Configurar dominio de email verificado |
| Tailwind v4 tiene cambios breaking vs v3 | Seguir documentación oficial de migración |

---

## Sprint 1: Base de Datos de Ítems y CRUD
**Duración:** Semana 2  
**Objetivo:** Catálogo completo de ítems funcional con búsqueda/filtros

### Tareas

| # | Tarea | SP | Estado |
|---|---|---|---|
| 1.1 | Crear migración SQL: tablas `companies`, `items`, `general_expenses_catalog` | 2 | ☐ |
| 1.2 | Aplicar RLS policies en `companies` e `items` (admin: CRUD, editor: read-only) | 1 | ☐ |
| 1.3 | Seed data: 4 compañías + ítems de ejemplo (Chilquinta, CGE, ENEL, Industrial) | 1 | ☐ |
| 1.4 | Server Actions: createItem, updateItem, toggleItemActive, listItems | 2 | ☐ |
| 1.5 | Página `/database/items`: tabla con paginación, búsqueda por código/descripción | 3 | ☐ |
| 1.6 | Filtros: por compañía, tipo de partida, estado (activo/inactivo) | 1 | ☐ |
| 1.7 | Modal crear/editar ítem con validación Zod | 2 | ☐ |
| 1.8 | Crear migración SQL: tabla `clients` | 0.5 | ☐ |
| 1.9 | CRUD clientes: página `/clients` con tabla + modal crear/editar | 2 | ☐ |
| 1.10 | Validación teléfono chileno (+56 9 XXXX XXXX) | 0.5 | ☐ |

**Total SP:** ~15

### Criterios de Done
- [ ] Admin puede crear, editar y desactivar ítems
- [ ] Editor puede ver ítems pero no editarlos
- [ ] Búsqueda por código y descripción funciona con debounce
- [ ] Filtros por compañía y tipo de partida funcionan
- [ ] CRUD de clientes completo con validación
- [ ] Seed data cargada correctamente

### Dependencias
- Sprint 0 completado (auth + layout)

### Riesgos
| Riesgo | Mitigación |
|---|---|
| Volumen de ítems por compañía no estimado | Implementar paginación server-side desde el inicio |

---

## Sprint 2: Constructor de Presupuestos (Básico)
**Duración:** Semana 3  
**Objetivo:** Crear presupuesto con partidas y líneas de ítems

### Tareas

| # | Tarea | SP | Estado |
|---|---|---|---|
| 2.1 | Crear migración SQL: tablas `budgets`, `budget_partitions`, `budget_lines` | 2 | ☐ |
| 2.2 | RLS policies para presupuestos (admin + editor pueden CRUD) | 1 | ☐ |
| 2.3 | Server Action: createBudget (auto-genera código EECC-XX) | 2 | ☐ |
| 2.4 | Dashboard `/dashboard`: lista de presupuestos con estado, cliente, fecha | 2 | ☐ |
| 2.5 | BudgetEditor layout: header + zona de partidas + summary placeholder | 3 | ☐ |
| 2.6 | BudgetHeader: código, revisión, cliente (selector), proyecto, ubicación | 2 | ☐ |
| 2.7 | PartitionBlock: agregar/eliminar partidas, nombre editable | 2 | ☐ |
| 2.8 | ItemSearchDialog: Command Palette (Cmd+K) con búsqueda fuzzy de ítems | 3 | ☐ |
| 2.9 | LineItem: mostrar ítem agregado con campos inline (descripción, cantidad, valores) | 3 | ☐ |
| 2.10 | Snapshot pattern: copiar valores material+HH al agregar línea | 1 | ☐ |

**Total SP:** ~21 (podría requerir 1-2 días extra)

### Criterios de Done
- [ ] Se puede crear un presupuesto nuevo con código auto-generado
- [ ] Se pueden agregar/eliminar partidas con nombre personalizado
- [ ] Cmd+K abre búsqueda de ítems con filtros
- [ ] Al agregar ítem, los valores se copian como snapshot
- [ ] Se puede editar descripción y cantidad inline
- [ ] Dashboard lista presupuestos existentes

### Dependencias
- Sprint 1 completado (ítems y clientes existen en DB)

### Riesgos
| Riesgo | Mitigación |
|---|---|
| Sprint sobrecargado (21 SP) | Posponer drag-to-reorder a Sprint posterior |
| Command Palette complejo | Usar cmdk (librería de shadcn) ya integrada |

---

## Sprint 3: Cálculos, UF API, Márgenes, Gastos Generales
**Duración:** Semana 4  
**Objetivo:** Todos los cálculos funcionando correctamente con UF real

### Tareas

| # | Tarea | SP | Estado |
|---|---|---|---|
| 3.1 | Integración API CMF Chile: obtener UF del día | 2 | ☐ |
| 3.2 | Caché de UF en Supabase (tabla `uf_cache` con TTL 1h) | 1 | ☐ |
| 3.3 | Server Action: getCurrentUF (con fallback a caché si API falla) | 1 | ☐ |
| 3.4 | MarginControl: selector de margen global en BudgetHeader | 1 | ☐ |
| 3.5 | MarginControl: override de margen por línea en LineItem | 2 | ☐ |
| 3.6 | Implementar fórmula: `(material + HH) × (1 + margin) / UF` con Math.ceil | 1 | ☐ |
| 3.7 | Cálculos en tiempo real: actualizar valores UF cuando cambian cantidad/margen | 2 | ☐ |
| 3.8 | Crear tabla `budget_general_expenses` + migración | 0.5 | ☐ |
| 3.9 | GeneralExpenses: UI para agregar gastos con nombre, valor, cantidad, asignación | 3 | ☐ |
| 3.10 | Lógica de prorrateo: "A" = equitativo, "N" = partida específica | 2 | ☐ |
| 3.11 | BudgetSummary: Cuadro Resumen con totales por partida + prorrateo + gran total | 3 | ☐ |
| 3.12 | Unit tests (Vitest): funciones de cálculo, redondeo, prorrateo | 2 | ☐ |

**Total SP:** ~20.5

### Criterios de Done
- [ ] UF se obtiene automáticamente de CMF API
- [ ] Banner de advertencia si UF viene de caché expirado
- [ ] Margen global se aplica a todas las líneas sin override
- [ ] Margen por línea override funciona correctamente
- [ ] Valores UF se calculan en tiempo real al cambiar inputs
- [ ] Gastos Generales se prorratean correctamente
- [ ] Cuadro Resumen muestra totales precisos (Neto + IVA + Total)
- [ ] Tests de cálculo pasan al 100%

### Dependencias
- Sprint 2 completado (editor de presupuesto básico)
- API key de CMF Chile obtenida

### Riesgos
| Riesgo | Mitigación |
|---|---|
| API CMF puede tener downtime | Caché robusta + fallback a último valor conocido |
| Errores de redondeo acumulados | Usar Decimal.js o redondear solo en display final |

---

## Sprint 4: Generación de Cartas PDF
**Duración:** Semana 5  
**Objetivo:** Cartas PDF profesionales generadas server-side

### Tareas

| # | Tarea | SP | Estado |
|---|---|---|---|
| 4.1 | Setup react-pdf con Next.js (renderizado server-side) | 2 | ☐ |
| 4.2 | Diseñar template base PDF: header VINISE, tipografía, colores | 3 | ☐ |
| 4.3 | LetterGeneral: tabla de partidas con totales | 5 | ☐ |
| 4.4 | LetterDetailed: tabla detallada por ítem con cantidad, unidad, valores UF+IVA | 5 | ☐ |
| 4.5 | Sección consideraciones: texto editable que se incluye en ambas cartas | 1 | ☐ |
| 4.6 | Sección duración de propuesta configurable | 0.5 | ☐ |
| 4.7 | Server Action: generatePDF (genera ambas cartas, almacena en Supabase Storage) | 2 | ☐ |
| 4.8 | Descarga con URL firmada (Supabase Storage signed URL, 1h TTL) | 1 | ☐ |
| 4.9 | LetterPreview: panel lateral con preview en tiempo real | 3 | ☐ |
| 4.10 | Formato monetario chileno (CLP con puntos, UF con coma decimal) | 1 | ☐ |

**Total SP:** ~23.5 (sprint intenso — puede necesitar 1-2 días de buffer)

### Criterios de Done
- [ ] PDF modo General se genera correctamente con totales por partida
- [ ] PDF modo Desglosado muestra cada ítem con detalle
- [ ] Ambas cartas incluyen header VINISE, datos cliente, referencia, UF
- [ ] Formato monetario chileno correcto en todo el PDF
- [ ] PDFs almacenados en Supabase Storage
- [ ] Descarga funciona con URL firmada
- [ ] Preview en panel lateral refleja datos actuales

### Dependencias
- Sprint 3 completado (cálculos correctos)
- Logo VINISE en formato SVG/PNG proporcionado

### Riesgos
| Riesgo | Mitigación |
|---|---|
| react-pdf tiene limitaciones de layout | Diseñar carta simple iterando sobre layouts viables |
| PDF grande (muchos ítems) puede tardar | Paginación automática en react-pdf |

---

## Sprint 5: Estados, Congelamiento UF, Adjudicación
**Duración:** Semana 6  
**Objetivo:** Flujo completo de estados con congelamiento de UF

### Tareas

| # | Tarea | SP | Estado |
|---|---|---|---|
| 5.1 | Server Action: sendBudget (cambiar estado + congelar UF + generar PDFs) | 3 | ☐ |
| 5.2 | UI Estado: badge visual de estado en header + dashboard | 1 | ☐ |
| 5.3 | Restricción de edición: presupuesto "sent" = read-only (excepto adjudicación) | 2 | ☐ |
| 5.4 | Adjudicación por partida: botón toggle + cambio automático de estado | 2 | ☐ |
| 5.5 | Diálogo de confirmación al enviar (mostrar UF que se congelará) | 1 | ☐ |
| 5.6 | Server Action: createRevision (duplicar presupuesto con nueva revisión) | 3 | ☐ |
| 5.7 | Diálogo de nueva revisión: "¿Actualizar UF o mantener original?" | 1 | ☐ |
| 5.8 | Server Action: closeBudget (marcar como cerrado) | 0.5 | ☐ |
| 5.9 | Historial de revisiones: ver todas las revisiones de un presupuesto | 1 | ☐ |

**Total SP:** ~14.5

### Criterios de Done
- [ ] Al enviar, UF se congela y estado cambia a "sent"
- [ ] Presupuesto enviado es read-only
- [ ] Partidas se pueden adjudicar individualmente
- [ ] Estado cambia automáticamente: partially_awarded → awarded (cuando todas adjudicadas)
- [ ] Nueva revisión duplica correctamente con opción de UF
- [ ] Presupuesto cerrado es completamente read-only

### Dependencias
- Sprint 4 completado (generación de PDFs)

### Riesgos
| Riesgo | Mitigación |
|---|---|
| Lógica de duplicación de presupuesto compleja | Duplicar en transacción SQL (budget + partitions + lines) |

---

## Sprint 6: Colaboración Realtime, Auditoría, Alertas
**Duración:** Semana 7  
**Objetivo:** Edición colaborativa funcional + audit trail completo

### Tareas

| # | Tarea | SP | Estado |
|---|---|---|---|
| 6.1 | Configurar Supabase Realtime: suscripción a `budget_lines` y `budget_partitions` | 2 | ☐ |
| 6.2 | Optimistic updates en el cliente para edición de líneas | 3 | ☐ |
| 6.3 | Toast "Valor actualizado por [Usuario]" cuando otro usuario modifica campo | 1 | ☐ |
| 6.4 | Presencia de usuarios: Supabase Presence para mostrar quién está en qué presupuesto | 2 | ☐ |
| 6.5 | CollaboratorPresence: avatar badges en header del presupuesto | 1 | ☐ |
| 6.6 | Crear tabla `audit_log` con migración + RLS INSERT-only | 1 | ☐ |
| 6.7 | Trigger PostgreSQL: auto-insert en audit_log cuando cambian budget_lines | 2 | ☐ |
| 6.8 | Página `/budgets/[id]/audit`: timeline de cambios con filtros | 2 | ☐ |
| 6.9 | Supabase Edge Function: cron job mensual para alerta de ítems sin revisar | 2 | ☐ |
| 6.10 | Email de alerta con listado de ítems que requieren revisión | 1 | ☐ |

**Total SP:** ~17

### Criterios de Done
- [ ] 2 usuarios editando el mismo presupuesto ven cambios en tiempo real
- [ ] Avatares de presencia muestran quién está activo
- [ ] Toast notifications al recibir cambios de otros
- [ ] Audit log registra automáticamente cambios en budget_lines
- [ ] Tabla de auditoría es solo INSERT (no UPDATE/DELETE)
- [ ] Cron ejecuta mensualmente y envía alerta por email

### Dependencias
- Sprint 5 completado (presupuestos funcionales end-to-end)

### Riesgos
| Riesgo | Mitigación |
|---|---|
| Conflictos de edición simultánea | Last-write-wins + toast notification |
| Supabase Realtime puede tener latencia | Optimistic updates en el cliente |

---

## Sprint 7: QA, Polish UX, Deployment Producción
**Duración:** Semana 8  
**Objetivo:** Sistema pulido, probado y desplegado en producción

### Tareas

| # | Tarea | SP | Estado |
|---|---|---|---|
| 7.1 | E2E tests (Playwright): crear presupuesto completo, generar PDF, cambiar estado | 5 | ☐ |
| 7.2 | Fix bugs encontrados durante testing | 3 | ☐ |
| 7.3 | Revisar y completar RLS policies en todas las tablas | 1 | ☐ |
| 7.4 | Auditoría de seguridad: verificar no secrets en cliente, CSP headers | 1 | ☐ |
| 7.5 | Optimización de performance: Lighthouse score > 90 | 2 | ☐ |
| 7.6 | Polish UX: loading states, error states, empty states, animations | 2 | ☐ |
| 7.7 | Responsive check: mobile/tablet/desktop | 1 | ☐ |
| 7.8 | Configurar dominio producción en Cloudflare | 0.5 | ☐ |
| 7.9 | Configurar variables de entorno de producción en Vercel | 0.5 | ☐ |
| 7.10 | Documentación de uso básico para usuarios finales | 1 | ☐ |
| 7.11 | Sesión de capacitación/demo con usuarios VINISE | 0 | ☐ |

**Total SP:** ~17

### Criterios de Done
- [ ] E2E tests cubren flujo completo: login → crear presupuesto → generar PDF → enviar
- [ ] Todos los bugs críticos y altos resueltos
- [ ] Lighthouse Performance > 90
- [ ] RLS policies cubren 100% de las tablas
- [ ] No hay secrets expuestos en código cliente
- [ ] Dominio producción configurado y funcional
- [ ] Usuarios VINISE capacitados y usando el sistema

### Dependencias
- Todos los sprints anteriores completados
- Dominio disponible
- Usuarios disponibles para sesión de capacitación

### Riesgos
| Riesgo | Mitigación |
|---|---|
| Bugs bloqueantes descubiertos tarde | Reservar 1 día extra de buffer |
| Performance issues en producción | Monitoreo con Vercel Analytics |

---

## Resumen de Timeline

```
Semana 1  │ Sprint 0 │ ████████░░ │ Infraestructura + Auth
Semana 2  │ Sprint 1 │ ██████████ │ CRUD Ítems + Clientes
Semana 3  │ Sprint 2 │ ██████████ │ Constructor Presupuestos
Semana 4  │ Sprint 3 │ ██████████ │ Cálculos + UF + Márgenes
Semana 5  │ Sprint 4 │ ██████████ │ Generación PDF
Semana 6  │ Sprint 5 │ ████████░░ │ Estados + UF Freeze
Semana 7  │ Sprint 6 │ ██████████ │ Realtime + Auditoría
Semana 8  │ Sprint 7 │ ██████████ │ QA + Deploy Producción
```

**Story Points totales del proyecto:** ~140 SP  
**Velocity necesaria:** ~17.5 SP/sprint  
**Capacidad con 1 dev senior:** Alcanzable con enfoque full-time
