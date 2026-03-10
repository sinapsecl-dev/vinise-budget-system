# 🎨 VINISE Budget System — Stitch Design Reference

**Proyecto Stitch:** VINISE Budget System  
**Project ID:** `11585406314979667664`  
**URL:** [Abrir en Stitch](https://stitch.google.com/projects/11585406314979667664)

---

## Pantallas Diseñadas

| # | Pantalla | Screen ID | Ruta App | Descripción |
|---|---|---|---|---|
| 1 | **Login** | `e9350107337943238f38065d7c096d8e` | `/login` | Magic link auth, split layout con branding VINISE |
| 2 | **Dashboard** | `3028ea70ff6c4549a7441813c8b6a9f3` | `/dashboard` | Lista presupuestos, stats cards, filtros, UF live |
| 3 | **Budget Editor** | `2d63c39ea1244536ab2000674a9de89c` | `/budgets/[id]` | Editor 3 zonas: header, partidas+líneas, cuadro resumen |
| 4 | **Item Search** | `b8382722522c4d6cb50b2c1d9b55497b` | Overlay (Cmd+K) | Command palette búsqueda de ítems con filtros |
| 5 | **Items Database** | `77dabcc92be648768ee684d041ee9c2e` | `/database/items` | CRUD tabla ítems, alertas revisión, filtros compañía |
| 6 | **Clients** | `095088cc0ac54ee189c18f67cfea287b` | `/clients` | Grid de cards clientes con stats presupuestos |
| 7 | **Letter Preview** | `7ad5a38e98d54edfbb001e7f9088a211` | Panel lateral | Preview carta PDF (general/desglosada) |
| 8 | **Audit Trail** | `f657420b10834bdaa17e1dfbf5f11682` | `/budgets/[id]/audit` | Timeline vertical con badges de acciones |
| 9 | **Settings/Users** | `b54e9c8fcba54e3cbbc5aaeea6c2e65a` | `/settings` | Gestión usuarios, roles, modal invitación |

## Design System Consistente

- **Tema:** Dark (#0F172A background)
- **Acento:** Electric blue (#3B82F6)
- **Tipografía:** Inter
- **Estilo:** Glass-morphism, bordes redondeados (8px)
- **Componentes:** shadcn/ui con tema customizado
