# Parámetros dinámicos e interacción entre actividades

## Concepto

Actualmente cada actividad es independiente — sus parámetros son estáticos y no pueden comunicarse entre sí. Para crear flujos de trabajo reales (ej: abrir un archivo, escribir datos, guardar, abrir otro y pegar), se necesita un sistema de **variables compartidas** y **plantillas de parámetros**.

---

## 1. Arquitectura propuesta: Variables de contexto

```
┌─────────────────────────────────────────────────────────┐
│  CONTEXTO DE EJECUCIÓN (compartido entre actividades)   │
├─────────────────────────────────────────────────────────┤
│  {{timestamp}}    → "2026-07-03 14:30:22"               │
│  {{date}}         → "2026-07-03"                        │
│  {{random_name}}  → "informe_a7x3k"                    │
│  {{clipboard}}    → contenido actual del portapapeles   │
│  {{prev_result}}  → resultado de la actividad anterior  │
│  {{counter}}      → número de ciclo actual (1, 2, 3..) │
│  {{custom.nota}}  → variable definida por el usuario    │
└─────────────────────────────────────────────────────────┘
         │
         ▼ Se interpolan en los parámetros de cada actividad
         
Actividad 1: open_file → path: "C:\Docs\informe_{{date}}.xlsx"
Actividad 2: type_text → text: "Actualizado el {{timestamp}}"
Actividad 3: take_screenshot → outputPath: "C:\Capturas\cap_{{counter}}"
```

---

## 2. Cómo implementarlo

### A. Sistema de plantillas en parámetros

Los parámetros aceptarían texto con `{{variable}}` que se resuelve antes de ejecutar:

```typescript
// src/hooks/useSimulation.ts

interface ExecutionContext {
  timestamp: string;
  date: string;
  time: string;
  counter: number;
  cycleNumber: number;
  clipboard: string;
  prevResult: string;
  custom: Record<string, string>;
}

function resolveTemplate(template: string, ctx: ExecutionContext): string {
  return template
    .replace(/\{\{timestamp\}\}/g, ctx.timestamp)
    .replace(/\{\{date\}\}/g, ctx.date)
    .replace(/\{\{time\}\}/g, ctx.time)
    .replace(/\{\{counter\}\}/g, String(ctx.counter))
    .replace(/\{\{cycle\}\}/g, String(ctx.cycleNumber))
    .replace(/\{\{clipboard\}\}/g, ctx.clipboard)
    .replace(/\{\{prev_result\}\}/g, ctx.prevResult)
    .replace(/\{\{custom\.(\w+)\}\}/g, (_, key) => ctx.custom[key] ?? "");
}
```

### B. Paso de resultado entre actividades

Cada actividad devuelve un resultado (string). Ese resultado se guarda en `{{prev_result}}` para que la siguiente lo use:

```typescript
// En el bucle de ejecución:
let context: ExecutionContext = {
  timestamp: new Date().toISOString(),
  date: new Date().toISOString().split("T")[0],
  time: new Date().toLocaleTimeString(),
  counter: 0,
  cycleNumber: cycle + 1,
  clipboard: "",
  prevResult: "",
  custom: {},
};

for (const activity of enabledActivities) {
  context.counter++;
  context.timestamp = new Date().toISOString();
  
  // Resolver plantillas en todos los parámetros
  const resolvedParams: Record<string, string | number | boolean> = {};
  for (const [key, val] of Object.entries(activity.params)) {
    resolvedParams[key] = typeof val === "string"
      ? resolveTemplate(val, context)
      : val;
  }

  // Ejecutar con parámetros resueltos
  const result = await executeActivity({ ...activity, params: resolvedParams });
  
  // Guardar resultado para la siguiente actividad
  context.prevResult = result ?? "";
}
```

### C. Actividad "Definir variable"

Una actividad especial que no hace nada visible, solo define una variable en el contexto:

