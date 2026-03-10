# 🏗️ VINISE Budget System — Arquitectura de Componentes UI

**Stack:** Next.js 15 App Router + TypeScript + shadcn/ui + Tailwind CSS v4  
**Patrón:** Server Components por defecto, Client Components solo para interactividad

---

## 1. BudgetEditor — Layout Principal

**Ruta:** `app/budgets/[id]/page.tsx`  
**Tipo:** Client Component (`'use client'`) — requiere interactividad + realtime  
**Responsabilidad:** Orquesta todo el editor de presupuesto

```typescript
interface BudgetEditorProps {
  budgetId: string;
  initialBudget: Budget;
  initialPartitions: PartitionWithLines[];
  initialExpenses: BudgetGeneralExpense[];
  currentUfValue: number;
  currentUser: User;
}

interface Budget {
  id: string;
  code: string;
  revision: number;
  clientId: string | null;
  client: Client | null;
  projectName: string | null;
  projectLocation: string | null;
  status: 'draft' | 'sent' | 'partially_awarded' | 'awarded' | 'closed';
  ufValueAtCreation: number;
  ufValueAtSend: number | null;
  sentAt: string | null;
  globalMargin: number;
  considerations: string;
  proposalDuration: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

**Layout visual:**
```
┌─────────────────────────────────────────────────────┐
│ BudgetHeader                                         │
│ [EECC-05 REV.00] [Borrador ●] [UF: 38.426,21] [👤👤]│
├─────────────────────────────────────────┬───────────┤
│                                         │           │
│  PartitionBlock #1                      │ Budget    │
│  ┌─ LineItem                           │ Summary   │
│  ├─ LineItem                           │           │
│  └─ [+ Agregar Ítem]                   │ Partida 1 │
│                                         │ Partida 2 │
│  PartitionBlock #2                      │ Partida 3 │
│  ┌─ LineItem                           │ ───────── │
│  └─ [+ Agregar Ítem]                   │ GG Prorr  │
│                                         │ ───────── │
│  [+ Agregar Partida]                   │ TOTAL     │
│                                         │ IVA 19%   │
│  GeneralExpenses                        │ GRAN TOT  │
│  ┌─ ExpenseLine                        │           │
│  └─ [+ Agregar Gasto]                 │ [Preview] │
│                                         │ [Enviar]  │
└─────────────────────────────────────────┴───────────┘
```

**Comportamiento:**
- Suscripción a Supabase Realtime para cambios en `budget_lines`, `budget_partitions`, `budget_general_expenses`
- Auto-save con debounce de 1 segundo
- Indicador de "cambios sin guardar" en título del browser tab
- Keyboard shortcuts: Cmd+K (búsqueda), Cmd+S (guardar), Cmd+P (preview)

---

## 2. BudgetHeader — Encabezado del Presupuesto

**Archivo:** `components/budget-editor/BudgetHeader.tsx`  
**Tipo:** Client Component

```typescript
interface BudgetHeaderProps {
  budget: Budget;
  client: Client | null;
  ufValue: number;
  collaborators: CollaboratorInfo[];
  isReadOnly: boolean;
  onClientChange: (clientId: string) => void;
  onProjectNameChange: (name: string) => void;
  onProjectLocationChange: (location: string) => void;
  onGlobalMarginChange: (margin: number) => void;
}

interface Client {
  id: string;
  companyName: string;
  contactName: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
}

