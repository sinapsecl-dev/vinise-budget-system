# 🏗️ VINISE — Sistema de Presupuestos: Arquitectura, Contexto de Desarrollo y Prompt Antigravity

---

## PARTE 1: REQUERIMIENTOS CAPTURADOS (Reunión + Notas)

### 1.1 Problema Actual
- Todo el proceso de creación de presupuestos es 100% manual en Excel
- Los valores se copian y pegan entre pestañas sin links directos
- Alta probabilidad de error al mover valores fijos de materiales o HH
- La carta de presupuesto (Word) se escribe a mano por proyecto
- El valor de la UF se actualiza manualmente y genera errores reales de adjudicación
- No hay control de versiones ni auditoría de cambios
- No hay estado del presupuesto (borrador, enviado, adjudicado)
- Los presupuestos están limitados a 6 partidas en el Excel actual
- No hay forma de saber qué UF se usó en un presupuesto enviado

### 1.2 Flujo Actual del Proceso
1. Abrir AutoCAD / memoria explicativa del proyecto
2. Contar ítems (ej: 190 empalmes monofásicos)
3. Buscar valores en Excel "Base de Datos" (Chilquinta, CGE, ENEL)
4. Copiar manualmente valores al Excel de presupuesto
5. Ajustar descripción de ítems (apellidos de empalme: S9/40A, SR-225, etc.)
6. Calcular margen manualmente por partida o total
7. Agregar Gastos Generales (viáticos, combustible, vehículo, bonos)
8. Redactar carta Word desde cero o copiar de presupuesto anterior
9. Enviar al cliente

### 1.3 Requerimientos Funcionales

#### Base de Datos de Ítems
- Cada ítem tiene: código único, compañía (Chilquinta, CGE, ENEL, Industrial), partida, unidad, valor material (CLP), valor HH (CLP), utilidad/margen (%), UF unitario calculado
- Posibilidad de agregar ítems por compañía (escalable hacia futuro)
- Categoría "Industrial" flexible: ítems variables por proyecto
- Alerta automática cada 1-2 meses para revisar precios de materiales
- Estandarizar HH con planilla de costos de mano de obra

#### Constructor de Presupuesto
- Selección de ítems desde la base de datos con búsqueda/filtro
- Personalizar descripción del ítem (apellido: potencia, capacidad, tipo)
- Ingresar cantidad por ítem
- Valores fijos (material + HH) bloqueados; solo se modifica el margen
- Margen configurable: global por proyecto o individual por ítem/partida
- Partidas ilimitadas (mínimo 6 cubiertas, expandible para Industrial)
- Gastos Generales en base de datos separada (viáticos, combustible, vehículo, bonos, otros)
- Prorrateo de Gastos Generales entre partidas (asignar "A" para prorrateo general, o número de partida específica)
- UF actualizada automáticamente vía API (CMF/Banco Central Chile)
- Al enviar presupuesto: congelar valor UF del día de envío
- Cuadro Resumen automático con totales por partida + total proyecto

#### Gestión de Presupuestos
- Estados: Borrador → Enviado → Adjudicado parcial/total → Cerrado
- Adjudicación por partida individual (no solo todo el presupuesto)
- Número de presupuesto + revisión (REV.00, REV.01, etc.)
- Al nueva revisión: actualizar UF o mantener la original (opción explícita)
- Datos del cliente: nombre, empresa, ciudad, teléfono, contacto
- Historial de cambios (auditoría): quién modificó qué valor y cuándo

#### Generación de Carta de Presupuesto
- Modo "General": partidas con valor total por partida (sin desglose)
- Modo "Desglosado": cada ítem con cantidad, unidad de venta, valor unitario UF+IVA, valor total UF+IVA
- Ambas cartas generadas simultáneamente y disponibles para descarga
- Cálculo: suma de items × cantidad × UF = total, redondeado hacia arriba
- Consideraciones del proyecto: plantilla base editable por presupuesto
- Duración de propuesta: campo configurable
- PDF exportable con branding VINISE
- Total Neto siempre cuadra con el resumen interno

#### Colaboración
- Hasta 5-7 usuarios simultáneos
- Edición colaborativa en tiempo real (sin pisarse)
- Log de auditoría visible en el presupuesto
- Roles: Admin (puede editar base de datos) / Editor (solo presupuestos)

