# Sistema de actualizaciones automáticas — Desktop Automator

## Opciones disponibles

| Método | Complejidad | Coste | Mejor para |
|---|---|---|---|
| **GitHub Releases + check manual** | Baja | €0 | MVP rápido |
| **tauri-plugin-updater** (recomendado) | Media | €0 | Producción |
| **Microsoft Store auto-update** | Ninguna (automático) | $19 registro | Si publicas en Store |
| **Sparkle/WinSparkle** | Media | €0 | Apps nativas legacy |

---

## Opción recomendada: tauri-plugin-updater

Tauri 2 incluye un plugin oficial de auto-update que:
- Descarga el nuevo .exe en background
- Muestra notificación al usuario
- Instala al reiniciar (o inmediatamente si el usuario acepta)
- Firma verificada (evita man-in-the-middle)
- Funciona con GitHub Releases, S3, o cualquier servidor estático

### Arquitectura

```
Tu repositorio (GitHub)
    │
    ├── Releases/
    │   ├── v1.0.0/
    │   │   └── Desktop.Automator_1.0.0_x64-setup.nsis.zip
    │   │   └── Desktop.Automator_1.0.0_x64-setup.nsis.zip.sig  (firma)
    │   └── latest.json  ← la app consulta este archivo
    │
    └── La app al arrancar:
        GET https://github.com/.../releases/latest/download/latest.json
        → Compara versión local vs remota
        → Si hay nueva versión: descarga, verifica firma, instala
```

---

## Implementación paso a paso

### 1. Instalar el plugin

```bash
# Rust
cargo add tauri-plugin-updater

# npm (frontend, opcional para UI custom)
npm install @tauri-apps/plugin-updater
```

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri-plugin-updater = "2"
```

### 2. Configurar en tauri.conf.json

```json
{
  "plugins": {
    "updater": {
      "pubkey": "TU_CLAVE_PUBLICA_AQUI",
      "endpoints": [
        "https://github.com/TU_USUARIO/desktop-automator/releases/latest/download/latest.json"
      ],
      "dialog": true
    }
  }
}
```

### 3. Generar par de claves de firma

```bash
npx tauri signer generate -w ~/.tauri/desktop-automator.key
```

Esto genera:
- `~/.tauri/desktop-automator.key` — clave privada (NO compartir, NO commitear)
- `~/.tauri/desktop-automator.key.pub` — clave pública (va en `tauri.conf.json`)

### 4. Compilar con firma

```bash
# Variable de entorno con la clave privada
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content ~/.tauri/desktop-automator.key
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""

# Build normal — genera .nsis.zip + .sig automáticamente
npx tauri build
```

Produce:
```
target/release/bundle/nsis/
  ├── Desktop Automator_1.0.0_x64-setup.exe
  ├── Desktop Automator_1.0.0_x64-setup.nsis.zip     ← paquete de update
  └── Desktop Automator_1.0.0_x64-setup.nsis.zip.sig ← firma
```

### 5. Crear latest.json

Formato que el updater espera:

```json
{
  "version": "1.1.0",
  "notes": "Bug fixes and new activities",
  "pub_date": "2026-07-10T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "CONTENIDO_DEL_ARCHIVO_.sig",
      "url": "https://github.com/TU_USUARIO/desktop-automator/releases/download/v1.1.0/Desktop.Automator_1.1.0_x64-setup.nsis.zip"
    }
  }
}
```

### 6. Registrar el plugin en Rust

```rust
// src-tauri/src/lib.rs
tauri::Builder::default()
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_shell::init())
    // ... rest
```

### 7. Frontend — Check manual o automático

```typescript
// src/hooks/useUpdater.ts
import { check } from "@tauri-apps/plugin-updater";
import { ask } from "@tauri-apps/plugin-dialog";

export async function checkForUpdates() {
  try {
    const update = await check();
    
    if (update?.available) {
      const yes = await ask(
        `Version ${update.version} available.\n\n${update.body}\n\nUpdate now?`,
        { title: "Update Available", kind: "info" }
      );
      
      if (yes) {
        // Download and install
        await update.downloadAndInstall();
        // Restart the app
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      }
    }
  } catch (e) {
    console.error("Update check failed:", e);
  }
}
```

### 8. Comprobar al arrancar (App.tsx)

```typescript
// En App.tsx, dentro de useEffect
useEffect(() => {
  // Check for updates 5 seconds after app loads
  const timer = setTimeout(() => {
    checkForUpdates();
  }, 5000);
  return () => clearTimeout(timer);
}, []);
```

---

## Workflow de publicar una actualización

```bash
# 1. Incrementar versión
# En tauri.conf.json: "version": "1.1.0"
# En package.json: "version": "1.1.0"

# 2. Compilar con firma
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content ~/.tauri/desktop-automator.key
npx tauri build

# 3. Crear release en GitHub
gh release create v1.1.0 \
  "target/release/bundle/nsis/Desktop Automator_1.1.0_x64-setup.nsis.zip" \
  "target/release/bundle/nsis/Desktop Automator_1.1.0_x64-setup.nsis.zip.sig" \
  --title "v1.1.0" \
  --notes "Bug fixes and improvements"

# 4. Subir latest.json actualizado
# (puede automatizarse con GitHub Actions)
```

---

## Alternativa sin GitHub: Servidor propio o S3

Si no quieres usar GitHub Releases:

```json
// tauri.conf.json
"endpoints": [
  "https://updates.desktopautomator.com/latest.json"
]
```

Sube `latest.json` + el `.nsis.zip` + `.sig` a:
- **Amazon S3** + CloudFront (~$0.01/mes para pocas descargas)
- **Cloudflare R2** (gratis hasta 10GB/mes de egress)
- **Tu propio hosting** (cualquier servidor que sirva archivos estáticos)

---

## Automatización con GitHub Actions

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ["v*"]

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: dtolnay/rust-toolchain@stable

      - run: npm install
      - run: npx tauri build
        env:
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            src-tauri/target/release/bundle/nsis/*.exe
            src-tauri/target/release/bundle/nsis/*.nsis.zip
            src-tauri/target/release/bundle/nsis/*.sig

      - name: Generate latest.json
        run: |
          # Script para generar y subir latest.json
          python scripts/generate_update_manifest.py
```

---

## Resumen: qué necesitas

| Paso | Acción | Tiempo |
|---|---|---|
| 1 | Generar claves de firma | 1 min |
| 2 | Añadir `tauri-plugin-updater` al proyecto | 10 min |
| 3 | Configurar endpoints en `tauri.conf.json` | 5 min |
| 4 | Añadir check de updates al arrancar | 15 min |
| 5 | Compilar primera release firmada | 5 min (ya lo haces) |
| 6 | Crear GitHub Release + `latest.json` | 10 min |
| **Total** | **Sistema de auto-update funcional** | **~45 min** |

**Coste: €0** (GitHub Releases es gratis para repos públicos y privados).

---

## Flujo del usuario final

```
1. El usuario abre Desktop Automator
2. 5 segundos después, la app hace GET a latest.json (silencioso)
3. Si hay versión nueva:
   → Diálogo: "Versión 1.1.0 disponible. ¿Actualizar ahora?"
   → Si acepta: descarga en background (~5 MB) → instala → reinicia
   → Si cancela: sigue usando la versión actual, pregunta de nuevo mañana
4. Si no hay versión nueva: no pasa nada, transparente
```
