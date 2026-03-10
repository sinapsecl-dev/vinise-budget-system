# 📋 VINISE Budget System — Product Requirements Document (PRD)

**Versión:** 1.0  
**Fecha:** 2026-03-03  
**Autor:** Equipo de Desarrollo VINISE  
**Estado:** Borrador para revisión

---

## 1. Visión del Producto

### 1.1 Declaración de Visión

> **VINISE Budget System** es una plataforma web colaborativa que transforma el proceso de presupuestación eléctrica de un flujo manual propenso a errores (Excel + Word) en un sistema digital integrado, preciso y auditable — permitiendo a VINISE generar presupuestos profesionales en minutos en vez de horas.

### 1.2 Problema que Resuelve

| Problema Actual | Impacto | Solución VINISE |
|---|---|---|
| Presupuestos 100% manuales en Excel | 2-4 horas por presupuesto | Automatización completa: < 30 min |
| Valores copiados sin links entre pestañas | Errores de cálculo frecuentes | Base de datos centralizada con valores fijos |
| UF actualizada manualmente | Errores reales de adjudicación (caso documentado) | API automática CMF Chile con congelamiento |
| Carta Word redactada desde cero | Inconsistencia de formato entre proyectos | Generación automática PDF con branding |
| Sin control de versiones | No se sabe qué cambió ni quién | Auditoría completa + revisiones numeradas |
| Limitado a 6 partidas | Proyectos industriales imposibles | Partidas ilimitadas |
| Sin estados de presupuesto | No se sabe qué fue enviado o adjudicado | Flujo de estados completo con trazabilidad |

### 1.3 Propuesta de Valor Única

- **Precisión:** valores de material y HH bloqueados desde base de datos, eliminando errores de transcripción
- **Velocidad:** de horas a minutos con autocompletado, búsqueda inteligente y generación automática de cartas
- **Trazabilidad:** cada cambio registrado con usuario, fecha y valor anterior/nuevo
- **Colaboración:** hasta 7 usuarios editando simultáneamente con presencia en tiempo real
- **Profesionalismo:** cartas PDF con branding VINISE generadas automáticamente

---

## 2. Usuarios y Roles

### 2.1 Perfiles de Usuario

| Rol | Permisos | Cantidad Estimada |
|---|---|---|
| **Admin** | CRUD base de datos ítems, gestión de usuarios, configuración global, todas las funciones de Editor | 1–2 |
| **Editor** | Crear/editar presupuestos, gestionar clientes, generar PDFs, cambiar estados | 3–5 |

### 2.2 Personas

#### Persona 1: Administrador Técnico
- **Nombre:** Rodrigo (Jefe de Presupuestos)
- **Responsabilidad:** Mantener la base de datos de precios actualizada, configurar márgenes por defecto, gestionar acceso de usuarios
- **Pain point:** "Cada vez que Chilquinta cambia un precio, tengo que buscar en cuáles presupuestos usé ese ítem"
- **Meta:** Tener un catálogo centralizado de ítems con alertas de revisión periódica

#### Persona 2: Editor de Presupuestos
- **Nombre:** Carolina (Ingeniera de Presupuestos)
- **Responsabilidad:** Crear presupuestos diarios para licitaciones, generar cartas para envío al cliente
- **Pain point:** "Paso 3 horas armando un presupuesto y luego 1 hora más haciendo la carta en Word"
- **Meta:** Armar y enviar un presupuesto profesional en menos de 30 minutos

---

## 3. Casos de Uso Principales

### CU-01: Crear Presupuesto Nuevo
**Actor:** Editor  
**Precondición:** Usuario autenticado, base de datos de ítems poblada  
**Flujo:**
1. Editor hace clic en "Nuevo Presupuesto"
2. Sistema genera código automático (EECC-XX) con REV.00
3. Editor selecciona o crea cliente
4. Editor agrega partidas (ej: "Construcción Empalmes")
5. Para cada partida, busca ítems vía Cmd+K y los agrega con cantidad
6. Sistema calcula valores UF automáticamente usando UF del día
7. Editor ajusta márgenes (global, por partida o por línea)
8. Editor agrega Gastos Generales con asignación de prorrateo
9. Sistema muestra Cuadro Resumen en tiempo real
10. Editor guarda como borrador

