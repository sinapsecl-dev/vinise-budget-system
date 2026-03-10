# ✅ VINISE Budget System — Checklist de Seguridad y Performance

**Fecha:** 2026-03-03  
**Objetivo:** Verificación completa antes de ir a producción

---

## 1. Seguridad — Base de Datos y RLS

| # | Verificación | Estado | Notas |
|---|---|---|---|
| 1.1 | RLS habilitado en TODAS las tablas (11 tablas) | ☐ | `ALTER TABLE x ENABLE ROW LEVEL SECURITY` |
| 1.2 | `users`: solo puede leer todos, editar su propio perfil | ☐ | Admin puede gestionar todos |
| 1.3 | `items`: Editor = SELECT only, Admin = CRUD completo | ☐ | Verificar con Supabase Policy Tester |
| 1.4 | `companies`: Editor = SELECT, Admin = CRUD | ☐ | |
| 1.5 | `general_expenses_catalog`: Editor = SELECT, Admin = CRUD | ☐ | |
| 1.6 | `budgets`: Todos autenticados CRUD, verificar scope | ☐ | Futura mejora: scope por organización |
| 1.7 | `budget_partitions`: CASCADE delete con budget | ☐ | |
| 1.8 | `budget_lines`: CASCADE delete con partition | ☐ | |
| 1.9 | `budget_general_expenses`: CASCADE delete con budget | ☐ | |
| 1.10 | `audit_log`: INSERT-ONLY, NO policies de UPDATE ni DELETE | ☐ | **CRÍTICO**: verificar inmutabilidad |
| 1.11 | `uf_cache`: Lectura pública, escritura autenticada | ☐ | |
| 1.12 | Testear RLS con Supabase Policy Tester para cada rol | ☐ | Crear scripts de prueba admin/editor |

---

## 2. Seguridad — Autenticación y Autorización

| # | Verificación | Estado | Notas |
|---|---|---|---|
| 2.1 | Supabase Auth magic link configurado correctamente | ☐ | Dominio de email verificado |
| 2.2 | Middleware de Next.js protege todas las rutas excepto `/login` | ☐ | `middleware.ts` con matcher |
| 2.3 | Server Actions validan sesión de Supabase antes de ejecutar | ☐ | `createServerSupabaseClient()` |
| 2.4 | Server Actions validan rol del usuario (admin/editor) | ☐ | Helper `requireRole('admin')` |
| 2.5 | No hay API Routes expuestas sin autenticación | ☐ | Revisar `app/api/` |
| 2.6 | Session refresh configurada (Supabase Auth helpers) | ☐ | Token auto-refresh |
| 2.7 | Redirect a login cuando la sesión expira | ☐ | |

---

## 3. Seguridad — Secrets y Variables de Entorno

