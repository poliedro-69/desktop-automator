# Informe: Comercialización de Activity Simulator con modelo Trial

## 1. Definición del modelo de negocio

**Opción recomendada: Freemium con trial temporal**

| Modelo | Descripción | Adecuado para |
|---|---|---|
| Trial por tiempo (14/30 días) | Funcionalidad completa, expira | Producto bien diferenciado |
| Freemium limitado | Gratis con límites, pago para más | Producto con valor claro en límites |
| Suscripción mensual | Acceso continuo por cuota | SaaS / actualizaciones frecuentes |
| Licencia perpetua + trial | Pago único con prueba gratis | Software de escritorio clásico |

Para Activity Simulator, lo más práctico es **licencia perpetua + trial de 14 días con funcionalidad completa**, ya que es software de escritorio Windows y el cliente objetivo (empresas con necesidad de simular actividad) toma decisiones de compra rápido.

---

## 2. Implementación técnica del trial en la app

### A. Sistema de licencias en Rust (backend Tauri)

Necesitarás un módulo de licencia en `src-tauri/src/license.rs`.

**Flujo recomendado:**

```
Primer arranque
     │
     ▼
Generar machine ID único (hash de hardware)
     │
     ▼
Guardar fecha de instalación cifrada en registro de Windows
     │
     ▼
En cada arranque: comprobar días transcurridos
     │
     ├── < 14 días → app completa
     ├── ≥ 14 días → modo bloqueado, pedir licencia
     └── Licencia válida → app completa siempre
```

**Machine ID** (para atar la licencia al hardware):

```rust
// En Cargo.toml añadir: machine-uid = "0.5"
use machine_uid;

pub fn get_machine_id() -> String {
    machine_uid::get().unwrap_or_else(|_| "unknown".to_string())
}
```

**Almacenamiento del trial en el registro de Windows:**

```rust
use winreg::enums::*;
use winreg::RegKey;
// winreg = "0.52" en Cargo.toml

pub fn get_or_create_install_date() -> chrono::NaiveDate {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let path = "Software\\ActivitySimulator";

    match hkcu.open_subkey(path) {
        Ok(key) => {
            // Leer fecha guardada (ofuscada, no en claro)
            let encoded: String = key.get_value("inst").unwrap_or_default();
            decode_date(&encoded)
        }
        Err(_) => {
            // Primera ejecución: guardar hoy
            let key = hkcu.create_subkey(path).unwrap().0;
            let today = chrono::Local::now().date_naive();
            key.set_value("inst", &encode_date(today)).unwrap();
            today
        }
    }
}

pub fn days_remaining() -> i64 {
    let install_date = get_or_create_install_date();
    let today = chrono::Local::now().date_naive();
    let elapsed = (today - install_date).num_days();
    14 - elapsed
}
```

**Validación de licencia por clave:**

```rust
// Licencia = HMAC-SHA256(machine_id + product_id, secret_key)
// truncado a grupos de 5: XXXXX-XXXXX-XXXXX-XXXXX
use hmac::{Hmac, Mac};
use sha2::Sha256;

pub fn validate_license_key(key: &str, machine_id: &str) -> bool {
    let normalized = key.replace("-", "").to_uppercase();
    let expected = generate_expected_key(machine_id);
    normalized == expected
}
```

> Las claves se generan en tu servidor o herramienta offline con el `machine_id` del cliente.

---

### B. UI del trial (pantalla de activación)

Añadir en el frontend una pantalla de trial/activación que aparece:
- Al arrancar si el trial expiró
- Desde menú "Activar licencia"

```
┌─────────────────────────────────────────┐
│  🤖 Activity Simulator                  │
│                                         │
│  Período de prueba: 8 días restantes    │
│  ████████░░░░░░░░  57%                  │
│                                         │
│  Introduce tu clave de licencia:        │
│  [ XXXXX-XXXXX-XXXXX-XXXXX ]            │
│                                         │
│  [Activar]  [Comprar licencia →]        │
│                                         │
│  [Continuar en modo trial (8 días)]     │
└─────────────────────────────────────────┘
```

---

## 3. Distribución del instalador

### Opciones para distribuir