---

## PARTE 2: ARQUITECTURA DEL SISTEMA

### 2.1 Stack Tecnológico (MVP Gratuito → Escalable)

| Capa | MVP (Gratuito) | Escalado |
|------|---------------|----------|
| Frontend | Next.js 15 (App Router) + TypeScript | Mismo |
| UI Components | shadcn/ui + Tailwind CSS v4 | Mismo |
| Real-time collab | Supabase Realtime (WebSockets) | Liveblocks o PartyKit |
| Backend/API | Next.js API Routes + Server Actions | Microservicios si escala |
| Base de datos | Supabase (PostgreSQL) | Supabase Pro |
| Auth | Supabase Auth (magic link + email) | SSO/SAML |
| Storage (PDFs) | Supabase Storage | Supabase Storage Pro |
| PDF Generation | React-pdf (server-side) | Mismo |
| UF API | API CMF Chile (gratuita) | Mismo |
| Alertas/Cron | Supabase Edge Functions (cron) | Mismo |
| Deploy | Vercel (Free tier) | Vercel Pro |
| Dominio | Cloudflare (ya conoces el stack) | Mismo |

**Por qué este stack:**
- Kevin ya domina Next.js + Supabase + Vercel + Cloudflare → velocidad de desarrollo
- Supabase free tier: 500MB DB, 2 proyectos, realtime, auth → suficiente para MVP con 5-7 usuarios
- Sin servidor propio necesario para MVP
- shadcn/ui: componentes de calidad enterprise, accesibles, fáciles de customizar
- Toda la lógica de negocio en Server Actions (seguridad, sin exponer API keys)

### 2.2 Modelo de Datos (PostgreSQL / Supabase)

```sql
-- Compañías mandantes
companies (
  id uuid PK,
  name text,                    -- "Chilquinta", "CGE", "ENEL", "Industrial"
  created_at timestamptz
)

-- Base de datos de ítems
items (
  id uuid PK,
  code text UNIQUE,             -- Código único por ítem
  company_id uuid FK,
  partition_type text,          -- "EMPALME", "OOEE", "OOCC", "RED_DISTRIBUCION", "INDUSTRIAL"
  description text,
  unit text,                    -- CU, M, GL
  material_value_clp integer,   -- Valor fijo material en CLP
  hh_value_clp integer,         -- Valor fijo HH en CLP
  default_margin decimal,       -- 0.20 = 20%
  is_active boolean,
  last_reviewed_at timestamptz, -- Para alertas de revisión
  updated_by uuid FK users,
  created_at timestamptz
)

-- Base de datos gastos generales (separada de ítems)
general_expenses_catalog (
  id uuid PK,
  name text,                    -- "Viático", "Combustible", "Bono viaje", "Vehículo"
  default_value_clp integer,
  unit text,
  created_at timestamptz
)

-- Clientes
clients (
  id uuid PK,
  company_name text,
  contact_name text,
  city text,
  phone text,
  email text,
  created_at timestamptz
)

-- Presupuestos
budgets (
  id uuid PK,
  code text,                    -- "EECC-02"
  revision integer DEFAULT 0,   -- REV.00, REV.01...
  client_id uuid FK,
  project_name text,
  project_location text,
  status text,                  -- "draft", "sent", "partially_awarded", "awarded", "closed"
  uf_value_at_creation decimal, -- UF del día de creación
  uf_value_at_send decimal,     -- UF congelada al enviar (NULL hasta envío)
  sent_at timestamptz,
  global_margin decimal,        -- Margen global del proyecto
  considerations text,          -- Texto de consideraciones del presupuesto
  proposal_duration text,       -- "30 días corridos", etc.
  created_by uuid FK users,
  created_at timestamptz,
  updated_at timestamptz
)

-- Partidas del presupuesto
budget_partitions (
  id uuid PK,
  budget_id uuid FK,
  number integer,               -- 1, 2, 3...
  name text,                    -- "CONSTRUCCION EMPALMES"
  is_awarded boolean DEFAULT false,
  created_at timestamptz
)

-- Líneas de ítems en cada partida
budget_lines (
  id uuid PK,
  partition_id uuid FK,
  item_id uuid FK,
  custom_description text,      -- Apellido: "monofásico subterráneo S-9 / 40A"
  quantity decimal,
  unit text,
  material_value_clp integer,   -- Snapshot del valor al momento de agregar
  hh_value_clp integer,         -- Snapshot del valor HH
  line_margin decimal,          -- Margen overrideado para esta línea (NULL = usa global)
  sort_order integer,
  created_at timestamptz,
  updated_by uuid FK users
)

-- Gastos generales por presupuesto
budget_general_expenses (
  id uuid PK,
  budget_id uuid FK,
  name text,
  value_clp integer,
  quantity decimal,
  allocation text,              -- "A" = prorrateo general, "1","2" = partida específica
  created_at timestamptz
)

-- Auditoría de cambios
audit_log (
  id uuid PK,
  budget_id uuid FK,
  user_id uuid FK,
  action text,                  -- "item_value_changed", "margin_changed", "status_changed"
  field_changed text,
  old_value text,
  new_value text,
  created_at timestamptz
)

-- Usuarios
users (
  id uuid PK,                   -- Linked to Supabase Auth
  full_name text,
  email text,
  role text,                    -- "admin", "editor"
  created_at timestamptz
)
```

