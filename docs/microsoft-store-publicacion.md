# Publicar y cobrar en Microsoft Store — Activity Simulator

## Resumen del proceso

```
1. Crear cuenta de desarrollador en Partner Center
2. Empaquetar la app como MSIX
3. Configurar pricing y trial en Partner Center
4. Subir el paquete y pasar certificación
5. Publicar y cobrar automáticamente
```

---

## 1. Crear cuenta de desarrollador en Microsoft Partner Center

### Registro

URL: https://partner.microsoft.com/dashboard/registration

| Tipo de cuenta | Coste único | Requisitos |
|---|---|---|
| Individual | $19 USD | Nombre real, dirección, tarjeta |
| Empresa | $99 USD | Razón social, DUNS number, verificación |

**Para vender apps de pago necesitas cuenta con capacidad de recibir pagos:**
- Configurar perfil de pago (cuenta bancaria o PayPal)
- Configurar perfil fiscal (formulario W-8BEN si estás fuera de USA, o equivalente fiscal de tu país)

### Pasos de registro
1. Ir a https://partner.microsoft.com
2. Iniciar sesión con cuenta Microsoft (o crear una)
3. Seleccionar "Registrarse como desarrollador de apps"
4. Pagar la cuota de registro
5. Completar perfil fiscal en **Payout and tax** → Tax profiles
6. Configurar cuenta de pago en **Payout and tax** → Payout profiles

---

## 2. Empaquetar la app como MSIX

Microsoft Store requiere formato **MSIX** (el sucesor de AppX). Tauri 2 no genera MSIX directamente, pero se puede convertir desde el instalador existente o crear el paquete manualmente.

### Opción A — Usar MSIX Packaging Tool (recomendado)

1. Descargar **MSIX Packaging Tool** desde la Microsoft Store (gratis)
2. Crear nuevo paquete:
   - Seleccionar el instalador NSIS existente (`Activity Simulator_0.1.0_x64-setup.exe`)
   - El tool captura la instalación y la convierte a MSIX
3. Firmar el paquete con un certificado

### Opción B — Crear MSIX manualmente con makeappx.exe

```powershell
# Instalar Windows SDK (incluye makeappx.exe y signtool.exe)
# Ruta típica: C:\Program Files (x86)\Windows Kits\10\bin\10.0.xxxxx.0\x64\

# Estructura necesaria:
# ActivitySimulator_msix/
#   ├── AppxManifest.xml
#   ├── Assets/
#   │   ├── Square150x150Logo.png  (150x150)
#   │   ├── Square44x44Logo.png    (44x44)
#   │   ├── StoreLogo.png          (50x50)
#   │   ├── Wide310x150Logo.png    (310x150)
#   │   └── SplashScreen.png       (620x300)
#   └── ActivitySimulator.exe      (el portable)

# Crear el paquete:
makeappx pack /d ActivitySimulator_msix /p ActivitySimulator.msix

# Firmar (necesitas certificado):
signtool sign /fd SHA256 /f MiCertificado.pfx /p password ActivitySimulator.msix
```

### AppxManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<Package
  xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
  xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
  xmlns:rescap="http://schemas.microsoft.com/appx/manifest/foundation/windows10/restrictedcapabilities"
  IgnorableNamespaces="uap rescap">

  <Identity
    Name="TuPublisher.ActivitySimulator"
    Publisher="CN=TU_PUBLISHER_ID"
    Version="1.0.0.0"
    ProcessorArchitecture="x64" />

  <Properties>
    <DisplayName>Activity Simulator</DisplayName>
    <PublisherDisplayName>Tu Nombre o Empresa</PublisherDisplayName>
    <Logo>Assets\StoreLogo.png</Logo>
  </Properties>

  <Dependencies>
    <TargetDeviceFamily Name="Windows.Desktop"
      MinVersion="10.0.17763.0"
      MaxVersionTested="10.0.22631.0" />
  </Dependencies>

  <Resources>
    <Resource Language="en-US" />
    <Resource Language="es-ES" />
  </Resources>

  <Applications>
    <Application Id="App"
      Executable="ActivitySimulator.exe"
      EntryPoint="Windows.FullTrustApplication">
      <uap:VisualElements
        DisplayName="Activity Simulator"
        Description="Simulate realistic human activity on Windows"
        BackgroundColor="#0f1117"
        Square150x150Logo="Assets\Square150x150Logo.png"
        Square44x44Logo="Assets\Square44x44Logo.png" />
    </Application>
  </Applications>

  <Capabilities>
    <rescap:Capability Name="runFullTrust" />
  </Capabilities>
