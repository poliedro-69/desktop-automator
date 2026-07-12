# 🤖 Desktop Automator

Herramienta de automatización de escritorio para Windows construida con **Tauri 2.0 + React + Rust**. Ejecuta secuencias de acciones automatizadas: abrir aplicaciones, navegar por URLs, mover mouse, escribir texto y más.

## Características

| Actividad | Descripción |
|-----------|-------------|
| 🖥️ Abrir aplicación | Lanza cualquier `.exe` por ruta |
| 📄 Abrir documento | Abre archivos Word, PDF, etc. con su app predeterminada |
| 📊 Hoja de cálculo | Abre archivos Excel con la app registrada |
| 🌐 Abrir navegador | Navega a cualquier URL en el browser predeterminado |
| 🏢 Intranet | Accede a URLs internas de red corporativa |
| 🖱️ Mover mouse | Mueve el cursor con trayectorias naturales (ease in/out) + clics y scroll |
| ⌨️ Escribir texto | Escritura automática con velocidad variable y correcciones naturales |
| 📸 Captura pantalla | Guarda screenshots con timestamp en una carpeta configurable |
| ⚡ PowerShell | Ejecuta scripts de PowerShell en segundo plano |
| ⏸️ Pausa | Tiempo de inactividad configurable entre acciones |

## Requisitos

- **Node.js** 20+
- **Rust** 1.77+ (`rustup update stable`)
- **Visual Studio Build Tools** (C++ workload)
- **WebView2** (incluido en Windows 11, instalar en Windows 10 si hace falta)

## Instalación

```bash
npm install
npx tauri dev        # modo desarrollo
npx tauri build      # compilar instalador
```

## Estructura

```
movimientosim/
├── src/                    # Frontend React + TypeScript
│   ├── App.tsx             # UI principal
│   ├── components/         # Componentes reutilizables
│   └── hooks/              # useSimulation (lógica de automatización)
└── src-tauri/              # Backend Rust
    └── src/
        └── commands/
            ├── apps.rs     # Abrir apps / archivos / URLs
            ├── mouse.rs    # Automatización de mouse y teclado
            ├── powershell.rs # Ejecución de scripts
            └── screenshot.rs # Captura de pantalla
```

## Configuración de automatización

- **Delay mín/máx**: Tiempo de espera entre actividades (segundos)
- **Bucle**: Repite el ciclo de actividades N veces (0 = infinito)
- **Micro-pausas humanas**: Agrega pequeños delays aleatorios después de cada acción
- **Perfiles**: Guarda/carga configuraciones como archivos `.json`

## Perfiles de ejemplo

Puedes guardar y cargar perfiles desde el botón 💾 en la barra superior.
El perfil incluye todas las actividades configuradas y los parámetros globales.