### 2.3 Arquitectura de Módulos (Next.js App Router)

```
app/
├── (auth)/
│   └── login/                  # Magic link / email login
├── dashboard/
│   ├── page.tsx                # Lista de presupuestos + estados
│   └── layout.tsx
├── budgets/
│   ├── new/page.tsx            # Crear presupuesto nuevo
│   ├── [id]/
│   │   ├── page.tsx            # Editor principal de presupuesto
│   │   ├── preview/page.tsx    # Preview carta (general + desglosada)
│   │   └── audit/page.tsx      # Historial de cambios
│   └── layout.tsx
├── database/
│   ├── items/page.tsx          # CRUD base de datos ítems
│   ├── expenses/page.tsx       # CRUD gastos generales
│   └── companies/page.tsx      # Gestión compañías
├── clients/page.tsx            # CRUD clientes
└── settings/page.tsx           # Config general, alertas

components/
├── budget-editor/
│   ├── BudgetHeader.tsx        # Datos cliente, código, UF, estado
│   ├── PartitionBlock.tsx      # Bloque de partida con drag-to-reorder
│   ├── LineItem.tsx            # Línea de ítem con inline editing
│   ├── ItemSearchDialog.tsx    # Modal búsqueda de ítems base de datos
│   ├── MarginControl.tsx       # Control de margen global/por línea
│   ├── GeneralExpenses.tsx     # Sección gastos generales
│   └── BudgetSummary.tsx       # Cuadro resumen totales
├── letter-preview/
│   ├── LetterGeneral.tsx       # Carta modo general
│   └── LetterDetailed.tsx      # Carta modo desglosada
└── shared/
    ├── AuditTrail.tsx
    └── CollaboratorIndicator.tsx # Quién está editando en tiempo real
```

### 2.4 Lógica de Negocio Clave

#### Cálculo de Valor UF por Línea
```
valor_unitario_uf = (material_clp + hh_clp) × (1 + margin) / uf_value
valor_total_uf = valor_unitario_uf × cantidad
total redondeado = Math.ceil(valor_total_uf × 100) / 100
```

#### Prorrateo de Gastos Generales
```
total_gastos_generales_A = sum(expenses donde allocation = "A")
por_partida = total_gastos_generales_A / cantidad_partidas

partida_X_total = sum(lines en partida_X) + gastos_específicos_X + por_partida
```

#### Congelamiento de UF
- Al cambiar estado a "sent": snapshot automático de UF del día → uf_value_at_send
- El presupuesto enviado siempre muestra la UF congelada
- Nueva revisión: prompt explícito "¿Actualizar UF al valor de hoy?" → usuario decide

#### Real-time Collaboration (Supabase Realtime)
- Suscripción a cambios de tabla `budget_lines` y `budget_partitions`
- Presencia de usuarios: mostrar avatar de quién está editando qué partida
- Optimistic updates en el cliente, sincronización por Supabase

---

## PARTE 3: CONTEXTO DETALLADO DE DESARROLLO (Para IA/Cursor/Windsurf)

