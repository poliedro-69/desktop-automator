# Internacionalización (i18n) en Activity Simulator

## Stack recomendado

**`i18next` + `react-i18next`** — el estándar de facto en React. Ligero, bien mantenido, con soporte para plurales, interpolación, namespaces y detección automática de idioma.

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

---

## 1. Estructura de archivos

```
src/
└── i18n/
    ├── index.ts              ← configuración de i18next
    └── locales/
        ├── en/
        │   └── translation.json
        ├── es/
        │   └── translation.json
        ├── fr/
        │   └── translation.json
        └── de/
            └── translation.json
```

---

## 2. Configuración de i18next

```ts
// src/i18n/index.ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/translation.json";
import es from "./locales/es/translation.json";
import fr from "./locales/fr/translation.json";
import de from "./locales/de/translation.json";

i18n
  .use(LanguageDetector)      // detecta idioma del sistema / browser
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, es: { translation: es }, fr: { translation: fr }, de: { translation: de } },
    fallbackLng: "en",        // si el idioma no está disponible, usa inglés
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],   // primero preferencia guardada, luego SO
      caches: ["localStorage"],
    },
  });

export default i18n;
```

Importar en `main.tsx` antes de renderizar:

```tsx
// src/main.tsx
import "./i18n";   // ← antes del import de App
import App from "./App";
```

---

## 3. Archivo de traducciones

```json
// src/i18n/locales/en/translation.json
{
  "app": {
    "title": "Desktop Automator",
    "version": "v1.0"
  },
  "nav": {
    "save": "Save profile",
    "load": "Load profile",
    "settings": "Settings"
  },
  "activities": {
    "title": "Activities",
    "enabled_count": "{{enabled}} of {{total}} enabled",
    "empty": "No activities yet",
    "empty_hint": "Add activities using the button above",
    "add": "Add activity"
  },
  "activity_types": {
    "open_app": "Open application",
    "open_file": "Open document",
    "open_spreadsheet": "Open spreadsheet",
    "open_browser": "Open browser",
    "browse_intranet": "Browse intranet",
    "mouse_move": "Mouse activity",
    "type_text": "Simulate typing",
    "take_screenshot": "Take screenshot",
    "run_powershell": "Run PowerShell",
    "idle_break": "Idle break"
  },
  "params": {
    "path": "File / executable path",
    "url": "URL",
    "duration": "Duration (seconds)",
    "text": "Text to type",
    "output_path": "Output folder",
    "script": "PowerShell script",
    "seconds": "Break duration (seconds)",
    "activity_name": "Activity name"
  },
  "settings": {
    "title": "Simulation settings",
    "min_delay": "Min delay (s)",
    "max_delay": "Max delay (s)",
    "cycles": "Cycles (0=∞)",
    "loop": "Repeat in loop",
    "humanize": "Human micro-pauses"
  },
  "controls": {
    "start": "Start simulation",
    "stop": "Stop",
    "starting": "Starting..."
  },
  "status": {
    "running": "Running",
    "stopped": "Stopped",
    "current": "Current activity",
    "actions": "{{count}} actions",
    "cycle": "Cycle {{n}}"
  },
  "log": {
    "title": "Activity log",
    "clear": "Clear",
    "empty": "No activity yet. Start the simulation."
  },
  "simulation": {
    "started": "🚀 Simulation started",
    "stopped": "⏹ Simulation stopped",
    "completed": "⏹ Simulation completed",
    "no_activities": "No activities enabled",
    "cycle": "🔄 Cycle {{n}}",
    "waiting": "⏳ Waiting {{s}}s..."
  }
}
```