interface CollaboratorInfo {
  userId: string;
  fullName: string;
  avatarColor: string;
  editingPartitionId: string | null;
}
```

**Elementos UI:**
- **Código + Revisión:** Badge no editable `EECC-05 REV.00`
- **Estado:** Badge con color semántico (verde=borrador, azul=enviado, amarillo=adjudicado parcial, verde oscuro=adjudicado, gris=cerrado)
- **Cliente:** Combobox con búsqueda y opción "Nuevo Cliente"
- **Proyecto:** Campos inline editables para nombre y ubicación
- **UF:** Indicador con valor actual y timestamp de actualización
- **Margen Global:** Input numérico con `%` suffix (0-100)
- **Colaboradores:** Avatares circulares con iniciales y tooltips

---

## 3. PartitionBlock — Bloque de Partida

**Archivo:** `components/budget-editor/PartitionBlock.tsx`  
**Tipo:** Client Component

```typescript
interface PartitionBlockProps {
  partition: PartitionWithLines;
  budgetStatus: Budget['status'];
  globalMargin: number;
  ufValue: number;
  isReadOnly: boolean;
  editingBy: CollaboratorInfo | null;
  onNameChange: (name: string) => void;
  onToggleAwarded: () => void;
  onAddLine: (itemId: string) => void;
  onRemoveLine: (lineId: string) => void;
  onUpdateLine: (lineId: string, updates: Partial<BudgetLine>) => void;
  onReorderLines: (startIndex: number, endIndex: number) => void;
  onDelete: () => void;
}

interface PartitionWithLines {
  id: string;
  budgetId: string;
  number: number;
  name: string;
  isAwarded: boolean;
  sortOrder: number;
  lines: BudgetLine[];
}

interface BudgetLine {
  id: string;
  partitionId: string;
  itemId: string | null;
  customDescription: string;
  quantity: number;
  unit: string;
  materialValueClp: number;
  hhValueClp: number;
  lineMargin: number | null;
  sortOrder: number;
}
```

**Comportamiento:**
- Cabecera con nombre editable + badge de número de partida
- Collapse/expand con animación suave (Framer Motion o CSS transitions)
- Drag handle para reordenar entre partidas (usando `@dnd-kit/core`)
- Indicador de presencia: borde coloreado + avatar si otro usuario está editando
- Botón "Adjudicar" visible solo cuando `status === 'sent'`
- Drag-to-reorder de líneas dentro de la partida
- Footer con botón "+ Agregar Ítem" que abre `ItemSearchDialog`

---

## 4. LineItem — Línea de Ítem

**Archivo:** `components/budget-editor/LineItem.tsx`  
**Tipo:** Client Component

```typescript
interface LineItemProps {
  line: BudgetLine;
  lineIndex: number;
  globalMargin: number;
  ufValue: number;
  isReadOnly: boolean;
  onUpdate: (updates: Partial<BudgetLine>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
}

// Valores calculados (computados en el componente, NO almacenados)
interface LineCalculatedValues {
  effectiveMargin: number;      // line_margin ?? globalMargin
  costBaseCLP: number;          // material + hh
  withMarginCLP: number;        // costBase × (1 + margin)
  unitValueUF: number;          // withMarginCLP / ufValue (ceil 2 dec)
  totalValueUF: number;         // unitValueUF × quantity
  totalValueUFWithIVA: number;  // totalValueUF × 1.19 (ceil 2 dec)
}
```

**Layout de columnas:**
```
│ # │ Descripción          │ Cant │ Ud │ Mat CLP  │ HH CLP  │ Margen │ V.Unit UF │ V.Total UF │ ⋮ │
│ 1 │ [editable]           │ [ed] │ CU │ 🔒25.000│ 🔒15.000│ [ed]%  │ 1,25      │ 237,50     │ ⋮ │
```

**Comportamiento:**
- Descripción: inline editable, guarda con Enter o blur
- Cantidad: input numérico inline, recalcula al cambiar
- Material/HH: read-only con ícono de candado 🔒 y tooltip
- Margen: input numérico con placeholder "Global (20%)", recalcula al cambiar
- V.Unit/V.Total UF: calculados en tiempo real, no editables
- Menú contextual (⋮): Duplicar, Eliminar
- Tab navigation entre campos editables
- Visual feedback: highlight animado cuando valor cambia (por otro usuario o recálculo)

---

## 5. ItemSearchDialog — Command Palette de Búsqueda

**Archivo:** `components/budget-editor/ItemSearchDialog.tsx`  
**Tipo:** Client Component  
**Librería:** `cmdk` (integrado con shadcn/ui `<Command>`)

```typescript
interface ItemSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectItem: (item: CatalogItem) => void;
  companyFilter?: string;
  partitionTypeFilter?: string;
}

