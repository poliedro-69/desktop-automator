# Protección contra distribución no autorizada — Desktop Automator

Dato	Ruta en el registro	Valor
Fecha de instalación (trial)	HKCU\Software\Classes\CLSID\{F4A2B8C1-3D5E-4A7F-9B1C-2E8D6F0A3C5B}\InProcServer	ts = fecha XOR-encoded en hex
Clave de licencia	HKCU\Software\Classes\CLSID\{F4A2B8C1-3D5E-4A7F-9B1C-2E8D6F0A3C5B}\License	d = clave XOR-encoded en hex
Machine ID (cache)	HKCU\Software\Classes\CLSID\{F4A2B8C1-3D5E-4A7F-9B1C-2E8D6F0A3C5B}\MID	v = hash SHA-256 (32 hex chars)

## Estrategia por capas

No existe protección 100% infalible contra piratería, pero la combinación de varias capas hace que el esfuerzo de crackear no valga la pena comparado con el precio del software.

```
Capa 1: Licencia por hardware (offline)          — Dificulta copiar el exe entre PCs
Capa 2: Validación online (servidor)             — Detecta uso simultáneo / claves robadas
Capa 3: Code signing (certificado)               — SmartScreen bloquea copias no firmadas
Capa 4: Ofuscación del binario                   — Dificulta reverse engineering
Capa 5: Fingerprinting de la instalación         — Detecta redistribución
```

---

## Capa 1: Licencia atada al hardware (Machine ID)

### Concepto

Cada licencia se vincula a un identificador único del PC. Si copian el exe a otro PC, no funciona.

### Implementación en Rust

```rust
// src-tauri/src/license.rs

use std::process::Command;
use sha2::{Sha256, Digest};

/// Genera un ID único basado en hardware del PC.
/// Combina: nombre del PC + serial del disco + UUID del BIOS
pub fn get_machine_id() -> String {
    let components = vec![
        get_wmi_value("Win32_ComputerSystemProduct", "UUID"),
        get_wmi_value("Win32_DiskDrive", "SerialNumber"),
        get_wmi_value("Win32_BaseBoard", "SerialNumber"),
        std::env::var("COMPUTERNAME").unwrap_or_default(),
    ];

    let combined = components.join("|");
    let mut hasher = Sha256::new();
    hasher.update(combined.as_bytes());
    let result = hasher.finalize();
    
    // Primeros 16 bytes como hex = 32 caracteres
    hex::encode(&result[..16])
}

fn get_wmi_value(class: &str, property: &str) -> String {
    let output = Command::new("powershell")
        .args([
            "-NoProfile", "-NonInteractive", "-Command",
            &format!("(Get-WmiObject {}).{}", class, property)
        ])
        .output()
        .unwrap_or_default();
    
    String::from_utf8_lossy(&output.stdout).trim().to_string()
}
```

### Formato de la clave de licencia

```
XXXXX-XXXXX-XXXXX-XXXXX-XXXXX  (25 chars, grupos de 5)
```

La clave es un HMAC del machine_id firmado con tu secreto:

```rust
use hmac::{Hmac, Mac};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

const LICENSE_SECRET: &[u8] = b"TU_SECRETO_MUY_LARGO_AQUI_2026";

pub fn generate_license_key(machine_id: &str) -> String {
    let mut mac = HmacSha256::new_from_slice(LICENSE_SECRET).unwrap();
    mac.update(machine_id.as_bytes());
    let result = mac.finalize();
    let bytes = result.into_bytes();
    
    // Tomar primeros 15 bytes, codificar en base32-like
    let encoded = base32_encode(&bytes[..15]);
    // Formatear en grupos de 5
    encoded.chars()
        .collect::<Vec<_>>()
        .chunks(5)
        .map(|c| c.iter().collect::<String>())
        .collect::<Vec<_>>()
        .join("-")
}

pub fn validate_license_key(key: &str, machine_id: &str) -> bool {
    let expected = generate_license_key(machine_id);
    let clean_key = key.replace("-", "").to_uppercase();
    let clean_expected = expected.replace("-", "").to_uppercase();
    clean_key == clean_expected
}
```

### Almacenamiento de la licencia

```rust
// Guardar en registro de Windows (difícil de encontrar/copiar)
use winreg::enums::*;
use winreg::RegKey;

const REG_PATH: &str = "Software\\Classes\\CLSID\\{A7B2C3D4-E5F6-7890-ABCD-EF1234567890}";

pub fn store_license(key: &str) {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (reg, _) = hkcu.create_subkey(REG_PATH).unwrap();
    reg.set_value("Data", &encrypt_value(key)).unwrap();
}

pub fn read_stored_license() -> Option<String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let reg = hkcu.open_subkey(REG_PATH).ok()?;
    let encrypted: String = reg.get_value("Data").ok()?;
    Some(decrypt_value(&encrypted))
}
```

