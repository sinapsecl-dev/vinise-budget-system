# 📖 VINISE Budget System — Backlog de Historias de Usuario

**Formato:** Gherkin (Given/When/Then)  
**Priorización:** MoSCoW (Must / Should / Could / Won't)  
**Estimación:** Story Points (Fibonacci: 1, 2, 3, 5, 8, 13)

---

## Módulo 1: Gestión de Base de Datos de Ítems

### US-1.1: Crear ítem en base de datos
**Prioridad:** Must | **SP:** 3 | **Sprint:** 1

```gherkin
Feature: Crear ítem en base de datos de ítems

  Scenario: Admin crea un nuevo ítem exitosamente
    Given el usuario tiene rol "admin"
    And está en la página "/database/items"
    When hace clic en "Nuevo Ítem"
    And completa los campos:
      | Campo           | Valor                          |
      | Código          | CHQ-EMP-MONO-001               |
      | Compañía        | Chilquinta                     |
      | Tipo Partida    | EMPALME                        |
      | Descripción     | Empalme monofásico subterráneo |
      | Unidad          | CU                             |
      | Valor Material  | 25.000                         |
      | Valor HH        | 15.000                         |
      | Margen Default  | 20%                            |
    And hace clic en "Guardar"
    Then el ítem se crea en la base de datos con estado activo
    And la fecha "last_reviewed_at" se establece a hoy
    And aparece toast "Ítem creado exitosamente"

  Scenario: Admin intenta crear ítem con código duplicado
    Given existe un ítem con código "CHQ-EMP-MONO-001" para Chilquinta
    When el admin intenta crear otro ítem con el mismo código para Chilquinta
    Then el sistema muestra error "Ya existe un ítem con este código para esta compañía"
    And el ítem no se crea

  Scenario: Editor intenta acceder a gestión de ítems
    Given el usuario tiene rol "editor"
    When intenta navegar a "/database/items"
    Then es redirigido al dashboard con mensaje "No tienes permisos para esta sección"
```

### US-1.2: Editar ítem existente
**Prioridad:** Must | **SP:** 2 | **Sprint:** 1

```gherkin
Feature: Editar ítem existente

  Scenario: Admin actualiza precio de material de un ítem
    Given el usuario tiene rol "admin"
    And existe el ítem "CHQ-EMP-MONO-001" con material_value_clp = 25.000
    When el admin cambia material_value_clp a 28.000
    And hace clic en "Guardar"
    Then el valor se actualiza a 28.000
    And "last_reviewed_at" se actualiza a la fecha actual
    And "updated_by" se registra con el ID del admin
    And los presupuestos existentes que usan este ítem NO se modifican

  Scenario: Admin edita ítem usado en presupuesto existente
    Given el ítem "CHQ-EMP-MONO-001" está usado en presupuesto "EECC-05"
    When el admin cambia el valor material de 25.000 a 30.000
    Then el ítem en base de datos se actualiza a 30.000
    And el presupuesto "EECC-05" mantiene el valor original de 25.000 (snapshot)
    And aparece nota informativa "Este ítem se usa en 1 presupuesto activo"
```

### US-1.3: Buscar y filtrar ítems
**Prioridad:** Must | **SP:** 2 | **Sprint:** 1

```gherkin
Feature: Buscar y filtrar ítems

  Scenario: Admin busca ítems por código parcial
    Given existen ítems con códigos "CHQ-EMP-MONO-001", "CHQ-EMP-TRI-002", "CGE-EMP-MONO-001"
    When el admin escribe "CHQ-EMP" en el buscador
    Then se muestran solo "CHQ-EMP-MONO-001" y "CHQ-EMP-TRI-002"

  Scenario: Admin filtra por compañía
    Given existen ítems de Chilquinta, CGE y ENEL
    When el admin selecciona filtro "Compañía: CGE"
    Then solo se muestran ítems de CGE

  Scenario: Admin filtra por tipo de partida
    Given existen ítems tipo "EMPALME", "OOEE" y "OOCC"
    When el admin selecciona filtro "Tipo: EMPALME"
    Then solo se muestran ítems de tipo EMPALME
```

### US-1.4: Desactivar ítem
**Prioridad:** Must | **SP:** 1 | **Sprint:** 1

```gherkin
Feature: Desactivar ítem

  Scenario: Admin desactiva un ítem
    Given existe el ítem activo "CHQ-EMP-MONO-001"
    When el admin hace clic en "Desactivar"
    And confirma la acción
    Then el ítem se marca como is_active = false
    And el ítem no aparece en búsquedas del constructor de presupuestos
    And el ítem sigue visible en la lista de base de datos con indicador "Inactivo"
```

### US-1.5: Alerta de revisión de ítems
**Prioridad:** Should | **SP:** 3 | **Sprint:** 6

```gherkin
Feature: Alerta automática de revisión de precios

  Scenario: Sistema detecta ítems sin revisar por más de 60 días
    Given existen ítems con last_reviewed_at más de 60 días atrás
    When el cron job mensual se ejecuta
    Then el sistema envía email a usuarios con rol "admin"
    And el email lista todos los ítems que requieren revisión con:
      | Código | Compañía | Última revisión | Días sin revisar |

  Scenario: Admin marca ítem como revisado sin cambiar precio
    Given el ítem "CHQ-EMP-MONO-001" está marcado para revisión
    When el admin hace clic en "Marcar como revisado"
    Then "last_reviewed_at" se actualiza a la fecha actual
    And el ítem desaparece de la lista de alertas
```

---

## Módulo 2: Gestión de Clientes

### US-2.1: Crear cliente
**Prioridad:** Must | **SP:** 2 | **Sprint:** 1

```gherkin
Feature: Crear cliente

  Scenario: Usuario crea un nuevo cliente
    Given el usuario está autenticado (admin o editor)
    And está en la página "/clients"
    When hace clic en "Nuevo Cliente"
    And completa:
      | Campo          | Valor                     |
      | Empresa        | Constructora Los Andes    |
      | Contacto       | María García              |
      | Ciudad         | Valparaíso                |
      | Teléfono       | +56 9 1234 5678           |
      | Email          | maria@losandes.cl         |
    And hace clic en "Guardar"
    Then el cliente se crea exitosamente
    And aparece en la lista de clientes

  Scenario: Validación de teléfono chileno
    Given el usuario está creando un cliente
    When ingresa teléfono "12345"
    Then el sistema muestra error "Formato inválido. Use: +56 9 XXXX XXXX"
```

### US-2.2: Editar y eliminar cliente
**Prioridad:** Must | **SP:** 1 | **Sprint:** 1

```gherkin
Feature: Editar y eliminar cliente

  Scenario: Usuario edita datos de un cliente
    Given existe el cliente "Constructora Los Andes"
    When el usuario modifica la ciudad a "Viña del Mar"
    And hace clic en "Guardar"
    Then los datos se actualizan
    And los presupuestos existentes para este cliente muestran la info actualizada

  Scenario: Intento de eliminar cliente con presupuestos asociados
    Given el cliente "Constructora Los Andes" tiene 3 presupuestos asociados
    When el usuario intenta eliminarlo
    Then el sistema muestra "No se puede eliminar: tiene 3 presupuestos asociados"
    And sugiere desactivar en vez de eliminar
```

### US-2.3: Autocompletado de clientes
**Prioridad:** Should | **SP:** 2 | **Sprint:** 2

```gherkin
Feature: Autocompletado de clientes en presupuesto

  Scenario: Autocompletado al crear presupuesto
    Given existen clientes "Constructora Los Andes", "Constructora Pacífico", "ENEL Chile"
    When el usuario está creando un presupuesto y escribe "Const" en el campo cliente
    Then aparece dropdown con "Constructora Los Andes" y "Constructora Pacífico"
    And al seleccionar uno, se auto-completan todos los campos del cliente
```

---

## Módulo 3: Creación y Edición de Presupuesto

### US-3.1: Crear presupuesto nuevo
**Prioridad:** Must | **SP:** 5 | **Sprint:** 2

```gherkin
Feature: Crear presupuesto nuevo

  Scenario: Editor crea un presupuesto desde cero
    Given el usuario tiene rol "editor" o "admin"
    And el valor UF del día es $38.426,21
    When hace clic en "Nuevo Presupuesto"
    Then el sistema genera código "EECC-XX" (siguiente secuencial)
    And la revisión se establece en "REV.00"
    And el estado se establece en "draft"
    And uf_value_at_creation se registra como 38426.21
    And se redirige al editor de presupuesto
```

### US-3.2: Agregar partida al presupuesto
**Prioridad:** Must | **SP:** 3 | **Sprint:** 2

```gherkin
Feature: Agregar partida al presupuesto

  Scenario: Editor agrega una partida
    Given el editor está en el presupuesto "EECC-05" en estado "draft"
    When hace clic en "Agregar Partida"
    And ingresa nombre "Construcción Empalmes Monofásicos"
    Then se crea la partida con número secuencial (ej: Partida 1)
    And la partida aparece en el editor como un bloque colapsable
    And el Cuadro Resumen se actualiza mostrando la nueva partida con total $0

  Scenario: Editor agrega múltiples partidas
    Given el presupuesto "EECC-05" ya tiene Partida 1 y Partida 2
    When el editor agrega una nueva partida
    Then se crea como Partida 3
    And las 3 partidas se muestran ordenadas secuencialmente
```

### US-3.3: Buscar y agregar ítems a partida
**Prioridad:** Must | **SP:** 5 | **Sprint:** 2

```gherkin
Feature: Buscar y agregar ítems desde base de datos

  Scenario: Editor busca ítem con Command Palette
    Given el editor está editando Partida 1 del presupuesto "EECC-05"
    When presiona Cmd+K (o hace clic en "Agregar Ítem")
    Then se abre el diálogo de búsqueda tipo Command Palette
    And muestra campo de búsqueda con filtros por Compañía y Tipo

  Scenario: Editor selecciona ítem y lo agrega
    Given el diálogo de búsqueda está abierto
    And el editor busca "empalme mono"
    When selecciona "CHQ-EMP-MONO-001 — Empalme monofásico subterráneo"
    Then el ítem se agrega como nueva línea en la partida
    And los valores se copian como snapshot:
      | Campo           | Valor  |
      | material_value  | 25.000 |
      | hh_value        | 15.000 |
    And el campo "cantidad" queda enfocado para ingreso inmediato
    And la descripción personalizable muestra el texto base del ítem
```

### US-3.4: Editar línea de ítem (inline editing)
**Prioridad:** Must | **SP:** 5 | **Sprint:** 2

```gherkin
Feature: Editar línea de ítem en el presupuesto

  Scenario: Editor personaliza descripción del ítem (apellido)
    Given existe una línea con ítem "Empalme monofásico subterráneo"
    When el editor hace clic en la descripción
    And modifica a "Empalme monofásico subterráneo S-9 / 40A"
    And presiona Enter
    Then la descripción personalizada se guarda en custom_description
    And el cambio se registra en audit_log

  Scenario: Editor ingresa cantidad
    Given existe una línea sin cantidad definida
    When el editor hace clic en el campo cantidad
    And escribe "190"
    Then el sistema calcula en tiempo real:
      | Cálculo               | Valor                                          |
      | Valor unitario CLP    | (25.000 + 15.000) × 1,20 = 48.000              |
      | Valor unitario UF     | 48.000 / 38.426,21 = 1,25 UF (redondeado ↑)    |
      | Valor total UF        | 1,25 × 190 = 237,50 UF                         |
    And el Cuadro Resumen se actualiza automáticamente

  Scenario: Editor no puede modificar valores de material y HH
    Given existe una línea con material_value = 25.000 y hh_value = 15.000
    When el editor intenta hacer clic en los campos de material y HH
    Then los campos aparecen como read-only con ícono de candado
    And un tooltip dice "Valor fijo desde base de datos"
```

### US-3.5: Configurar márgenes
**Prioridad:** Must | **SP:** 3 | **Sprint:** 3

```gherkin
Feature: Configurar márgenes del presupuesto

  Scenario: Editor establece margen global
    Given el presupuesto "EECC-05" está en estado "draft"
    When el editor ingresa margen global de 25%
    Then todas las líneas que no tienen margen individual se recalculan con 25%
    And el Cuadro Resumen se actualiza

  Scenario: Editor override margen por línea
    Given el presupuesto tiene margen global de 20%
    And la línea "Empalme trifásico" tiene margen NULL (usa global)
    When el editor hace clic en el campo margen de esa línea
    And ingresa 30%
    Then esa línea se calcula con 30% en vez de 20%
    And las demás líneas mantienen el 20% global
    And aparece indicador visual "Margen personalizado" en la línea

  Scenario: Jerarquía de márgenes funciona correctamente
    Given el presupuesto tiene margen global de 20%
    And la Partida 1 no tiene margen específico
    And la línea A de Partida 1 tiene margen 30%
    And la línea B de Partida 1 tiene margen NULL
    Then la línea A se calcula con 30% (override de línea)
    And la línea B se calcula con 20% (cascada al global)
```

### US-3.6: Gastos Generales con prorrateo
**Prioridad:** Must | **SP:** 5 | **Sprint:** 3

```gherkin
Feature: Gastos Generales con prorrateo

  Scenario: Editor agrega gasto general con prorrateo equitativo
    Given el presupuesto tiene Partida 1, Partida 2 y Partida 3
    When el editor agrega un Gasto General:
      | Campo       | Valor       |
      | Nombre      | Viáticos    |
      | Valor CLP   | 150.000     |
      | Cantidad    | 10          |
      | Asignación  | A (General) |
    Then el total del gasto es 1.500.000 CLP
    And se prorratea equitativamente: 500.000 CLP por partida
    And el Cuadro Resumen refleja el prorrateo

  Scenario: Editor asigna gasto a partida específica
    Given el presupuesto tiene 3 partidas
    When el editor agrega un Gasto General:
      | Campo       | Valor               |
      | Nombre      | Arriendo grúa       |
      | Valor CLP   | 800.000             |
      | Cantidad    | 1                   |
      | Asignación  | 2 (Partida 2)       |
    Then los 800.000 CLP se cargan solo a Partida 2
    And las otras partidas no se ven afectadas

  Scenario: Ejemplo numérico completo de prorrateo
    Given un presupuesto con:
      | Partida | Total Ítems UF |
      | 1       | 500,00         |
      | 2       | 300,00         |
      | 3       | 200,00         |
    And Gastos Generales:
      | Nombre      | Total CLP   | Asignación |
      | Viáticos    | 900.000     | A          |
      | Combustible | 600.000     | A          |
      | Grúa        | 800.000     | 2          |
    And UF = 38.426,21
    Then el prorrateo "A" es:
      | Total GA "A" = 1.500.000 CLP = 39,04 UF |
      | Por partida = 39,04 / 3 = 13,02 UF       |
    And los totales por partida son:
      | Partida | Ítems   | GA Prorr | GA Específ | Total     |
      | 1       | 500,00  | 13,02    | 0          | 513,02 UF |
      | 2       | 300,00  | 13,02    | 20,82      | 333,84 UF |
      | 3       | 200,00  | 13,02    | 0          | 213,02 UF |
```

### US-3.7: Cuadro Resumen automático
**Prioridad:** Must | **SP:** 3 | **Sprint:** 3

```gherkin
Feature: Cuadro Resumen del presupuesto

  Scenario: Cuadro Resumen se actualiza en tiempo real
    Given el presupuesto tiene partidas con líneas y gastos generales
    When el editor modifica cualquier valor (cantidad, margen, gasto)
    Then el Cuadro Resumen se recalcula inmediatamente mostrando:
      | Concepto           | Valor        |
      | Partida 1          | XXX,XX UF    |
      | Partida 2          | XXX,XX UF    |
      | ...                | ...          |
      | Total Neto         | X.XXX,XX UF  |
      | IVA (19%)          | XXX,XX UF    |
      | Total con IVA      | X.XXX,XX UF  |
    And el Total Neto cuadra exactamente con la suma de partidas
```

---

## Módulo 4: Gestión de Estados

### US-4.1: Enviar presupuesto
**Prioridad:** Must | **SP:** 5 | **Sprint:** 5

```gherkin
Feature: Enviar presupuesto con congelamiento de UF

  Scenario: Editor envía presupuesto
    Given el presupuesto "EECC-05 REV.00" está en estado "draft"
    And tiene al menos 1 partida con al menos 1 línea
    And el valor UF del día es $38.426,21
    When el editor hace clic en "Enviar Presupuesto"
    And confirma la acción en el diálogo de confirmación
    Then el estado cambia a "sent"
    And uf_value_at_send se registra como 38426.21
    And sent_at se registra con la fecha/hora actual
    And se generan automáticamente los PDFs (general + desglosado)
    And los PDFs se almacenan en Supabase Storage
    And el presupuesto se vuelve read-only (excepto adjudicación)
    And audit_log registra el cambio de estado

  Scenario: Intento de enviar presupuesto vacío
    Given el presupuesto "EECC-06" está en estado "draft" sin partidas
    When el editor intenta enviarlo
    Then el sistema muestra error "El presupuesto debe tener al menos una partida con ítems"
```

### US-4.2: Adjudicar partida individual
**Prioridad:** Must | **SP:** 3 | **Sprint:** 5

```gherkin
Feature: Adjudicación por partida

  Scenario: Editor adjudica una partida de un presupuesto enviado
    Given el presupuesto "EECC-05" está en estado "sent"
    And tiene Partida 1, Partida 2 y Partida 3
    When el editor marca Partida 1 como "Adjudicada"
    Then Partida 1 se marca con is_awarded = true
    And el estado del presupuesto cambia a "partially_awarded"
    And audit_log registra: "Partida 1 adjudicada por [Usuario]"

  Scenario: Todas las partidas adjudicadas
    Given el presupuesto "EECC-05" tiene 3 partidas
    And Partida 1 y 2 ya están adjudicadas
    When el editor adjudica Partida 3
    Then el estado del presupuesto cambia automáticamente a "awarded"
```

### US-4.3: Crear nueva revisión
**Prioridad:** Must | **SP:** 5 | **Sprint:** 5

```gherkin
Feature: Crear nueva revisión de presupuesto

  Scenario: Editor crea revisión con UF actualizada
    Given el presupuesto "EECC-05 REV.00" fue enviado con UF = 38.000,00
    And el valor UF de hoy es 38.426,21
    When el editor hace clic en "Nueva Revisión"
    Then el sistema muestra diálogo:
      "¿Actualizar UF al valor de hoy ($38.426,21) o mantener la UF original ($38.000,00)?"
    When el editor elige "Actualizar UF"
    Then se crea "EECC-05 REV.01" con uf_value_at_creation = 38426.21
    And todos los valores UF se recalculan con la nueva UF
    And el estado se establece en "draft"
    And la REV.00 permanece intacta

  Scenario: Editor crea revisión manteniendo UF original
    Given el presupuesto "EECC-05 REV.00" fue enviado con UF = 38.000,00
    When el editor elige "Mantener UF original"
    Then se crea "EECC-05 REV.01" con uf_value_at_creation = 38000.00
    And los valores en UF permanecen idénticos a REV.00
```

### US-4.4: Cerrar presupuesto
**Prioridad:** Must | **SP:** 1 | **Sprint:** 5

```gherkin
Feature: Cerrar presupuesto

  Scenario: Editor cierra presupuesto adjudicado
    Given el presupuesto "EECC-05" está en estado "awarded"
    When el editor hace clic en "Cerrar Presupuesto"
    And confirma la acción
    Then el estado cambia a "closed"
    And el presupuesto se vuelve completamente read-only
    And no se pueden crear nuevas revisiones
```

---

## Módulo 5: Generación de Cartas PDF

### US-5.1: Generar carta modo general
**Prioridad:** Must | **SP:** 8 | **Sprint:** 4

```gherkin
Feature: Generar carta PDF modo general

  Scenario: Sistema genera carta con totales por partida
    Given el presupuesto "EECC-05 REV.00" tiene:
      | Partida                    | Total Neto UF |
      | Construcción Empalmes      | 513,02        |
      | Obras Eléctricas           | 333,84        |
      | Obras Civiles              | 213,02        |
    And UF congelada = 38.426,21
    And las consideraciones del proyecto están redactadas
    When el editor hace clic en "Generar PDF General"
    Then se genera un PDF con:
      - Header: logo VINISE + datos empresa
      - Bloque de referencia: código, revisión, fecha, UF
      - Datos del cliente: empresa, contacto, ciudad
      - Tabla de partidas:
        | N° | Descripción Partida        | Valor Neto UF+IVA |
        | 1  | Construcción Empalmes      | 610,50            |
        | 2  | Obras Eléctricas           | 397,27            |
        | 3  | Obras Civiles              | 253,50            |
        |    | TOTAL                      | 1.261,27 UF+IVA   |
      - Sección consideraciones
      - Duración de la propuesta
      - Pie de página: "Valores expresados en UF + IVA"
```

### US-5.2: Generar carta modo desglosado
**Prioridad:** Must | **SP:** 8 | **Sprint:** 4

```gherkin
Feature: Generar carta PDF modo desglosado

  Scenario: Sistema genera carta con detalle de cada ítem
    Given el presupuesto "EECC-05" tiene ítems con cantidad y valores
    When el editor hace clic en "Generar PDF Desglosado"
    Then se genera un PDF con tabla detallada por partida:
      | N° | Descripción                        | Cant | Ud  | V.Unit UF+IVA | V.Total UF+IVA |
      | 1  | Empalme mono. sub. S-9/40A         | 190  | CU  | 1,49           | 283,10          |
      | 2  | Empalme trifásico SR-225            | 45   | CU  | 3,21           | 144,45          |
      |    | SUBTOTAL PARTIDA 1                 |      |     |                | 427,55          |
    And cada valor unitario UF+IVA = valor_unitario_uf × 1,19
    And los totales cuadran matemáticamente
```

### US-5.3: Preview de carta antes de generar
**Prioridad:** Should | **SP:** 3 | **Sprint:** 4

```gherkin
Feature: Preview de carta en el editor

  Scenario: Editor previsualiza la carta en panel lateral
    Given el editor está en el presupuesto "EECC-05"
    When hace clic en "Preview" o presiona Cmd+P
    Then se abre panel lateral con preview de la carta
    And puede alternar entre modo "General" y "Desglosado"
    And los valores están calculados en tiempo real
    And puede cerrar el preview y seguir editando
```

### US-5.4: Descargar PDF con URL firmada
**Prioridad:** Should | **SP:** 2 | **Sprint:** 4

```gherkin
Feature: Descarga segura de PDF

  Scenario: Editor descarga PDF generado
    Given el presupuesto "EECC-05" tiene PDFs generados
    When el editor hace clic en "Descargar PDF General"
    Then el sistema genera URL firmada de Supabase Storage (expira en 1h)
    And la descarga se inicia automáticamente
    And el nombre del archivo es "VINISE_EECC-05_REV00_General.pdf"
```

---

## Módulo 6: Colaboración en Tiempo Real y Auditoría

### US-6.1: Edición colaborativa
**Prioridad:** Must | **SP:** 8 | **Sprint:** 6

```gherkin
Feature: Edición colaborativa en tiempo real

  Scenario: Dos editores trabajan en el mismo presupuesto
    Given el Editor A tiene abierto presupuesto "EECC-05"
    And el Editor B abre el mismo presupuesto
    When el Editor A modifica la cantidad de la línea 1 de Partida 1 a "200"
    Then el Editor B ve la cantidad actualizarse a "200" en tiempo real
    And el Cuadro Resumen de ambos editores se recalcula
    And el Editor B ve toast: "Cantidad actualizada por [Editor A]"

  Scenario: Indicador de presencia
    Given el Editor A está editando Partida 1
    And el Editor B está editando Partida 3
    Then ambos ven un avatar con iniciales del otro editor en el header
    And Partida 1 muestra indicador "Editando: [Editor A]"
    And Partida 3 muestra indicador "Editando: [Editor B]"
```

### US-6.2: Audit log de cambios
**Prioridad:** Must | **SP:** 5 | **Sprint:** 6

```gherkin
Feature: Registro de auditoría inmutable

  Scenario: Sistema registra cambio de valor
    Given el editor modifica margen de línea de 20% a 25%
    Then se inserta en audit_log:
      | Campo          | Valor                |
      | budget_id      | [ID presupuesto]     |
      | user_id        | [ID editor]          |
      | action         | margin_changed       |
      | field_changed  | line_margin          |
      | old_value      | 0.20                 |
      | new_value      | 0.25                 |
      | created_at     | [timestamp]          |

  Scenario: Editor visualiza historial de cambios
    Given el presupuesto "EECC-05" tiene 15 entradas de audit_log
    When el editor navega a "/budgets/[id]/audit"
    Then se muestra timeline cronológico con todos los cambios
    And cada entrada muestra: fecha, usuario, acción, valor anterior → valor nuevo
    And se puede filtrar por tipo de acción y por usuario

  Scenario: Audit log es inmutable
    Given existen registros en audit_log
    When cualquier usuario intenta modificar o eliminar un registro
    Then la operación es rechazada por RLS policies
    And el registro permanece intacto
```

---

## Módulo 7: Administración de Usuarios y Roles

### US-7.1: Login con magic link
**Prioridad:** Must | **SP:** 3 | **Sprint:** 0

```gherkin
Feature: Autenticación con magic link

  Scenario: Usuario inicia sesión con magic link
    Given el usuario tiene email registrado en el sistema
    When ingresa su email en la página de login
    And hace clic en "Enviar enlace mágico"
    Then recibe un email con link de acceso
    When hace clic en el link del email
    Then inicia sesión automáticamente
    And es redirigido al dashboard

  Scenario: Email no registrado
    Given el email "hacker@evil.com" no está registrado
    When alguien intenta solicitar magic link con ese email
    Then el sistema muestra mensaje genérico "Si el email está registrado, recibirás un enlace"
    And no se envía ningún email (seguridad: no revelar emails válidos)
```

### US-7.2: Gestión de usuarios por Admin
**Prioridad:** Must | **SP:** 3 | **Sprint:** 0

```gherkin
Feature: Gestión de usuarios

  Scenario: Admin invita nuevo usuario
    Given el usuario tiene rol "admin"
    When navega a "/settings" sección "Usuarios"
    And hace clic en "Invitar Usuario"
    And completa:
      | Campo   | Valor                  |
      | Nombre  | Carolina Muñoz         |
      | Email   | carolina@vinise.cl     |
      | Rol     | Editor                 |
    And hace clic en "Enviar Invitación"
    Then se registra el usuario en Supabase Auth
    And se crea registro en tabla users con rol "editor"
    And el usuario recibe email de invitación

  Scenario: Admin desactiva usuario
    Given existe el usuario "Carolina Muñoz" con estado activo
    When el admin hace clic en "Desactivar"
    Then el usuario no puede iniciar sesión
    And los presupuestos donde participó mantienen su información en audit_log
```

### US-7.3: Permisos diferenciados por rol
**Prioridad:** Must | **SP:** 2 | **Sprint:** 0

```gherkin
Feature: Control de acceso por rol

  Scenario: Admin accede a todas las funciones
    Given el usuario tiene rol "admin"
    Then puede acceder a:
      | Función                     |
      | Dashboard                   |
      | CRUD Ítems                  |
      | CRUD Clientes               |
      | CRUD Presupuestos           |
      | Generar PDFs                |
      | Gestión de Usuarios         |
      | Configuración del sistema   |

  Scenario: Editor tiene acceso limitado
    Given el usuario tiene rol "editor"
    Then puede acceder a:
      | Función              |
      | Dashboard            |
      | Ver Ítems (read-only)|
      | CRUD Clientes        |
      | CRUD Presupuestos    |
      | Generar PDFs         |
    And NO puede acceder a:
      | Función               |
      | CRUD Ítems            |
      | Gestión de Usuarios   |
      | Configuración sistema |
```

---

## Resumen del Backlog

| ID | Historia | Módulo | Prioridad | SP | Sprint |
|---|---|---|---|---|---|
| US-1.1 | Crear ítem | Ítems | Must | 3 | 1 |
| US-1.2 | Editar ítem | Ítems | Must | 2 | 1 |
| US-1.3 | Buscar/filtrar ítems | Ítems | Must | 2 | 1 |
| US-1.4 | Desactivar ítem | Ítems | Must | 1 | 1 |
| US-1.5 | Alerta revisión | Ítems | Should | 3 | 6 |
| US-2.1 | Crear cliente | Clientes | Must | 2 | 1 |
| US-2.2 | Editar/eliminar cliente | Clientes | Must | 1 | 1 |
| US-2.3 | Autocompletado clientes | Clientes | Should | 2 | 2 |
| US-3.1 | Crear presupuesto | Presupuestos | Must | 5 | 2 |
| US-3.2 | Agregar partida | Presupuestos | Must | 3 | 2 |
| US-3.3 | Buscar/agregar ítems | Presupuestos | Must | 5 | 2 |
| US-3.4 | Editar línea inline | Presupuestos | Must | 5 | 2 |
| US-3.5 | Configurar márgenes | Presupuestos | Must | 3 | 3 |
| US-3.6 | Gastos Generales prorrateo | Presupuestos | Must | 5 | 3 |
| US-3.7 | Cuadro Resumen | Presupuestos | Must | 3 | 3 |
| US-4.1 | Enviar presupuesto | Estados | Must | 5 | 5 |
| US-4.2 | Adjudicar partida | Estados | Must | 3 | 5 |
| US-4.3 | Nueva revisión | Estados | Must | 5 | 5 |
| US-4.4 | Cerrar presupuesto | Estados | Must | 1 | 5 |
| US-5.1 | PDF modo general | PDF | Must | 8 | 4 |
| US-5.2 | PDF modo desglosado | PDF | Must | 8 | 4 |
| US-5.3 | Preview carta | PDF | Should | 3 | 4 |
| US-5.4 | Descarga URL firmada | PDF | Should | 2 | 4 |
| US-6.1 | Edición colaborativa | Colaboración | Must | 8 | 6 |
| US-6.2 | Audit log | Auditoría | Must | 5 | 6 |
| US-7.1 | Login magic link | Auth | Must | 3 | 0 |
| US-7.2 | Gestión usuarios | Auth | Must | 3 | 0 |
| US-7.3 | Permisos por rol | Auth | Must | 2 | 0 |

**Total Story Points:** 100  
**Velocity estimada:** 12-15 SP/sprint  
**Sprints estimados:** 7-8 (1 semana cada uno)