</Package>
```

### Opción C — Tauri MSIX plugin (experimental)

Tauri tiene soporte parcial para generar MSIX. En `tauri.conf.json`:

```json
"bundle": {
  "targets": ["msi", "nsis", "appx"],
  "windows": {
    "certificateThumbprint": "TU_THUMBPRINT",
    "digestAlgorithm": "sha256"
  }
}
```

---

## 3. Assets visuales requeridos por la Store

| Asset | Tamaño | Obligatorio | Uso |
|---|---|---|---|
| Store Logo | 50×50 px | ✅ | Ícono en resultados de búsqueda |
| Square 44×44 | 44×44 px | ✅ | Lista de apps, taskbar |
| Square 150×150 | 150×150 px | ✅ | Tile en Start Menu |
| Wide 310×150 | 310×150 px | Recomendado | Tile wide |
| Square 71×71 | 71×71 px | Recomendado | Tile small |
| Screenshot 1 | 1366×768 min | ✅ (mín 1) | Página de la Store |
| Screenshot 2-9 | 1366×768 min | Recomendado | Galería |
| Hero image | 1920×1080 | Recomendado | Destacado |

**Generar desde tu robot_512.png:**

```powershell
# Usando el script de conversión que ya tienes:
# Solo necesitas redimensionar robot_512.png a cada tamaño
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile("robot_512.png")

$sizes = @(
    @{w=50;h=50;name="StoreLogo"},
    @{w=44;h=44;name="Square44x44Logo"},
    @{w=150;h=150;name="Square150x150Logo"},
    @{w=71;h=71;name="Square71x71Logo"},
    @{w=310;h=150;name="Wide310x150Logo"}
)
# ... resize and save each
```

---

## 4. Configurar precios y trial en Partner Center

### Modelo de monetización disponible en MS Store

| Modelo | Cómo funciona | Adecuado |
|---|---|---|
| **Pago único** | El usuario paga una vez, descarga para siempre | ✅ Ideal para Activity Simulator |
| **Trial + pago** | Gratis X días, luego paga o pierde acceso | ✅ Perfecto |
| **Suscripción** | Cobro mensual/anual recurrente | Posible |
| **Freemium (in-app)** | App gratis + compras dentro | Más complejo |

### Configurar Trial + Pago único (recomendado)

En **Partner Center → Pricing and availability**:

1. **Base price:** $29.99 (o equivalente en EUR/otra moneda)
2. **Free trial:** Seleccionar "Time-limited" → 14 días
3. **Markets:** Seleccionar todos los países donde quieres vender

Microsoft calcula automáticamente los precios equivalentes en cada país y maneja impuestos/IVA.

### Implementar la lógica de trial en el código

Microsoft Store gestiona el trial automáticamente. Tu app consulta la licencia via API:

```rust
// En Rust, puedes usar la Windows Store API via COM
// O más fácil, usar la API de JavaScript de Tauri en el frontend:
```

```typescript
// Frontend: verificar estado de licencia de la Store
// Usa la API de Windows.Services.Store

import { invoke } from "@tauri-apps/api/core";

// Comando Rust que verifica la licencia:
const licenseStatus = await invoke<string>("check_store_license");
// Returns: "full" | "trial" | "expired"
```

```rust
// src-tauri/src/commands/license.rs
use std::process::Command;