---

## Capa 2: Validación online (servidor)

### Arquitectura

```
App → HTTPS POST /api/validate → Tu servidor
     { machine_id, license_key, app_version }
     
Servidor → Responde:
     { valid: true, expires: "2027-01-01", features: ["all"] }
     o
     { valid: false, reason: "license_revoked" }
```

### Backend mínimo (Node.js / Cloudflare Worker)

```javascript
// Endpoint: POST /api/validate
export async function handleValidation(req) {
    const { machine_id, license_key } = await req.json();
    
    // Buscar licencia en base de datos
    const license = await db.licenses.findByKey(license_key);
    
    if (!license) return { valid: false, reason: "invalid_key" };
    if (license.revoked) return { valid: false, reason: "revoked" };
    if (license.expires < Date.now()) return { valid: false, reason: "expired" };
    
    // Verificar que el machine_id coincide (o es la primera activación)
    if (!license.machine_id) {
        // Primera activación: vincular al hardware
        await db.licenses.update(license.id, { machine_id });
    } else if (license.machine_id !== machine_id) {
        // Intentando usar en otro PC
        return { valid: false, reason: "wrong_machine" };
    }
    
    return { valid: true, expires: license.expires };
}
```

### Comportamiento offline (grace period)

```rust
// Si no puede contactar al servidor:
// - Si la última validación fue hace < 7 días → permitir uso
// - Si fue hace 7-14 días → mostrar aviso
// - Si fue hace > 14 días → bloquear

pub fn check_grace_period() -> LicenseStatus {
    let last_check = read_last_validation_timestamp();
    let days_since = (now() - last_check).num_days();
    
    match days_since {
        0..=7 => LicenseStatus::Valid,
        8..=14 => LicenseStatus::Warning("Verificación pendiente"),
        _ => LicenseStatus::Expired,
    }
}
```

---

## Capa 3: Code signing (certificado digital)

### Por qué es esencial

- Windows SmartScreen **bloquea** ejecutables sin firmar
- Las copias piratas no pueden firmarse con tu certificado
- El usuario ve "Editor: Tu Empresa" en lugar de "Editor desconocido"
- Antivirus confían más en binarios firmados

### Opciones de certificado

| Tipo | Coste anual | Reputación SmartScreen |
|---|---|---|
| Standard Code Signing | €100-200 | Se construye gradualmente |
| EV Code Signing (USB token) | €300-500 | Inmediata (bypassa SmartScreen) |
| Azure Trusted Signing | ~€8/mes | Inmediata |

### Proceso de firmado

```powershell
# Con signtool.exe (incluido en Windows SDK)
signtool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 /f certificado.pfx /p password "DesktopAutomator.exe"

# Verificar firma
signtool verify /pa "DesktopAutomator.exe"
```

### Azure Trusted Signing (recomendado para indie)

Es la opción más asequible (~$8/mes) con reputación SmartScreen inmediata:

1. Crear cuenta en Azure
2. Activar "Trusted Signing" 
3. Verificar identidad (DNI/pasaporte + dominio)
4. Integrar en tu pipeline de build

---

## Capa 4: Ofuscación y anti-tampering

### Proteger el binario Rust

```toml
# Cargo.toml - ya tienes LTO y strip activados
[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"
strip = true          # Elimina símbolos de debug
```

### Protecciones adicionales

```rust
// Anti-debugger: detectar si se está ejecutando bajo un debugger
#[cfg(windows)]
pub fn is_debugger_present() -> bool {
    unsafe { winapi::um::debugapi::IsDebuggerPresent() != 0 }
}

// Verificación de integridad: checksum del propio exe
pub fn verify_binary_integrity() -> bool {
    let exe_path = std::env::current_exe().unwrap();
    let bytes = std::fs::read(&exe_path).unwrap();
    let hash = sha256(&bytes);
    // Comparar con hash esperado (embebido en tiempo de build)
    hash == EXPECTED_HASH
}

// Ofuscar strings sensibles en el binario
// En lugar de: const SECRET = "mi_secreto";
// Usar: const SECRET: [u8; 10] = [0x6d ^ 0xFF, 0x69 ^ 0xFF, ...];
// Y decodificar en runtime con XOR
```

### Herramientas de protección (terceros)

| Herramienta | Qué hace | Coste |
|---|---|---|
| Enigma Protector | Empaqueta exe + anti-debug + virtualización | €200 |
| Themida | Virtualización de código + anti-tampering | €300-500 |
| VMProtect | Similar a Themida, más agresivo | €300 |
| UPX | Compresión (no protección real, fácil de deshacer) | Gratis |