### CU-02: Enviar Presupuesto al Cliente
**Actor:** Editor  
**Precondición:** Presupuesto en estado "borrador" con al menos una partida  
**Flujo:**
1. Editor revisa preview de carta (general y desglosada)
2. Editor edita consideraciones del proyecto si es necesario
3. Editor hace clic en "Enviar Presupuesto"
4. Sistema congela valor UF del día → `uf_value_at_send`
5. Sistema cambia estado a "sent" y registra `sent_at`
6. Sistema genera PDFs (general + desglosado) y los almacena en Supabase Storage
7. Editor descarga PDFs para envío manual al cliente

### CU-03: Adjudicar Partida Individual
**Actor:** Editor  
**Precondición:** Presupuesto en estado "sent"  
**Flujo:**
1. Editor abre presupuesto enviado
2. Selecciona partida específica y marca como "Adjudicada"
3. Sistema cambia estado del presupuesto a "partially_awarded"
4. Si todas las partidas están adjudicadas → estado cambia a "awarded"
5. Audit log registra el cambio

### CU-04: Crear Nueva Revisión
**Actor:** Editor  
**Precondición:** Presupuesto existente (cualquier estado excepto "closed")  
**Flujo:**
1. Editor selecciona "Nueva Revisión" en presupuesto existente
2. Sistema pregunta: "¿Actualizar UF al valor de hoy (UF X.XXX,XX) o mantener UF original (UF Y.YYY,YY)?"
3. Editor elige opción
4. Sistema crea copia del presupuesto con `revision + 1` (REV.01)
5. Editor modifica lo necesario
6. Nuevo presupuesto inicia en estado "draft"

### CU-05: Gestionar Base de Datos de Ítems
**Actor:** Admin  
**Flujo:**
1. Admin accede a sección "Base de Datos"
2. Filtra por compañía (Chilquinta, CGE, ENEL, Industrial)
3. CRUD completo de ítems (código, descripción, unidad, valores CLP, margen default)
4. Sistema alerta cuando un ítem no ha sido revisado en 60+ días
5. Al modificar un ítem, los presupuestos existentes NO se afectan (snapshot pattern)

### CU-06: Colaboración en Tiempo Real
**Actores:** Múltiples Editores  
**Flujo:**
1. Editor A abre presupuesto EECC-05
2. Editor B abre el mismo presupuesto EECC-05
3. Ambos ven avatar del otro en el header del presupuesto
4. Editor A edita Partida 1 → aparece indicador de presencia en Partida 1
5. Editor B edita Partida 3 → ambos ven cambios en tiempo real
6. Si Editor B modifica un campo que Editor A está viendo → toast: "Valor actualizado por Carolina"

---

## 4. Requerimientos Funcionales

### RF-01: Gestión de Base de Datos de Ítems
| ID | Descripción | Prioridad |
|---|---|---|
| RF-01.1 | CRUD completo de ítems con código único por compañía | Must |
| RF-01.2 | Filtrado por compañía, tipo de partida, búsqueda por código/descripción | Must |
| RF-01.3 | Alerta automática para ítems sin revisar > 60 días | Should |
| RF-01.4 | Importación masiva de ítems desde CSV | Could |
| RF-01.5 | Historial de cambios de precios por ítem | Should |

### RF-02: Constructor de Presupuestos
| ID | Descripción | Prioridad |
|---|---|---|
| RF-02.1 | Crear presupuesto con código auto-generado y revisión | Must |
| RF-02.2 | Agregar partidas ilimitadas con nombre personalizable | Must |
| RF-02.3 | Buscar y agregar ítems desde base de datos (Cmd+K) | Must |
| RF-02.4 | Personalizar descripción del ítem (apellido) por línea | Must |
| RF-02.5 | Ingresar cantidad por línea de ítem | Must |
| RF-02.6 | Valores material+HH bloqueados (snapshot al agregar) | Must |
| RF-02.7 | Margen configurable: global / por partida / por línea | Must |
| RF-02.8 | Gastos Generales con prorrateo ("A" o partida específica) | Must |
| RF-02.9 | Drag-to-reorder partidas y líneas | Should |
| RF-02.10 | Duplicar líneas y partidas | Should |
| RF-02.11 | Cuadro Resumen automático con totales | Must |