/// Checks the Windows Store license status for this app.
/// Uses PowerShell to query the Store license API.
#[tauri::command]
pub fn check_store_license() -> Result<String, String> {
    let script = r#"
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $null = [Windows.Services.Store.StoreContext,Windows.Services.Store,ContentType=WindowsRuntime]
        $context = [Windows.Services.Store.StoreContext]::GetDefault()

        # Get app license
        $task = $context.GetAppLicenseAsync()
        $license = $task.GetResults()

        if ($license.IsActive) {
            if ($license.IsTrial) {
                $expiry = $license.ExpirationDate
                $remaining = ($expiry - (Get-Date)).Days
                "trial:$remaining"
            } else {
                "full"
            }
        } else {
            "expired"
        }
    "#;

    let output = Command::new("powershell")
        .args(["-NonInteractive", "-NoProfile", "-Command", script])
        .output()
        .map_err(|e| format!("Error: {}", e))?;

    let result = String::from_utf8_lossy(&output.stdout).trim().to_string();

    if result.is_empty() {
        // If not installed from Store, assume full (dev mode)
        Ok("full".to_string())
    } else {
        Ok(result)
    }
}
```

### Comportamiento del trial de la Store

- Microsoft controla la instalación y desinstalación
- Después de 14 días, `IsTrial` sigue `true` pero `IsActive` se pone `false`
- Tu app muestra un mensaje: "Tu período de prueba ha terminado. Compra la versión completa."
- El botón "Comprar" abre directamente la página de la Store para completar la compra

---

## 5. Proceso de certificación

### Requisitos obligatorios

| Requisito | Detalle |
|---|---|
| No malware | Obvio — el exe no debe ser flaggeado |
| No crash al inicio | Debe abrir sin errores en Windows 10/11 limpio |
| Política de privacidad | URL pública con tu política |
| Descripción precisa | Lo que dice la app debe ser lo que hace |
| Screenshots reales | Deben ser de la app real, no mockups |
| Accesibilidad básica | Navegación por teclado funcional |
| Content rating | Completar cuestionario IARC (clasificación por edad) |
| WebView2 dependency | Declarar que requiere Edge WebView2 Runtime |

### Política de contenido — Posibles problemas

⚠️ **Punto crítico:** Microsoft puede rechazar apps que "faciliten el engaño laboral" o "evadan sistemas de monitorización". Para evitar esto:

**Estrategia de posicionamiento en la Store:**

En lugar de "simula actividad para parecer que trabajas", posicionar como:

> "Herramienta de automatización de escritorio para:
> - Pruebas de software y QA
> - Demos automatizadas y kioscos
> - Mantenimiento de sesiones activas en servidores
> - Automatización de flujos de trabajo repetitivos"

**Categoría recomendada:** Productivity > Utilities & Tools

### Tiempos de certificación

| Primera vez | Actualizaciones |
|---|---|
| 3-5 días hábiles | 1-3 días hábiles |

Si es rechazada, recibes feedback específico y puedes reenviar.

---

## 6. Comisiones de Microsoft

| Tipo de app | Comisión Microsoft | Tu parte |
|---|---|---|
| Apps y juegos (estándar) | 15% | 85% |
| Apps referidas por MS Store | 15% | 85% |
| Si tu app tiene un motor de commerce propio | 12% | 88% |

**Ejemplo:**
- Precio: $29.99
- Microsoft se lleva: $4.50
- Tú recibes: $25.49

Los pagos se realizan mensualmente, 30 días después de alcanzar el umbral mínimo ($50 USD).

---

## 7. Checklist paso a paso

### Preparación (Semana 1)

- [ ] Crear cuenta en Partner Center ($19 individual o $99 empresa)
- [ ] Configurar perfil fiscal (W-8BEN o equivalente)
- [ ] Configurar cuenta de pago (banco o PayPal)
- [ ] Generar assets visuales (logos, screenshots)
- [ ] Escribir política de privacidad y publicarla en una URL

### Empaquetado (Semana 2)

- [ ] Instalar MSIX Packaging Tool
- [ ] Convertir el instalador NSIS a formato MSIX
- [ ] Crear certificado de firma o usar el de Partner Center
- [ ] Firmar el paquete MSIX
- [ ] Probar instalación del MSIX en una máquina limpia

### Submission (Semana 2-3)

- [ ] Crear nueva app en Partner Center
- [ ] Rellenar sección "Properties":
  - Categoría: Productivity > Utilities & Tools
  - Clasificación IARC (age rating)
  - Declarar dependencia de WebView2
- [ ] Rellenar sección "Pricing and availability":
  - Precio base: $29.99
  - Trial: 14 días
  - Mercados: todos (o selección)
- [ ] Rellenar sección "Store listing" (en inglés y español):
  - Título, descripción, features
  - Screenshots (mínimo 1, recomendado 4+)
  - Palabras clave de búsqueda
- [ ] Subir el paquete MSIX
- [ ] Enviar a certificación

### Post-publicación

- [ ] Implementar `check_store_license()` para verificar trial/completa
- [ ] Agregar UI de "Trial expirado" → botón "Comprar en Store"
- [ ] Monitorear reviews y responder
- [ ] Configurar actualizaciones automáticas (subir nuevo MSIX, la Store actualiza automáticamente)

---

## 8. Datos de la listing (borrador)

### Título
```
Activity Simulator - Desktop Automation
```

### Descripción corta (Store search)
```
Automate realistic desktop activity: mouse movement, typing, app launching, and browser navigation.
```

### Descripción larga
```
Activity Simulator is a desktop automation tool that performs realistic human-like
activity on your Windows PC. Configure sequences of actions, set timing, and let
the app run in the background.