interface CatalogItem {
  id: string;
  code: string;
  companyId: string;
  companyName: string;
  partitionType: string;
  description: string;
  unit: string;
  materialValueClp: number;
  hhValueClp: number;
  defaultMargin: number;
}

interface ItemSearchFilters {
  query: string;
  companyId: string | null;
  partitionType: string | null;
}
```

**Layout:**
```
┌──────────────────────────────────────────┐
│ 🔍 Buscar ítems...                      │
├──────────────────────────────────────────┤
│ Filtros: [Compañía ▼] [Tipo Partida ▼]  │
├──────────────────────────────────────────┤
│                                          │
│ CHQ-EMP-MONO-001                         │
│ Empalme monofásico subterráneo           │
│ Mat: $25.000 | HH: $15.000 | CU | 20%   │
│                                          │
│ CHQ-EMP-MONO-002                         │
│ Empalme monofásico aéreo                 │
│ Mat: $22.000 | HH: $13.000 | CU | 20%   │
│                                          │
│ CHQ-EMP-TRI-001                          │
│ Empalme trifásico subterráneo            │
│ Mat: $75.000 | HH: $25.000 | CU | 20%   │
│                                          │
└──────────────────────────────────────────┘
```

**Comportamiento:**
- Se abre con Cmd+K o botón "+ Agregar Ítem"
- Búsqueda fuzzy por código y descripción (Server Action con pg_trgm)
- Filtros por compañía y tipo de partida con dropdowns
- Preview compacto de valores (material, HH, unidad, margen default)
- Selección con Enter o click → agrega ítem a la partida actual
- Debounce de 300ms en búsqueda
- Solo muestra ítems activos (`is_active = true`)

---

## 6. MarginControl — Control de Margen

**Archivo:** `components/budget-editor/MarginControl.tsx`  
**Tipo:** Client Component

```typescript
interface MarginControlProps {
  value: number | null;        // null = hereda del nivel superior
  inheritedValue: number;      // valor heredado (para mostrar placeholder)
  isReadOnly: boolean;
  level: 'global' | 'line';
  onChange: (value: number | null) => void;
}
```

**Comportamiento:**
- Input con suffix `%` y rango 0-100
- Placeholder muestra valor heredado: "Global (20%)"
- Botón para resetear al valor heredado (set null)
- Indicador visual cuando tiene override vs heredado

---

## 7. GeneralExpenses — Sección Gastos Generales

**Archivo:** `components/budget-editor/GeneralExpenses.tsx`  
**Tipo:** Client Component

```typescript
interface GeneralExpensesProps {
  expenses: BudgetGeneralExpense[];
  partitions: PartitionWithLines[];
  ufValue: number;
  isReadOnly: boolean;
  onAddExpense: (expense: Omit<BudgetGeneralExpense, 'id'>) => void;
  onUpdateExpense: (id: string, updates: Partial<BudgetGeneralExpense>) => void;
  onRemoveExpense: (id: string) => void;
}

interface BudgetGeneralExpense {
  id: string;
  budgetId: string;
  name: string;
  valueClp: number;
  quantity: number;
  allocation: string;    // "A" | "1" | "2" | etc.
  sortOrder: number;
}
```

**Layout:**
```
│ Nombre            │ Valor CLP │ Cant │ Total CLP   │ Asignación        │ ⋮ │
│ [Viáticos ▼]      │ [50.000]  │ [10] │ 500.000     │ [A - General ▼]   │ ⋮ │
│ [Combustible ▼]   │ [30.000]  │ [20] │ 600.000     │ [A - General ▼]   │ ⋮ │
│ [Arriendo grúa ▼] │ [800.000] │ [1]  │ 800.000     │ [2 - Partida 2 ▼] │ ⋮ │
```

---

## 8. BudgetSummary — Cuadro Resumen

**Archivo:** `components/budget-editor/BudgetSummary.tsx`  
**Tipo:** Client Component

```typescript
interface BudgetSummaryProps {
  partitions: PartitionWithLines[];
  expenses: BudgetGeneralExpense[];
  globalMargin: number;
  ufValue: number;
}