**Opción A — Gumroad (más rápido para empezar)**
- Creas producto, subes el `.exe` o `.msi`
- Gestiona pagos (tarjeta, PayPal) y entrega automática del instalador
- Comisión: ~10% + procesador de pago
- Puedes añadir campo "machine ID" en el checkout y automatizar la generación de claves

**Opción B — Paddle / LemonSqueezy**
- Orientados a software, gestionan IVA europeo automáticamente
- API para generar claves de licencia automáticamente tras el pago
- Recomendado si vendes a empresas en Europa (obligatorio gestionar IVA)

**Opción C — Tu propio servidor + Stripe**
- Control total, más trabajo inicial
- Necesitas: web de ventas + endpoint que genere clave tras webhook de Stripe

### Formato del instalador

Tauri genera automáticamente:
- `.msi` — instalador Windows estándar (recomendado para empresas)
- `.exe` NSIS — instalador con wizard

```bash
npm run tauri build
# Salida en: src-tauri/target/release/bundle/
#   ├── msi/activity-simulator_0.1.0_x64_en-US.msi
#   └── nsis/activity-simulator_0.1.0_x64-setup.exe
```

---

## 4. Protección del binario

El trial basado solo en registro de Windows es bypasseable. Capas de protección recomendadas:

| Capa | Herramienta | Dificultad | Coste |
|---|---|---|---|
| Ofuscación de fecha | Propia (XOR + salt) | Baja | €0 |
| Validación online al arranque | Tu servidor / API | Media | Hosting |
| Code signing del .exe | Certificado EV (~€200-400/año) | Media | €200-400 |
| Empaquetado con protector | Enigma Protector, Themida | Alta | €200-500 |

**Mínimo viable:** ofuscación de fecha + validación online opcional + code signing.

El code signing es importante porque Windows Defender y SmartScreen bloquearán o avisarán sobre ejecutables sin firmar, lo que destruye conversiones del trial.

---

## 5. Estructura de precios sugerida

Dado que el cliente objetivo son empresas que necesitan simular actividad (trabajo remoto, pruebas de sistemas, etc.):

| Plan | Precio | Incluye |
|---|---|---|
| Trial | €0 / 14 días | Todo |
| Personal | €29 único | 1 PC, actualizaciones 1 año |
| Profesional | €79 único | 3 PCs, perfiles ilimitados, soporte |
| Empresa | €199 único | 10 PCs, licencia corporativa, factura |

> Precios en dólares si el mercado principal es anglosajón.

---

## 6. Aspectos legales

Puntos críticos a cubrir antes de vender:

**EULA (End User License Agreement)**
- Uso permitido: automatización legítima, pruebas, demos
- Uso prohibido: eludir sistemas de monitorización de empleados, fraude laboral
- Esto te protege de responsabilidad si alguien lo usa para engañar a su empresa

**Política de privacidad**
- El software no envía datos a servidores (excepto validación de licencia)
- Declarar explícitamente qué se almacena localmente

**Política de reembolso**
- Estándar en software: 30 días si el producto no funciona como se describe
- Plataformas como Gumroad o Paddle lo gestionan automáticamente

---

## 7. Hoja de ruta recomendada

```
Semana 1-2:  Implementar módulo de licencia en Rust
             + pantalla de activación en React

Semana 3:    Code signing del ejecutable
             + página de ventas mínima (Gumroad o web propia)

Semana 4:    EULA + política de privacidad
             + sistema de generación de claves (puede ser manual al inicio)

Mes 2:       Automatización: webhook pago → generar clave → email al cliente
             + página de marketing con capturas/video demo

Mes 3:       Portal de cliente (descargas, gestión de licencias)
             + soporte por email / Crisp chat
```

---

## Resumen ejecutivo

El camino más rápido al mercado:

1. **Implementar trial de 14 días** con clave de licencia en Rust (1-2 semanas de desarrollo)
2. **Firmar el ejecutable** — sin esto SmartScreen bloquea la instalación
3. **Vender en Gumroad o LemonSqueezy** — mínimo esfuerzo de infraestructura
4. **Precio entre €29-€79** para uso individual/profesional
5. **EULA claro** que limite responsabilidad por uso indebido