```markdown
# VINISE Budget System — Development Context 2026

## Project Overview
Build a web-based budget management system for VINISE, a Chilean electrical construction company
specializing in residential/industrial electrical service connections (empalmes) for utilities
like Chilquinta, CGE, and ENEL.

## Tech Stack
- Next.js 15.x with App Router and TypeScript (strict mode)
- Supabase (PostgreSQL + Realtime + Auth + Storage)
- shadcn/ui components + Tailwind CSS v4
- React-pdf for PDF generation (server-side)
- Vercel deployment
- Zod for all data validation
- TanStack Query v5 for server state management

## Architecture Principles
1. Server Components by default, Client Components only when needed (interactivity, realtime)
2. All sensitive operations in Server Actions (never expose Supabase service key to client)
3. Row-Level Security (RLS) enabled on ALL Supabase tables
4. Optimistic UI updates for real-time collaboration feel
5. Offline-resilient: queue operations if connection drops, sync on reconnect
6. Zero-trust: validate all inputs with Zod on server side, even from authenticated users

## Security Requirements (2026 Standards)
- Supabase RLS policies: users can only read/write budgets from their organization
- Magic link auth only (no passwords to manage)
- All API routes protected with Supabase session validation
- Audit trail immutable: audit_log rows are INSERT-only (no UPDATE/DELETE via RLS)
- PDF downloads require signed Supabase Storage URLs (expire in 1h)
- Rate limiting on budget creation (prevent abuse)
- HTTPS enforced, HSTS headers via Vercel
- Content Security Policy headers configured

## Business Logic Rules
- Item values (material_clp, hh_value_clp) are IMMUTABLE once a budget line is created
  (snapshot pattern). Changes to base database don't affect existing budget lines.
- UF value: fetch daily from CMF Chile API (https://api.cmfchile.cl)
  Cache in Supabase with 1-hour TTL. Never recalculate from live API mid-session.
- UF freeze on send: when budget status changes to "sent", automatically snapshot 
  uf_value_at_send = current live UF. This field becomes immutable after that.
- Margin hierarchy: line_margin overrides partition_margin overrides budget global_margin
  If line_margin is NULL, cascade up to find the applicable margin.
- Total rounding: all UF totals round UP (Math.ceil) to nearest 0.01 UF
- General Expenses with allocation="A" are prorated equally across all active partitions.
  Expenses with allocation="1","2",etc. go to that specific partition.
- Budget code format: "EECC-{sequential number}", revision: "REV.00", "REV.01"

## UX/UI Design Guidelines
- Mobile-first responsive but optimized for desktop use (primary work surface)
- Budget editor: Notion-like feel with drag-to-reorder partitions and line items
- Inline editing: click any cell to edit, press Enter/Tab to confirm
- Item search: Command palette style (Cmd+K) with fuzzy search across item codes and descriptions
- Real-time presence: show colored avatar badge on partition blocks being edited by others
- Unsaved changes indicator: subtle dot on browser tab title
- Toast notifications for: auto-save, UF updates, collaboration events, alerts
- Dark mode support out of the box (shadcn/ui theming)
- Keyboard shortcuts for power users: Cmd+S save, Cmd+P preview, Cmd+D duplicate line

## Data Validation Rules
- Item code: uppercase alphanumeric, max 20 chars, unique per company
- Quantity: positive decimal, max 99999, required
- Margin: 0% to 100%, stored as decimal (0.20 = 20%)
- CLP values: positive integer, max 999,999,999
- Budget code: auto-generated, not editable by user
- Client phone: Chilean format validation (+56 9 XXXX XXXX)

## PDF Generation Specs
- Two modes: "general" (partition totals only) and "detailed" (all line items)
- Include: VINISE header/logo, client data block, reference block, items table, 
  totals table, considerations section, proposal duration, UF value and date
- All monetary values: CLP formatted with Chilean locale (1.234.567)
- UF values: 2 decimal places, rounded up
- Font: Inter or similar modern sans-serif
- Colors: VINISE brand colors (to be defined, use placeholder)
- Paper: Letter format, portrait

## Integration Points
- CMF API for UF: GET https://api.cmfchile.cl/api-sbifv3/recursos_api/uf/{year}/{month}/dias/{day}?apikey={key}&formato=json
- Monthly cron job (Supabase Edge Function): check items not reviewed in 60 days,
  send email notification to admin users listing stale items

## Error Handling
- All Server Actions return { success: boolean, data?: T, error?: string }
- Supabase errors: catch and return user-friendly messages in Spanish
- UF API failure: fall back to last cached value, show warning banner to user
- Concurrent edit conflicts: last-write-wins with Supabase Realtime (acceptable for 5-7 users)
  Show toast "Valor actualizado por [Usuario]" when a field is changed by another user

## Testing Strategy
- Unit tests (Vitest): business logic functions (calculations, rounding, prorrateo)
- Integration tests: Server Actions with Supabase local dev
- E2E (Playwright): critical paths (create budget, add items, generate PDF, change status)
- No 100% coverage required for MVP, focus on calculation logic
```