```typescript
case "set_variable": {
  const varName = activity.params.name as string;
  const varValue = resolveTemplate(activity.params.value as string, context);
  context.custom[varName] = varValue;
  result = `Variable {{custom.${varName}}} = "${varValue}"`;
  break;
}
```

---

## 3. Variables predefinidas disponibles

| Variable | Valor | Ejemplo |
|---|---|---|
| `{{timestamp}}` | Fecha y hora actual ISO | `2026-07-03T14:30:22.000Z` |
| `{{date}}` | Solo fecha | `2026-07-03` |
| `{{time}}` | Solo hora | `14:30:22` |
| `{{counter}}` | Número secuencial de actividad en el ciclo | `1`, `2`, `3`... |
| `{{cycle}}` | Número del ciclo actual | `1`, `2`... |
| `{{prev_result}}` | Resultado texto de la actividad anterior | `"Archivo abierto: informe.xlsx"` |
| `{{clipboard}}` | Contenido del portapapeles del sistema | `"texto copiado"` |
| `{{random_id}}` | ID aleatorio de 8 caracteres | `"a7x3k9m2"` |
| `{{random_number}}` | Número aleatorio 1-9999 | `"4217"` |
| `{{env.USERNAME}}` | Variable de entorno del sistema | `"usuario"` |
| `{{custom.NOMBRE}}` | Variable definida por el usuario | lo que haya asignado |

---

## 4. Ejemplos de flujos con parámetros dinámicos

### Flujo 1: Informe diario automatizado

```
1. open_file       → path: "C:\Docs\informe_{{date}}.xlsx"
2. type_text       → text: "Actualización del {{date}} a las {{time}}"
3. keyboard_shortcut → shortcut: "ctrl+s"
4. take_screenshot → outputPath: "C:\Capturas\informe_{{date}}"
```

### Flujo 2: Copiar datos entre aplicaciones

```
1. open_app        → path: "excel.exe"
2. idle_break      → seconds: 3  (esperar que cargue)
3. keyboard_shortcut → shortcut: "ctrl+c"  (copiar celda seleccionada)
4. open_app        → path: "notepad.exe"
5. keyboard_shortcut → shortcut: "ctrl+v"  (pegar en notepad)
6. type_text       → text: " — copiado el {{timestamp}}"
7. keyboard_shortcut → shortcut: "ctrl+s"  (guardar)
```

### Flujo 3: Generación de archivos numerados

```
1. set_variable    → name: "filename", value: "reporte_{{counter}}_{{date}}"
2. run_powershell  → script: "New-Item -Path 'C:\Temp\{{custom.filename}}.txt' -Value 'Generado automáticamente'"
3. open_file       → path: "C:\Temp\{{custom.filename}}.txt"
4. type_text       → text: "Contenido del reporte número {{counter}}"
5. keyboard_shortcut → shortcut: "ctrl+s"
```

### Flujo 4: Navegación con datos dinámicos

```
1. set_variable    → name: "search", value: "ventas Q{{cycle}} 2026"
2. open_browser    → url: "https://intranet/search?q={{custom.search}}"
3. idle_break      → seconds: 5
4. take_screenshot → outputPath: "C:\Evidencias\busqueda_{{cycle}}"
```

---

## 5. Interacción con aplicaciones externas

### Via portapapeles (más universal)

El portapapeles es el puente más natural entre Desktop Automator y cualquier otra app:

```
1. run_powershell  → script: "Get-Date -Format 'yyyy-MM-dd' | Set-Clipboard"
2. open_app        → path: "notepad.exe"
3. keyboard_shortcut → shortcut: "ctrl+v"   (pega la fecha en Notepad)
```

### Via línea de comandos

Muchas apps aceptan parámetros por CLI:

```
1. open_app → path: "excel.exe \"C:\Datos\{{date}}.xlsx\""
2. open_app → path: "chrome.exe --new-tab https://intranet/report/{{cycle}}"
3. open_app → path: "outlook.exe /c ipm.note /m usuario@empresa.com"
```

### Via PowerShell como orquestador