### RF-03: UF y Cálculos
| ID | Descripción | Prioridad |
|---|---|---|
| RF-03.1 | Obtener UF diaria vía API CMF Chile | Must |
| RF-03.2 | Caché de UF con TTL de 1 hora | Must |
| RF-03.3 | Fórmula: `(material + HH) × (1 + margin) / UF` | Must |
| RF-03.4 | Redondeo hacia arriba a 2 decimales (Math.ceil) | Must |
| RF-03.5 | Congelamiento de UF al cambiar estado a "sent" | Must |
| RF-03.6 | Opción explícita de actualizar o mantener UF en nueva revisión | Must |

### RF-04: Gestión de Estados
| ID | Descripción | Prioridad |
|---|---|---|
| RF-04.1 | Estados: draft → sent → partially_awarded → awarded → closed | Must |
| RF-04.2 | Adjudicación individual por partida | Must |
| RF-04.3 | Revisiones numeradas (REV.00, REV.01…) | Must |
| RF-04.4 | Restricción de edición según estado (sent = read-only excepto adjudicación) | Must |

### RF-05: Generación de Cartas PDF
| ID | Descripción | Prioridad |
|---|---|---|
| RF-05.1 | Carta modo "General": totales por partida sin desglose | Must |
| RF-05.2 | Carta modo "Desglosado": cada ítem con detalle | Must |
| RF-05.3 | Ambas cartas generadas simultáneamente | Must |
| RF-05.4 | Branding VINISE (logo, colores, tipografía) | Must |
| RF-05.5 | Consideraciones editables por presupuesto | Must |
| RF-05.6 | Formato monetario chileno (CLP con puntos, UF con coma) | Must |
| RF-05.7 | Descarga con URL firmada (expira en 1 hora) | Should |

### RF-06: Colaboración y Auditoría
| ID | Descripción | Prioridad |
|---|---|---|
| RF-06.1 | Edición colaborativa en tiempo real (5-7 usuarios) | Must |
| RF-06.2 | Indicador de presencia por partida | Should |
| RF-06.3 | Audit log inmutable: acción, campo, valor anterior, valor nuevo, usuario, fecha | Must |
| RF-06.4 | Vista de historial de cambios por presupuesto | Must |

### RF-07: Gestión de Clientes
| ID | Descripción | Prioridad |
|---|---|---|
| RF-07.1 | CRUD de clientes (empresa, contacto, ciudad, teléfono, email) | Must |
| RF-07.2 | Autocompletado de cliente al crear presupuesto | Should |
| RF-07.3 | Historial de presupuestos por cliente | Could |

### RF-08: Autenticación y Usuarios
| ID | Descripción | Prioridad |
|---|---|---|
| RF-08.1 | Login vía magic link (email) | Must |
| RF-08.2 | Roles: Admin y Editor con permisos diferenciados | Must |
| RF-08.3 | Gestión de usuarios (invitar, desactivar) por Admin | Must |

---

## 5. Requerimientos No Funcionales

| ID | Categoría | Descripción | Métrica |
|---|---|---|---|
| RNF-01 | Rendimiento | Tiempo de carga inicial | < 2.5s (LCP) |
| RNF-02 | Rendimiento | Respuesta de interacción | < 100ms (FID) |
| RNF-03 | Rendimiento | Estabilidad visual | < 0.1 (CLS) |
| RNF-04 | Rendimiento | Lighthouse Performance score | > 90 |
| RNF-05 | Seguridad | RLS en todas las tablas | 100% cobertura |
| RNF-06 | Seguridad | Audit log inmutable | INSERT-only via RLS |
| RNF-07 | Seguridad | Sin secrets en código cliente | Verificado por CI |
| RNF-08 | Disponibilidad | Uptime del servicio | 99.5% (Vercel + Supabase) |
| RNF-09 | Escalabilidad | Usuarios concurrentes | 5-7 (MVP), 20+ (escalado) |
| RNF-10 | Usabilidad | Accesibilidad WCAG | Nivel AA |
| RNF-11 | Usabilidad | Lighthouse Accessibility score | > 90 |
| RNF-12 | Datos | Backup PostgreSQL automático | Diario (Supabase incluido) |
| RNF-13 | Compatibilidad | Navegadores soportados | Chrome, Firefox, Safari, Edge (últimas 2 versiones) |