interface PartitionSummary {
  partitionId: string;
  partitionNumber: number;
  partitionName: string;
  itemsTotal: number;           // Total ítems en UF
  proratedExpenses: number;     // Gastos prorrateados "A" en UF
  specificExpenses: number;     // Gastos específicos en UF
  total: number;                // Todo sumado en UF
  isAwarded: boolean;
}

interface BudgetTotals {
  partitions: PartitionSummary[];
  totalNeto: number;           // Suma de todos los totales de partida en UF
  iva: number;                 // totalNeto × 0.19
  totalConIva: number;         // totalNeto + iva
}
```

**Layout (sticky sidebar en desktop, colapsable en mobile):**
```
┌────────────────────────────┐
│ 📊 CUADRO RESUMEN          │
├────────────────────────────┤
│ Partida 1: Empalmes       │
│   Ítems:        500,00 UF │
│   GG Prorr:      13,02 UF │
│   Subtotal:     513,02 UF │
├────────────────────────────┤
│ Partida 2: OOEE           │
│   Ítems:        300,00 UF │
│   GG Prorr:      13,02 UF │
│   GG Específ:    20,82 UF │
│   Subtotal:     333,84 UF │
├────────────────────────────┤
│ Partida 3: OOCC           │
│   Ítems:        200,00 UF │
│   GG Prorr:      13,02 UF │
│   Subtotal:     213,02 UF │
╞════════════════════════════╡
│ TOTAL NETO:   1.059,88 UF │
│ IVA (19%):      201,38 UF │
│ TOTAL C/IVA:  1.261,26 UF │
├────────────────────────────┤
│ UF: $38.426,21 (03/03/26) │
└────────────────────────────┘
```

---

## 9. LetterPreview — Preview de Carta PDF

**Archivo:** `components/letter-preview/LetterPreview.tsx`  
**Tipo:** Client Component

```typescript
interface LetterPreviewProps {
  budget: Budget;
  client: Client;
  partitions: PartitionWithLines[];
  expenses: BudgetGeneralExpense[];
  globalMargin: number;
  ufValue: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type LetterMode = 'general' | 'detailed';
```

**Comportamiento:**
- Se abre en panel lateral (Sheet de shadcn/ui) con Cmd+P o botón
- Toggle tabs: "General" / "Desglosada"
- Preview renderizado con los mismos datos del editor actual
- Botón "Descargar PDF" que genera server-side y descarga

---

## 10. CollaboratorPresence — Indicador de Colaboradores

**Archivo:** `components/shared/CollaboratorPresence.tsx`  
**Tipo:** Client Component

```typescript
interface CollaboratorPresenceProps {
  budgetId: string;
  currentUserId: string;
}

interface PresenceState {
  userId: string;
  fullName: string;
  editingPartitionId: string | null;
  lastSeen: string;
  color: string;   // Color asignado al avatar
}
```

**Comportamiento:**
- Usa Supabase Realtime Presence channel
- Muestra avatares circulares con iniciales en el header
- Tooltip con nombre completo al hover
- Avatar desaparece con fade-out cuando usuario se va
- Colores asignados por hash del userId
- Máximo 7 avatares visibles + "+N" si hay más

---

## 11. AuditTrail — Historial de Auditoría

**Archivo:** `components/shared/AuditTrail.tsx`  
**Tipo:** Server Component (datos iniciales) + Client Component (filtros)

```typescript
interface AuditTrailProps {
  budgetId: string;
  entries: AuditEntry[];
}

interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string | null;
  fieldChanged: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
}

interface AuditFilters {
  action: string | null;
  userId: string | null;
  dateRange: { from: Date; to: Date } | null;
}
```

**Layout (timeline vertical):**
```
│ 03/03/2026 15:30 — Carolina Muñoz
│ ● Cantidad modificada en línea "Empalme mono S-9/40A"
│   150 → 190
│
│ 03/03/2026 14:22 — Rodrigo Pérez
│ ● Margen modificado (global)
│   20% → 25%
│
│ 03/03/2026 14:10 — Carolina Muñoz
│ ● Ítem agregado: "Empalme trifásico SR-225"
```