| # | Verificación | Estado | Notas |
|---|---|---|---|
| 3.1 | `SUPABASE_SERVICE_ROLE_KEY` NO tiene prefix `NEXT_PUBLIC_` | ☐ | **CRÍTICO** |
| 3.2 | `CMF_API_KEY` NO tiene prefix `NEXT_PUBLIC_` | ☐ | Solo server-side |
| 3.3 | Solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` son públicos | ☐ | |
| 3.4 | `.env.local` está en `.gitignore` | ☐ | Verificar que no esté commiteado |
| 3.5 | Variables de producción configuradas en Vercel environment | ☐ | Separar dev/preview/production |
| 3.6 | Grep del bundle cliente: no hay secrets filtrados | ☐ | `grep -r "service_role" .next/` |
| 3.7 | Service role key solo se usa en Server Actions y Edge Functions | ☐ | |

---

## 4. Seguridad — Validación de Input

| # | Verificación | Estado | Notas |
|---|---|---|---|
| 4.1 | Todos los Server Actions validan input con Zod schemas | ☐ | No confiar en validación del cliente |
| 4.2 | `item.code`: uppercase alphanumeric, max 20 chars | ☐ | `z.string().regex(/^[A-Z0-9-]+$/).max(20)` |
| 4.3 | `quantity`: positivo, max 99999, decimal(10,2) | ☐ | `z.number().positive().max(99999)` |
| 4.4 | `margin`: 0 a 1 (0% a 100%), decimal(5,4) | ☐ | `z.number().min(0).max(1)` |
| 4.5 | `CLP values`: integer positivo, max 999.999.999 | ☐ | |
| 4.6 | `client.phone`: formato chileno `+56 9 XXXX XXXX` | ☐ | Regex validation |
| 4.7 | `client.email`: formato email válido | ☐ | `z.string().email()` |
| 4.8 | Campos de texto libre (descripción, consideraciones): sanitizar HTML | ☐ | DOMPurify o strip tags |
| 4.9 | `budget.code`: auto-generado, no editable por usuario | ☐ | Server-side only |
| 4.10 | `allocation`: solo "A" o dígitos (`/^(A|\d+)$/`) | ☐ | |

---

## 5. Seguridad — PDF y Storage

| # | Verificación | Estado | Notas |
|---|---|---|---|
| 5.1 | PDF generado 100% server-side (Server Action) | ☐ | Nunca exponer cálculos de precios al cliente |
| 5.2 | Bucket `budget-pdfs` es privado (no público) | ☐ | `public: false` |
| 5.3 | Descargas usan signed URLs con TTL de 1 hora | ☐ | `createSignedUrl(path, 3600)` |
| 5.4 | RLS en `storage.objects` permite solo a autenticados | ☐ | Policy por bucket_id |
| 5.5 | Nombre de archivo no contiene input del usuario sin sanitizar | ☐ | Formato fijo: `VINISE_EECC-XX_REVXX_tipo.pdf` |

---

## 6. Seguridad — Headers y Protección Web

| # | Verificación | Estado | Notas |
|---|---|---|---|
| 6.1 | HTTPS enforced (Vercel lo hace automáticamente) | ☐ | |
| 6.2 | HSTS header configurado | ☐ | Vercel default o `next.config.js` headers |
| 6.3 | Content-Security-Policy configurada | ☐ | Restringir scripts, styles, fonts |
| 6.4 | X-Frame-Options: DENY | ☐ | Prevenir clickjacking |
| 6.5 | X-Content-Type-Options: nosniff | ☐ | |
| 6.6 | Referrer-Policy: strict-origin-when-cross-origin | ☐ | |

---

## 7. Seguridad — Rate Limiting

| # | Verificación | Estado | Notas |
|---|---|---|---|
| 7.1 | Rate limit en creación de presupuestos | ☐ | Max 10/hora por usuario |
| 7.2 | Rate limit en generación de PDFs | ☐ | Max 20/hora por usuario |
| 7.3 | Rate limit en API de UF (respetar API CMF) | ☐ | Max 60/hora (caché resuelve) |
| 7.4 | Rate limit en login requests (magic link) | ☐ | Supabase Auth maneja esto |
| 7.5 | Implementar con Vercel KV o `upstash/ratelimit` | ☐ | |

---

## 8. Performance — Core Web Vitals

| # | Métrica | Objetivo | Estado | Herramienta |
|---|---|---|---|---|
| 8.1 | **LCP** (Largest Contentful Paint) | < 2.5s | ☐ | Lighthouse |
| 8.2 | **FID/INP** (Interaction to Next Paint) | < 200ms | ☐ | Lighthouse |
| 8.3 | **CLS** (Cumulative Layout Shift) | < 0.1 | ☐ | Lighthouse |
| 8.4 | **TTFB** (Time to First Byte) | < 800ms | ☐ | WebPageTest |
| 8.5 | **FCP** (First Contentful Paint) | < 1.8s | ☐ | Lighthouse |

---

## 9. Performance — Lighthouse Scores

| # | Categoría | Objetivo | Estado | Notas |
|---|---|---|---|---|
| 9.1 | Performance | > 90 | ☐ | Medir en `/dashboard` y `/budgets/[id]` |
| 9.2 | Accessibility | > 90 | ☐ | Verificar: contraste, aria-labels, focus |
| 9.3 | Best Practices | > 90 | ☐ | HTTPS, no deprecated APIs |
| 9.4 | SEO | > 90 | ☐ | Meta tags, robots.txt |

---

## 10. Performance — Optimización de Carga

| # | Verificación | Estado | Notas |
|---|---|---|---|
| 10.1 | Server Components para páginas de listado (dashboard, items, clients) | ☐ | Menos JS enviado al cliente |
| 10.2 | Client Components solo donde hay interactividad | ☐ | Budget editor, formularios |
| 10.3 | Dynamic imports para componentes pesados (PDF preview, Command) | ☐ | `next/dynamic` con `ssr: false` |
| 10.4 | Imágenes optimizadas con `next/image` (logo VINISE) | ☐ | |
| 10.5 | Fonts subseteadas y preloaded | ☐ | Inter, solo caracteres Latin |
| 10.6 | Bundle analyzer: verificar no hay dependencias innecesarias | ☐ | `@next/bundle-analyzer` |
| 10.7 | Supabase client se instancia una sola vez (singleton) | ☐ | |
| 10.8 | TanStack Query: staleTime configurado para evitar refetch innecesarios | ☐ | Items: 5min, UF: 30min |

---

## 11. Performance — Base de Datos

| # | Verificación | Estado | Notas |
|---|---|---|---|
| 11.1 | Índices creados para búsqueda fuzzy de ítems (pg_trgm) | ☐ | `gin_trgm_ops` en code y description |
| 11.2 | Índices en FK columns (budget_id, partition_id, etc.) | ☐ | |
| 11.3 | Índice en budgets.status para filtrado de dashboard | ☐ | |
| 11.4 | Índice en budgets.created_at DESC para listado ordenado | ☐ | |
| 11.5 | Queries de listado usan paginación server-side | ☐ | LIMIT/OFFSET o cursor-based |
| 11.6 | N+1 queries eliminadas (usar joins o batch queries) | ☐ | Supabase `.select('*, lines(*)')` |
| 11.7 | Caché de UF evita hits innecesarios a API CMF | ☐ | TTL 1 hora |

---

## 12. Funcionalidad — Pre-Producción

| # | Verificación | Estado | Notas |
|---|---|---|---|
| 12.1 | E2E test: crear presupuesto completo end-to-end | ☐ | Playwright |
| 12.2 | E2E test: generar PDF y verificar contenido | ☐ | |
| 12.3 | E2E test: cambio de estado (draft → sent → awarded) | ☐ | |
| 12.4 | Unit tests: funciones de cálculo (UF, prorrateo, redondeo) | ☐ | Vitest |
| 12.5 | Verificar cálculos con ejemplo real del cliente VINISE | ☐ | Comparar con presupuesto Excel existente |
| 12.6 | Probar con 2+ usuarios simultáneos (colaboración) | ☐ | |
| 12.7 | Probar flujo completo de adjudicación parcial | ☐ | |
| 12.8 | Probar nueva revisión con UF actualizada vs mantenida | ☐ | |
| 12.9 | Verificar audit log captura todos los cambios esperados | ☐ | |
| 12.10 | Verificar que audit log es inmutable (intentar UPDATE/DELETE) | ☐ | |
| 12.11 | Error handling: API CMF caída → fallback a caché | ☐ | |
| 12.12 | Error handling: Supabase Realtime desconexión | ☐ | |

---

## 13. Deploy — Producción

| # | Verificación | Estado | Notas |
|---|---|---|---|
| 13.1 | Dominio configurado en Cloudflare + Vercel | ☐ | DNS propagado |
| 13.2 | SSL certificado válido | ☐ | Automático con Vercel/Cloudflare |
| 13.3 | Variables de entorno de producción configuradas en Vercel | ☐ | Separadas de development |
| 13.4 | Supabase: base de datos de producción (no development) | ☐ | Verificar URL apunta a la correcta |
| 13.5 | Backup automático de DB habilitado | ☐ | Supabase incluye diario |
| 13.6 | Error monitoring configurado (Vercel Analytics o Sentry) | ☐ | |
| 13.7 | Documentación de usuario entregada al equipo VINISE | ☐ | |
| 13.8 | Sesión de capacitación completada | ☐ | |

---

## Resumen de Prioridades

| Prioridad | Categoría | Ítems Críticos |
|---|---|---|
| 🔴 **P0** | Seguridad | RLS audit_log inmutable, secrets no en cliente, service_role server-only |
| 🔴 **P0** | Funcional | Cálculos UF correctos, congelamiento UF, snapshot pattern |
| 🟡 **P1** | Seguridad | RLS todas las tablas, input validation, signed URLs |
| 🟡 **P1** | Performance | LCP < 2.5s, Lighthouse > 90 |
| 🟢 **P2** | Performance | Bundle optimization, query optimization, fonts |
| 🟢 **P2** | Deploy | Monitoring, backups, documentation |