---

## 6. Criterios de Éxito del MVP

### 6.1 Criterios de Aceptación Funcional
- [ ] Un usuario puede crear un presupuesto completo con ≥3 partidas y ≥10 líneas en < 30 minutos
- [ ] Los valores calculados en UF coinciden al centavo con un cálculo manual verificado
- [ ] Las cartas PDF generadas son visualmente profesionales y contienen todos los datos requeridos
- [ ] El valor de UF se actualiza automáticamente y se congela correctamente al enviar
- [ ] Los Gastos Generales se prorratean correctamente entre partidas
- [ ] 2 usuarios pueden editar simultáneamente sin conflictos destructivos
- [ ] El audit log captura todos los cambios de valores y estados

### 6.2 Métricas de Adopción (Primeros 30 días)
| Métrica | Objetivo |
|---|---|
| Presupuestos creados | ≥ 10 |
| Usuarios activos semanales | ≥ 3 de 5-7 |
| Cartas PDF generadas | ≥ 5 |
| Tiempo promedio por presupuesto | < 45 min (vs 2-4h actual) |
| Errores de cálculo reportados | 0 |
| Incidencias de UF incorrecta | 0 |

---

## 7. Restricciones Técnicas y de Negocio

### Técnicas
- **Free tier:** Supabase free (500MB DB, 2 proyectos), Vercel free → sin costo mensual para MVP
- **Sin servidor propio:** toda la infraestructura serverless (Vercel + Supabase)
- **React-pdf:** limitaciones de layout vs HTML/CSS → diseño de carta ajustado al motor
- **Supabase Realtime:** máximo 200 conexiones concurrentes en free tier (suficiente para 5-7)
- **API CMF:** requiere API key gratuita, rate limit no documentado oficialmente

### De Negocio
- **Usuarios internos solamente:** no es un SaaS multi-tenant (simplifica RLS)
- **Idioma:** interfaz en español, código en inglés
- **Moneda:** todos los valores en CLP; conversión a UF automática
- **IVA:** 19% fijo (legislación chilena vigente)
- **Sin integración contable:** MVP no se conecta a sistemas ERP/contables

---

## 8. Roadmap de Versiones

### v0.1 — MVP Core (Semanas 1-8)
- ✅ Auth con magic link
- ✅ CRUD base de datos ítems
- ✅ CRUD clientes
- ✅ Constructor de presupuestos (partidas + líneas + márgenes)
- ✅ UF automática con congelamiento
- ✅ Gastos Generales con prorrateo
- ✅ Generación de cartas PDF (general + desglosada)
- ✅ Estados de presupuesto con adjudicación por partida
- ✅ Colaboración básica en tiempo real
- ✅ Audit log

### v0.2 — Polish & UX (Semanas 9-12)
- Drag-to-reorder avanzado con animaciones
- Keyboard shortcuts completos
- Dark mode
- Importación CSV de ítems
- Dashboard con métricas (presupuestos por mes, tasa de adjudicación)
- Búsqueda global de presupuestos

### v0.3 — Inteligencia (Semanas 13-16)
- Alertas de revisión de precios por email
- Duplicar presupuesto existente como base
- Comparación entre revisiones (diff visual)
- Historial de precios por ítem (gráfico temporal)
- Plantillas de presupuesto por tipo de proyecto

### v1.0 — Enterprise (Semanas 17-24)
- Multi-organización (VINISE + subcontratistas)
- SSO/SAML para clientes enterprise
- API pública para integraciones
- Reportes avanzados y exportación a Excel
- Integración con sistemas contables
- App móvil (PWA) para consulta en terreno
- Notificaciones push para cambios de estado