```json
// src/i18n/locales/es/translation.json
{
  "app": {
    "title": "Simulador de Actividad",
    "version": "v1.0"
  },
  "nav": {
    "save": "Guardar perfil",
    "load": "Cargar perfil",
    "settings": "Configuración"
  },
  "activities": {
    "title": "Actividades",
    "enabled_count": "{{enabled}} de {{total}} habilitadas",
    "empty": "Sin actividades",
    "empty_hint": "Añade actividades con el botón de arriba",
    "add": "Añadir actividad"
  },
  "activity_types": {
    "open_app": "Abrir aplicación",
    "open_file": "Abrir documento",
    "open_spreadsheet": "Abrir hoja de cálculo",
    "open_browser": "Abrir navegador",
    "browse_intranet": "Navegar por Intranet",
    "mouse_move": "Actividad de mouse",
    "type_text": "Simular escritura",
    "take_screenshot": "Captura de pantalla",
    "run_powershell": "Ejecutar PowerShell",
    "idle_break": "Pausa"
  },
  "params": {
    "path": "Ruta del archivo / ejecutable",
    "url": "URL",
    "duration": "Duración (segundos)",
    "text": "Texto a escribir",
    "output_path": "Carpeta de salida",
    "script": "Script PowerShell",
    "seconds": "Duración de la pausa (segundos)",
    "activity_name": "Nombre de la actividad"
  },
  "settings": {
    "title": "Configuración de simulación",
    "min_delay": "Delay mín (s)",
    "max_delay": "Delay máx (s)",
    "cycles": "Ciclos (0=∞)",
    "loop": "Repetir en bucle",
    "humanize": "Micro-pausas humanas"
  },
  "controls": {
    "start": "Iniciar simulación",
    "stop": "Detener",
    "starting": "Iniciando..."
  },
  "status": {
    "running": "En ejecución",
    "stopped": "Detenido",
    "current": "Actividad actual",
    "actions": "{{count}} acciones",
    "cycle": "Ciclo {{n}}"
  },
  "log": {
    "title": "Registro de actividad",
    "clear": "Limpiar",
    "empty": "Sin actividad aún. Inicia la simulación."
  },
  "simulation": {
    "started": "🚀 Simulación iniciada",
    "stopped": "⏹ Detención solicitada...",
    "completed": "⏹ Simulación completada",
    "no_activities": "No hay actividades habilitadas",
    "cycle": "🔄 Ciclo {{n}}",
    "waiting": "⏳ Esperando {{s}}s..."
  }
}
```

---

## 4. Uso en componentes React

```tsx
import { useTranslation } from "react-i18next";

export function StatusBar({ status }: Props) {
  const { t } = useTranslation();

  return (
    <div>
      <span>{status.running ? t("status.running") : t("status.stopped")}</span>
      <span>{t("status.actions", { count: status.totalActions })}</span>
      <span>{t("status.cycle", { n: status.completedCycles })}</span>
    </div>
  );
}
```

```tsx
// En AddActivityMenu.tsx — traducir los tipos de actividad
const { t } = useTranslation();

const label = t(`activity_types.${template.type}`);
```

---

## 5. Selector de idioma

Componente para cambiar idioma en tiempo real y persistirlo:

```tsx
// src/components/LanguageSelector.tsx
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      style={{ background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px" }}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.flag} {l.label}
        </option>
      ))}
    </select>
  );
}
```

Añadir en la barra superior de `App.tsx`:

```tsx
import { LanguageSelector } from "./components/LanguageSelector";

// Dentro de la top bar:
<LanguageSelector />
```

---

## 6. Detección automática de idioma del sistema

Con `i18next-browser-languagedetector`, Tauri/WebView detecta el idioma del sistema operativo Windows automáticamente via `navigator.language`. Si el usuario tiene Windows en español, la app arranca en español sin configuración.

El idioma elegido manualmente se guarda en `localStorage` y persiste entre reinicios.

---

## 7. Internacionalización del backend Rust

Los mensajes que vienen del backend (resultado de comandos) también se pueden traducir. Dos enfoques:

**Opción A — Códigos de resultado (recomendado):**
```rust
// El comando devuelve un código estructurado
#[derive(serde::Serialize)]
pub struct CommandResult {
    pub code: &'static str,   // "app_opened", "file_not_found", etc.
    pub detail: String,       // valor dinámico (ruta, URL...)
}
```
```tsx
// El frontend traduce el código
t(`results.${result.code}`, { detail: result.detail })
```

**Opción B — Mensajes directos en inglés:**
Los mensajes del backend siempre en inglés, el frontend los muestra tal cual en el log técnico (aceptable para un log de consola).

---

## 8. Checklist de implementación

- [ ] `npm install i18next react-i18next i18next-browser-languagedetector`
- [ ] Crear `src/i18n/index.ts` con la configuración
- [ ] Crear archivos `translation.json` para cada idioma
- [ ] Importar `./i18n` en `main.tsx`
- [ ] Reemplazar strings hardcodeados por `t("clave")` en todos los componentes
- [ ] Añadir `<LanguageSelector />` en la barra superior
- [ ] Probar con `i18n.changeLanguage("es")` / `"en"` / `"fr"` / `"de"`
- [ ] Añadir idiomas al `tauri.conf.json` si se necesita instalar en idiomas específicos

---

## Idiomas prioritarios por mercado

| Mercado | Idioma | Potencial |
|---|---|---|
| Global / Anglosajón | `en` | ⭐⭐⭐⭐⭐ |
| España / LATAM | `es` | ⭐⭐⭐⭐ |
| Alemania / DACH | `de` | ⭐⭐⭐ |
| Francia | `fr` | ⭐⭐⭐ |
| Brasil | `pt-BR` | ⭐⭐⭐ |
| Japón | `ja` | ⭐⭐ |
