import type { Activity, SimulationConfig } from "../types";

export interface SampleProfile {
  id: string;
  name: string;
  description: string;
  lang: "es" | "en";
  config: Omit<SimulationConfig, "activities">;
  activities: Activity[];
}

export const SAMPLE_PROFILES: SampleProfile[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // ESPAÑOL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "es-oficina",
    name: "🏢 Jornada de oficina",
    description: "Simula una jornada laboral típica: intranet, Excel, navegación, pausas",
    lang: "es",
    config: { minDelay: 5, maxDelay: 20, loop: true, loopCount: 0, humanize: true },
    activities: [
      { id: "1", type: "open_browser", label: "Abrir intranet corporativa", params: { url: "https://example.com/intranet" }, enabled: true },
      { id: "2", type: "mouse_move", label: "Revisar página (scroll y mouse)", params: { duration: 25 }, enabled: true },
      { id: "3", type: "open_spreadsheet", label: "Abrir hoja de seguimiento", params: { path: "" }, enabled: true },
      { id: "4", type: "type_text", label: "Añadir nota en documento", params: { text: "Revisado y actualizado el registro del día {{date}}." }, enabled: true },
      { id: "5", type: "keyboard_shortcut", label: "Guardar documento", params: { shortcut: "ctrl+s" }, enabled: true },
      { id: "6", type: "random_pause", label: "Pausa de lectura", params: { minSeconds: 30, maxSeconds: 120 }, enabled: true },
      { id: "7", type: "browse_tabs", label: "Navegar portales internos", params: { urls: "https://example.com/rrhh,https://example.com/noticias,https://example.com/proyectos", interval: 15 }, enabled: true },
      { id: "8", type: "idle_break", label: "Descanso café", params: { seconds: 300 }, enabled: true },
    ],
  },
  {
    id: "es-variables",
    name: "📌 Variables y PowerShell",
    description: "Demo de variables dinámicas, encadenamiento y scripts PowerShell",
    lang: "es",
    config: { minDelay: 2, maxDelay: 5, loop: false, loopCount: 0, humanize: true },
    activities: [
      { id: "1", type: "set_variable", label: "Definir nombre de reporte", params: { name: "reporte", value: "informe_{{date}}_{{random_id}}" }, enabled: true },
      { id: "2", type: "set_variable", label: "Definir carpeta", params: { name: "carpeta", value: "C:\\Temp\\reportes" }, enabled: true },
      { id: "3", type: "run_powershell", label: "Crear carpeta", params: { script: "New-Item -ItemType Directory -Path '{{custom.carpeta}}' -Force | Out-Null; Write-Host 'Carpeta: {{custom.carpeta}}'" }, enabled: true },
      { id: "4", type: "run_powershell", label: "Obtener info del sistema", params: { script: "\"PC: $env:COMPUTERNAME | User: $env:USERNAME | $(Get-Date -Format 'HH:mm:ss')\"" }, enabled: true },
      { id: "5", type: "set_variable", label: "Guardar resultado anterior", params: { name: "info", value: "{{prev_result}}" }, enabled: true },
      { id: "6", type: "run_powershell", label: "Crear archivo con datos", params: { script: "\"Reporte: {{custom.reporte}}`nFecha: {{date}}`nInfo: {{custom.info}}\" | Set-Content '{{custom.carpeta}}\\{{custom.reporte}}.txt'; Write-Host 'Creado: {{custom.reporte}}.txt'" }, enabled: true },
      { id: "7", type: "open_file", label: "Abrir reporte generado", params: { path: "{{custom.carpeta}}\\{{custom.reporte}}.txt" }, enabled: true },
    ],
  },
  {
    id: "es-mouse-teclado",
    name: "🖱️ Mouse y teclado",
    description: "Actividad continua de mouse, clicks y escritura aleatoria",
    lang: "es",
    config: { minDelay: 3, maxDelay: 10, loop: true, loopCount: 0, humanize: true },
    activities: [
      { id: "1", type: "mouse_move", label: "Movimiento de mouse", params: { duration: 30 }, enabled: true },
      { id: "2", type: "mouse_click", label: "Click en zona central", params: { x: 960, y: 540, button: "left" }, enabled: true },
      { id: "3", type: "scroll_window", label: "Scroll abajo", params: { direction: "down", amount: 5 }, enabled: true },
      { id: "4", type: "random_pause", label: "Pausa breve", params: { minSeconds: 5, maxSeconds: 15 }, enabled: true },
      { id: "5", type: "scroll_window", label: "Scroll arriba", params: { direction: "up", amount: 3 }, enabled: true },
      { id: "6", type: "mouse_move", label: "Más movimiento", params: { duration: 20 }, enabled: true },
      { id: "7", type: "keyboard_shortcut", label: "Alt+Tab (cambiar ventana)", params: { shortcut: "alt+tab" }, enabled: true },
    ],
  },
  {
    id: "es-demo",
    name: "🎬 Demo de producto",
    description: "Abre apps, escribe texto, toma capturas — ideal para grabar un vídeo demo",
    lang: "es",
    config: { minDelay: 2, maxDelay: 4, loop: false, loopCount: 0, humanize: true },
    activities: [
      { id: "1", type: "open_app", label: "Abrir Notepad", params: { path: "C:\\Windows\\System32\\notepad.exe" }, enabled: true },
      { id: "2", type: "idle_break", label: "Esperar carga", params: { seconds: 2 }, enabled: true },
      { id: "3", type: "type_text", label: "Escribir contenido", params: { text: "Este es un ejemplo de automatización de escritorio.\nFecha: {{date}} | Hora: {{time}}\nGenerado por Desktop Automator." }, enabled: true },
      { id: "4", type: "keyboard_shortcut", label: "Seleccionar todo", params: { shortcut: "ctrl+a" }, enabled: true },
      { id: "5", type: "take_screenshot", label: "Captura de pantalla", params: { outputPath: "C:\\Temp\\demo" }, enabled: true },
      { id: "6", type: "open_browser", label: "Abrir web de ejemplo", params: { url: "https://github.com" }, enabled: true },
      { id: "7", type: "mouse_move", label: "Navegar la página", params: { duration: 10 }, enabled: true },
      { id: "8", type: "take_screenshot", label: "Segunda captura", params: { outputPath: "C:\\Temp\\demo" }, enabled: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ENGLISH
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: "en-office",
    name: "🏢 Office workday",
    description: "Typical workday: intranet browsing, spreadsheets, typing, breaks",
    lang: "en",
    config: { minDelay: 5, maxDelay: 20, loop: true, loopCount: 0, humanize: true },
    activities: [
      { id: "1", type: "open_browser", label: "Open corporate intranet", params: { url: "https://example.com/intranet" }, enabled: true },
      { id: "2", type: "mouse_move", label: "Browse page (scroll & mouse)", params: { duration: 25 }, enabled: true },
      { id: "3", type: "open_spreadsheet", label: "Open daily tracker", params: { path: "" }, enabled: true },
      { id: "4", type: "type_text", label: "Add daily note", params: { text: "Reviewed and updated records for {{date}}." }, enabled: true },
      { id: "5", type: "keyboard_shortcut", label: "Save document", params: { shortcut: "ctrl+s" }, enabled: true },
      { id: "6", type: "random_pause", label: "Reading pause", params: { minSeconds: 30, maxSeconds: 120 }, enabled: true },
      { id: "7", type: "browse_tabs", label: "Browse internal portals", params: { urls: "https://example.com/hr,https://example.com/news,https://example.com/projects", interval: 15 }, enabled: true },
      { id: "8", type: "idle_break", label: "Coffee break", params: { seconds: 300 }, enabled: true },
    ],
  },
  {
    id: "en-testing",
    name: "🧪 QA / UI Testing",
    description: "Automated UI interaction: clicks, typing, screenshots for QA workflows",
    lang: "en",
    config: { minDelay: 1, maxDelay: 3, loop: true, loopCount: 5, humanize: false },
    activities: [
      { id: "1", type: "open_browser", label: "Open app under test", params: { url: "https://example.com/app" }, enabled: true },
      { id: "2", type: "idle_break", label: "Wait for page load", params: { seconds: 3 }, enabled: true },
      { id: "3", type: "mouse_click", label: "Click login button", params: { x: 960, y: 400, button: "left" }, enabled: true },
      { id: "4", type: "type_text", label: "Type username", params: { text: "testuser@example.com" }, enabled: true },
      { id: "5", type: "keyboard_shortcut", label: "Tab to next field", params: { shortcut: "tab" }, enabled: true },
      { id: "6", type: "type_text", label: "Type password", params: { text: "TestPass123!" }, enabled: true },
      { id: "7", type: "keyboard_shortcut", label: "Submit form", params: { shortcut: "enter" }, enabled: true },
      { id: "8", type: "idle_break", label: "Wait for response", params: { seconds: 2 }, enabled: true },
      { id: "9", type: "take_screenshot", label: "Capture result", params: { outputPath: "C:\\Temp\\qa-screenshots" }, enabled: true },
    ],
  },
  {
    id: "en-kiosk",
    name: "📺 Kiosk / Display",
    description: "Rotate between URLs with scrolling — keeps a display screen active",
    lang: "en",
    config: { minDelay: 1, maxDelay: 2, loop: true, loopCount: 0, humanize: false },
    activities: [
      { id: "1", type: "browse_tabs", label: "Rotate dashboards", params: { urls: "https://example.com/status,https://example.com/dashboard,https://example.com/metrics", interval: 30 }, enabled: true },
      { id: "2", type: "scroll_window", label: "Scroll dashboard", params: { direction: "down", amount: 8 }, enabled: true },
      { id: "3", type: "random_pause", label: "Display time", params: { minSeconds: 20, maxSeconds: 40 }, enabled: true },
      { id: "4", type: "scroll_window", label: "Scroll back up", params: { direction: "up", amount: 8 }, enabled: true },
      { id: "5", type: "keyboard_shortcut", label: "Refresh page", params: { shortcut: "f5" }, enabled: true },
    ],
  },
  {
    id: "en-backup",
    name: "💾 File backup workflow",
    description: "Uses variables and PowerShell to create timestamped file backups",
    lang: "en",
    config: { minDelay: 1, maxDelay: 3, loop: false, loopCount: 0, humanize: false },
    activities: [
      { id: "1", type: "set_variable", label: "Set backup folder", params: { name: "backupDir", value: "C:\\Temp\\Backups\\{{date}}" }, enabled: true },
      { id: "2", type: "run_powershell", label: "Create backup folder", params: { script: "New-Item -ItemType Directory -Path '{{custom.backupDir}}' -Force | Out-Null; Write-Host 'Created: {{custom.backupDir}}'" }, enabled: true },
      { id: "3", type: "copy_file", label: "Backup important file", params: { source: "", dest: "{{custom.backupDir}}" }, enabled: true },
      { id: "4", type: "run_powershell", label: "Log backup status", params: { script: "\"[{{timestamp}}] Backup completed to {{custom.backupDir}}\" | Add-Content 'C:\\Temp\\Backups\\backup.log'; Write-Host 'Logged'" }, enabled: true },
      { id: "5", type: "run_powershell", label: "Show recent backups", params: { script: "Get-ChildItem 'C:\\Temp\\Backups' -Recurse -File | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object { $_.FullName }" }, enabled: true },
    ],
  },
];