**Recomendación:** Para un producto de $29-79, Enigma Protector tiene buena relación calidad/precio.

---

## Capa 5: Fingerprinting y telemetría anti-piratería

### Fingerprint de la instalación

Cada instalación genera un token único que se envía al servidor periódicamente:

```rust
pub struct InstallFingerprint {
    machine_id: String,
    install_date: String,
    license_key: String,
    app_version: String,
    os_version: String,
    // Hash de componentes que no cambian fácilmente
    hardware_hash: String,
}
```

### Detección de redistribución

Si el servidor ve el mismo `license_key` con diferentes `machine_id`:

```javascript
// En tu servidor
if (license.activations.length > license.max_machines) {
    // Alguien compartió la clave
    await notifyAdmin(license);
    // Opción 1: Revocar la más antigua
    // Opción 2: Bloquear todas y contactar al comprador
    // Opción 3: Permitir con aviso (soft approach)
}
```

---

## Implementación por fases (recomendado)

### Fase 1 — Mínimo viable (1-2 días)

- [ ] Machine ID (hash de hardware)
- [ ] Validación de clave offline (HMAC)
- [ ] Pantalla de activación al primer arranque
- [ ] Guardar licencia en registro de Windows

**Protección:** ~70%. Alguien técnico puede parchear el check, pero el usuario promedio no.

### Fase 2 — Validación online (3-5 días)

- [ ] Endpoint de validación en servidor (Cloudflare Worker o similar)
- [ ] Grace period offline (7 días)
- [ ] Detección de uso en múltiples PCs
- [ ] Base de datos de licencias

**Protección:** ~85%. Requiere crackear el binario Y montar un servidor fake.

### Fase 3 — Protección avanzada (1 semana)

- [ ] Code signing (EV o Azure Trusted Signing)
- [ ] Anti-debugger checks
- [ ] Binary integrity verification
- [ ] Ofuscación de strings con la clave secreta
- [ ] Telemetría anti-piratería

**Protección:** ~95%. Solo un reverse engineer dedicado podría crackearlo.

---

## Modelo pragmático para un producto de $29-79

La realidad es que la piratería es inevitable en cualquier software. Lo importante es:

1. **Hacer que sea más fácil comprar que piratear** → Trial generoso, precio accesible, compra en 2 clicks
2. **Proteger contra piratería casual** → Machine ID + clave = suficiente para que el 95% de usuarios paguen
3. **No gastar más en protección que lo que pierdes** → Si vendes 100 copias/mes a $50, no inviertas $5000/mes en DRM

### Stack recomendado final

```
Machine ID (HWID) ─── gratuito, código propio
   +
Validación online ─── Cloudflare Worker ($5/mes) o Supabase (gratis)
   +
Azure Trusted Signing ─── ~$8/mes (reputación SmartScreen)
   +
LTO + strip (ya activo) ─── hace el binario difícil de leer
```

**Coste total: ~$13/mes** para protección del 85-90%.

---

## Alternativa: Servicios de licencias gestionados

Si no quieres implementar tu propio sistema:

| Servicio | Coste | Qué incluye |
|---|---|---|
| **Keygen.sh** | Desde $0 (25 licencias) | API REST, machine lock, trial, analytics |
| **Gumroad** | 10% por venta | Gestión completa de pagos + claves |
| **LemonSqueezy** | 5-8% | Pagos + licencias + IVA europeo |
| **Paddle** | 5-10% | Todo-en-uno para software |
| **Cryptlex** | $25/mes | Licencias offline, floating, trial |

**Recomendación para empezar:** Keygen.sh (plan gratis hasta 25 licencias) + LemonSqueezy (pagos). Sin servidor propio, sin mantener infraestructura.

---

## Qué NO hacer

| ❌ Mala práctica | Por qué |
|---|---|
| DRM agresivo que afecta al usuario legítimo | Genera reviews negativas y refunds |
| Llamar a casa cada vez que el usuario abre la app | Falla sin internet, se percibe como spyware |
| Bloquear instantáneamente si falla la verificación | El usuario puede tener un problema temporal de red |
| Ocultar que hay un sistema de licencias | Genera desconfianza |
| Usar el mismo secreto para todas las versiones | Un crack sirve para todas las copias |

## Qué SÍ hacer

| ✅ Buena práctica | Beneficio |
|---|---|
| Grace period generoso (7-14 días offline) | El usuario no se frustra |
| Mensaje claro cuando expira: "Compra aquí →" | Convierte piratas en compradores |
| Permitir mover licencia a otro PC (con proceso) | Flexibilidad real, menos soporte |
| Trial sin tarjeta de crédito | Reduce fricción al máximo |
| Precio justo para el mercado objetivo | La mejor protección contra piratería |