---

## PARTE 4: PROMPT EXPERTO PARA ANTIGRAVITY

```
Actúa como un Product Manager y Arquitecto de Software Senior con experiencia en proyectos SaaS 
para empresas constructoras/industriales. Tu tarea es planificar e implementar desde cero la 
plataforma "VINISE Budget System" — un sistema web de creación y gestión de presupuestos para 
una empresa de construcción eléctrica chilena (empalmes residenciales e industriales).

## CONTEXTO DEL PROYECTO

### Empresa y usuarios
- **Cliente:** VINISE — empresa de construcción eléctrica especializada en empalmes para 
  distribuidoras Chilquinta, CGE y ENEL
- **Usuarios:** 5-7 personas internas, uso colaborativo y simultáneo
- **Pain point principal:** todo el proceso de presupuestación es manual en Excel, con alto 
  margen de error, sin control de versiones, sin actualización automática de UF, y generación 
  manual de cartas en Word

### Stack tecnológico definido
- Frontend: Next.js 15 (App Router) + TypeScript + shadcn/ui + Tailwind CSS v4
- Base de datos y auth: Supabase (PostgreSQL + Realtime + Auth + Storage)
- PDF: React-pdf (server-side rendering)
- Deploy: Vercel (free tier para MVP)
- UF: API CMF Chile (https://api.cmfchile.cl)
- Validación: Zod | State management: TanStack Query v5

### Módulos del sistema
1. **Base de datos de ítems** — catálogo de servicios por compañía (Chilquinta/CGE/ENEL/Industrial) 
   con código único, valor material CLP, valor HH CLP, margen default. Ítems inmutables una vez 
   usados en presupuesto (snapshot pattern).
2. **Constructor de presupuestos** — partidas ilimitadas, líneas de ítems con personalización de 
   descripción, margen configurable (global/partida/línea), Gastos Generales con prorrateo.
3. **Gestión de estado** — Draft → Sent → Partially Awarded → Awarded → Closed. Congelamiento 
   automático de UF al enviar. Adjudicación por partida individual.
4. **Generación de cartas PDF** — modo General (totales por partida) y Desglosado (ítem a ítem). 
   Consideraciones editables, duración de propuesta, datos cliente, UF congelada.
5. **Colaboración en tiempo real** — Supabase Realtime, presencia de usuarios, auditoría de cambios.
6. **Alertas** — cron job mensual para ítems sin revisar +60 días.

### Reglas de negocio críticas
- Valores de material y HH son FIJOS en base de datos; solo el margen es variable en el presupuesto
- UF se obtiene de CMF API con caché de 1 hora; se congela al enviar presupuesto
- Total UF siempre redondeado hacia arriba (Math.ceil a 2 decimales)
- Gastos Generales con "A" = prorrateo equitativo entre todas las partidas
- Row-Level Security en todas las tablas de Supabase
- Audit log inmutable (INSERT-only via RLS)
- Fórmula: valor_unitario_uf = (material_clp + hh_clp) × (1 + margin) / uf_value

## TU TAREA

Genera los siguientes entregables completos y detallados:

### 1. PRD (Product Requirements Document)
Documento completo con: visión del producto, usuarios y roles, casos de uso principales, 
requerimientos funcionales y no funcionales, criterios de éxito del MVP, métricas de adopción, 
restricciones técnicas y de negocio, roadmap de versiones (MVP v0.1 → v1.0).

### 2. Historias de Usuario
Crea el backlog completo de historias de usuario en formato Gherkin (Given/When/Then) para:
- Gestión de base de datos de ítems (CRUD + alertas)
- Gestión de clientes
- Creación y edición de presupuesto (partidas, líneas, márgenes, gastos generales)
- Gestión de estados (envío, adjudicación parcial, cierre)
- Generación y descarga de cartas PDF
- Colaboración en tiempo real y auditoría
- Administración de usuarios y roles
Prioriza cada historia con MoSCoW (Must/Should/Could/Won't) y estimación de story points.

### 3. Plan de Implementación
Sprint-by-sprint plan (sprints de 1 semana) para entregar el MVP funcional en 6-8 semanas:
- Sprint 0: Setup infraestructura (Supabase, Vercel, Next.js, auth, CI/CD básico)
- Sprint 1: Base de datos de ítems y CRUD
- Sprint 2: Constructor de presupuestos (partidas + líneas básico)
- Sprint 3: Cálculos, UF API, márgenes, gastos generales
- Sprint 4: Generación de cartas PDF (general + desglosada)
- Sprint 5: Estados, congelamiento UF, adjudicación
- Sprint 6: Colaboración realtime, auditoría, alertas
- Sprint 7: QA, polish UX, deployment producción
Para cada sprint: tareas específicas, criterios de done, dependencias, riesgos.

### 4. Base de Conocimiento del Proyecto
Documentación técnica estructurada que incluya:
- Glosario de términos del dominio (empalme, HH, UF, prorrateo, mandante, partida, etc.)
- Explicación de reglas de negocio con ejemplos numéricos concretos
- Diagrama de estados del presupuesto (texto/markdown)
- Flujo de datos desde selección de ítem hasta generación de PDF
- Guía de onboarding para nuevos usuarios del sistema
- FAQ técnico para el equipo de desarrollo

### 5. Esquema de Base de Datos Completo
SQL completo para Supabase con:
- Todas las tablas con tipos correctos, constraints, defaults
- Índices para queries frecuentes (búsqueda de ítems, listado de presupuestos por estado)
- Row-Level Security policies para roles "admin" y "editor"
- Triggers: auto-updated_at, auto-audit_log en cambios de budget_lines
- Seed data inicial con las compañías (Chilquinta, CGE, ENEL, Industrial) y algunos ítems 
  de ejemplo basados en estos valores reales:
  * Chilquinta - Empalme monofásico: material 25.000 CLP, HH 15.000 CLP, margen 20%
  * CGE - Empalme monofásico: material 45.000 CLP, HH 15.000 CLP, margen 20%
  * ENEL - Empalme monofásico concentrado: material 55.000 CLP, HH 15.000 CLP, margen 20%

### 6. Arquitectura de Componentes UI
Describe cada componente clave del budget editor:
- BudgetEditor (layout principal con header, particiones, summary)
- PartitionBlock (drag-to-reorder, collapse/expand, margin override)
- LineItem (inline edit de descripción, cantidad, margin override, valor calculado live)
- ItemSearchDialog (command palette Cmd+K, filtros por compañía/tipo, preview de valores)
- BudgetSummary (totales por partida, gastos generales prorrateados, gran total)
- LetterPreview (toggle general/desglosada, preview en panel lateral)
- CollaboratorPresence (avatares en tiempo real por partida)
Incluye props interface en TypeScript para cada componente.

### 7. Checklist de Seguridad y Performance
Lista completa de verificación antes de ir a producción:
- RLS policies verificadas con Supabase policy tester
- No secrets en código cliente (use .env.local + server-side only)
- Input sanitization en todos los campos de texto libre
- PDF generado server-side (nunca exponer lógica de precios en cliente)
- Rate limiting en endpoints críticos (crear presupuesto, exportar PDF)
- Lighthouse score > 90 en Performance, Accessibility, Best Practices
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

Sé extremadamente detallado y específico. Usa el stack tecnológico definido en cada entregable. 
Los nombres deben estar en español donde corresponda al dominio (partida, empalme, presupuesto) 
y en inglés para nomenclatura técnica de código. Todos los ejemplos numéricos deben usar el 
sistema chileno (CLP, UF, IVA 19%).
```