PowerShell puede hacer casi cualquier cosa que las APIs de Windows expongan:

```powershell
# Leer un valor de Excel y guardarlo en un archivo
$excel = New-Object -ComObject Excel.Application
$wb = $excel.Workbooks.Open("C:\Datos\reporte.xlsx")
$valor = $wb.Sheets(1).Range("A1").Value2
$valor | Out-File "C:\Temp\valor_actual.txt"
$excel.Quit()
```

```powershell
# Enviar un email via Outlook COM
$outlook = New-Object -ComObject Outlook.Application
$mail = $outlook.CreateItem(0)
$mail.To = "jefe@empresa.com"
$mail.Subject = "Reporte automático $(Get-Date -Format 'dd/MM/yyyy')"
$mail.Body = "Adjunto el reporte del día."
$mail.Send()
```

```powershell
# Interactuar con Teams via URI
Start-Process "msteams://l/chat/0/0?users=usuario@empresa.com&message=Hola, ya envié el reporte"
```

---

## 6. Implementación técnica recomendada

### Fase 1 — Variables básicas (mínimo viable)

- Implementar `{{timestamp}}`, `{{date}}`, `{{time}}`, `{{counter}}`, `{{cycle}}`
- Resolver plantillas en todos los parámetros string antes de ejecutar
- Añadir indicador visual en la UI: si un parámetro contiene `{{...}}`, mostrarlo en color diferente

### Fase 2 — Resultado encadenado

- Guardar `{{prev_result}}` después de cada actividad
- Añadir actividad "Definir variable" (`set_variable`)
- Acceso a `{{custom.nombre}}`

### Fase 3 — Variables del sistema

- `{{clipboard}}` — leer portapapeles via Rust (`arboard` crate)
- `{{env.VARIABLE}}` — variables de entorno
- `{{file.content:ruta}}` — leer contenido de un archivo como variable

### Fase 4 — Condicionales (avanzado)

- Actividad "Si/Entonces": ejecuta la siguiente solo si una condición se cumple
- Ejemplo: `{{prev_result}}` contiene "error" → saltar actividad

```typescript
case "condition": {
  const varValue = resolveTemplate(activity.params.variable as string, context);
  const operator = activity.params.operator as string; // "contains", "equals", "not_empty"
  const expected = activity.params.value as string;
  
  let passes = false;
  switch (operator) {
    case "contains": passes = varValue.includes(expected); break;
    case "equals":   passes = varValue === expected; break;
    case "not_empty": passes = varValue.trim().length > 0; break;
  }
  
  if (!passes) {
    // Skip next activity
    skipNext = true;
  }
  break;
}
```

---

## 7. Diagrama de la UI para variables

En los campos de texto de parámetros, añadir:

```
┌─────────────────────────────────────────────────────────────┐
│ RUTA DEL ARCHIVO                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ C:\Docs\informe_{{date}}.xlsx                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 💡 Variables disponibles:                                   │
│    {{date}} {{time}} {{timestamp}} {{counter}} {{cycle}}    │
│    {{prev_result}} {{clipboard}} {{random_id}}              │
└─────────────────────────────────────────────────────────────┘
```

Y un botón "📎 Insertar variable" que despliega un picker con las variables disponibles y las inserta en el cursor.

---

## Resumen

| Nivel | Qué permite | Ejemplo |
|---|---|---|
| **Actual** | Actividades independientes con params estáticos | `path: "C:\archivo.xlsx"` |
| **Fase 1** | Variables de tiempo y secuencia | `path: "C:\archivo_{{date}}.xlsx"` |
| **Fase 2** | Encadenamiento de resultados | `text: "Resultado anterior: {{prev_result}}"` |
| **Fase 3** | Lectura del sistema | `text: "Usuario: {{env.USERNAME}}"` |
| **Fase 4** | Lógica condicional | Saltar actividades según condiciones |

La Fase 1 cubre el 80% de los casos de uso y es la más rápida de implementar (~2-3 horas).