FEATURES:
• Natural mouse movement with bezier curves and random scrolling
• Human-like typing with variable speed and self-correction
• Open applications, documents, and spreadsheets on schedule
• Browser automation for intranet and web navigation
• PowerShell script execution
• Screenshot capture with timestamps
• Click at specific screen coordinates
• Saveable profiles for different workflows
• Light and dark theme
• System tray mode - runs silently in background

USE CASES:
• QA testing and software demos
• Kiosk and display automation
• Keeping remote desktop sessions alive
• Automated workflow sequences
• UI testing and screen recording preparation

BUILT WITH:
• Tauri 2.0 + Rust for performance and small size (~5 MB)
• React frontend with real-time activity log
• 100% local - no data leaves your machine
```

### Palabras clave (máximo 7)
```
automation, mouse, simulate, desktop, activity, productivity, testing
```

### Categoría
```
Productivity > Utilities & Tools
```

---

## 9. Alternativa: Publicar como "unpackaged" Win32

Desde 2022, Microsoft permite publicar apps Win32 (.exe / .msi) directamente en la Store sin necesidad de MSIX. Esto simplifica enormemente el proceso:

1. Sube tu `.exe` o `.msi` directamente
2. Microsoft lo envuelve en un contenedor para la Store
3. El usuario descarga e instala como siempre

**Cómo hacerlo:**
- En Partner Center, seleccionar "New submission" → "Unpackaged app"
- Subir `Activity Simulator_0.1.0_x64-setup.exe` (el NSIS)
- No necesitas MSIX, ni certificado propio, ni AppxManifest

**Limitaciones:**
- No puedes usar la Store license API directamente (necesitas tu propio trial system)
- Sin auto-update via Store
- Sin tile en Start Menu

**Ventaja:** Puedes tener la app publicada en la Store en días sin aprender MSIX.

---

## Resumen: camino más rápido

| Paso | Acción | Tiempo |
|---|---|---|
| 1 | Registrar Partner Center + pago/fiscal | 1 día |
| 2 | Preparar screenshots y assets | 1 día |
| 3 | Subir .exe como "unpackaged Win32" | 1 hora |
| 4 | Completar listing (título, descripción, precio) | 2 horas |
| 5 | Enviar a certificación | 3-5 días |
| **Total** | **App en la Store vendiendo** | **~1 semana** |
