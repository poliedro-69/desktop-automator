# Trial de 30 días + Pago con Stripe — Guía de implementación

## Arquitectura completa

```
┌──────────────────────────────────────────────────────────────────────────┐
│  FLUJO DEL USUARIO                                                       │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Descarga app → Primer arranque → Trial 30 días (sin tarjeta)           │
│       │                                                                  │
│       ▼                                                                  │
│  Día 1-30: App completa, barra con "X días restantes" + botón "Comprar" │
│       │                                                                  │
│       ▼                                                                  │
│  Día 31: App bloqueada → Pantalla "Trial expirado" + botón "Comprar"    │
│       │                                                                  │
│       ▼                                                                  │
│  Click "Comprar" → Abre Stripe Checkout en navegador                    │
│       │                                                                  │
│       ▼                                                                  │
│  Paga con tarjeta → Stripe webhook → Servidor genera clave de licencia  │
│       │                                                                  │
│       ▼                                                                  │
│  Email con clave → Usuario la pega en la app → Licencia activada ∞      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Parte 1: Trial de 30 días (en la app, Rust)

### 1.1 Registro de fecha de instalación

```rust
// src-tauri/src/license/mod.rs

use chrono::{Local, NaiveDate};
use winreg::enums::*;
use winreg::RegKey;

// Ruta ofuscada en el registro (parece un CLSID de sistema)
const REG_PATH: &str = r"Software\Classes\CLSID\{F4A2B8C1-3D5E-4A7F-9B1C-2E8D6F0A3C5B}\Config";

/// Obtiene o crea la fecha de primera ejecución.
/// Usa XOR con una clave fija para ofuscar el valor.
pub fn get_install_date() -> NaiveDate {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);

    match hkcu.open_subkey(REG_PATH) {
        Ok(key) => {
            let encoded: String = key.get_value("ts").unwrap_or_default();
            decode_date(&encoded).unwrap_or_else(|| {
                let today = Local::now().date_naive();
                store_install_date(today);
                today
            })
        }
        Err(_) => {
            let today = Local::now().date_naive();
            store_install_date(today);
            today
        }
    }
}

fn store_install_date(date: NaiveDate) {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (key, _) = hkcu.create_subkey(REG_PATH).unwrap();
    key.set_value("ts", &encode_date(date)).unwrap();
}

/// Días restantes de trial (0 o negativo = expirado)
pub fn trial_days_remaining() -> i64 {
    let install = get_install_date();
    let today = Local::now().date_naive();
    let elapsed = (today - install).num_days();
    30 - elapsed
}

/// Estado de la licencia
pub enum LicenseState {
    Trial { days_left: i64 },
    Licensed,
    Expired,
}

pub fn get_license_state() -> LicenseState {
    // Primero verificar si hay licencia válida
    if let Some(key) = read_stored_license() {
        let machine_id = get_machine_id();
        if validate_license_key(&key, &machine_id) {
            return LicenseState::Licensed;
        }
    }

    // Si no hay licencia, verificar trial
    let days = trial_days_remaining();
    if days > 0 {
        LicenseState::Trial { days_left: days }
    } else {
        LicenseState::Expired
    }
}

// ── Ofuscación simple de la fecha ──────────────────────────────────────
const XOR_KEY: u8 = 0x5A;

fn encode_date(date: NaiveDate) -> String {
    let s = date.format("%Y%m%d").to_string();
    let encoded: Vec<u8> = s.bytes().map(|b| b ^ XOR_KEY).collect();
    hex::encode(encoded)
}

fn decode_date(hex_str: &str) -> Option<NaiveDate> {
    let bytes = hex::decode(hex_str).ok()?;
    let decoded: Vec<u8> = bytes.iter().map(|b| b ^ XOR_KEY).collect();
    let s = String::from_utf8(decoded).ok()?;
    NaiveDate::parse_from_str(&s, "%Y%m%d").ok()
}
```

### 1.2 Comandos Tauri expuestos al frontend

```rust
// src-tauri/src/license/commands.rs

use super::{get_license_state, LicenseState, get_machine_id, validate_license_key, store_license};

#[tauri::command]
pub fn check_license() -> serde_json::Value {
    match get_license_state() {
        LicenseState::Trial { days_left } => serde_json::json!({
            "status": "trial",
            "daysLeft": days_left
        }),
        LicenseState::Licensed => serde_json::json!({
            "status": "licensed"
        }),
        LicenseState::Expired => serde_json::json!({
            "status": "expired"
        }),
    }
}

#[tauri::command]
pub fn activate_license(key: String) -> Result<String, String> {
    let machine_id = get_machine_id();
    if validate_license_key(&key, &machine_id) {
        store_license(&key);
        Ok("License activated successfully".to_string())
    } else {
        Err("Invalid license key for this machine".to_string())
    }
}

#[tauri::command]
pub fn get_machine_id_for_display() -> String {
    let id = get_machine_id();
    // Mostrar solo los primeros 8 chars para soporte
    format!("{}...", &id[..8])
}
```

### 1.3 Frontend: Barra de trial + Pantalla de activación

```tsx
// src/components/TrialBar.tsx
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";

interface LicenseInfo {
  status: "trial" | "licensed" | "expired";
  daysLeft?: number;
}

export function TrialBar() {
  const { t } = useTranslation();
  const [license, setLicense] = useState<LicenseInfo | null>(null);

  useEffect(() => {
    invoke<LicenseInfo>("check_license").then(setLicense);
  }, []);

  if (!license || license.status === "licensed") return null;

  if (license.status === "expired") {
    return <ExpiredOverlay />;
  }

  // Trial mode: show bar
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 12, padding: "6px 16px",
      background: "var(--accent-soft)",
      borderBottom: "1px solid var(--border)",
      fontSize: 13,
    }}>
      <span>
        ⏱️ {t("trial.daysLeft", { days: license.daysLeft })}
      </span>
      <button
        onClick={openPurchasePage}
        style={{
          background: "var(--accent)", color: "white", border: "none",
          borderRadius: 6, padding: "4px 12px", cursor: "pointer",
          fontWeight: 600, fontSize: 12,
        }}
      >
        {t("trial.buyNow")}
      </button>
    </div>
  );
}

function ExpiredOverlay() {
  const { t } = useTranslation();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [machineId, setMachineId] = useState("");

  useEffect(() => {
    invoke<string>("get_machine_id_for_display").then(setMachineId);
  }, []);

  const handleActivate = async () => {
    try {
      await invoke("activate_license", { key: key.trim() });
      window.location.reload();
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "var(--bg)", display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center", maxWidth: 420, padding: 40 }}>
        <img src="/robot.png" alt="" style={{ width: 64, height: 64, marginBottom: 16 }} />
        <h2 style={{ marginBottom: 8 }}>{t("trial.expired")}</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
          {t("trial.expiredText")}
        </p>

        <button
          onClick={openPurchasePage}
          style={{
            background: "var(--accent)", color: "white", border: "none",
            borderRadius: 8, padding: "12px 32px", cursor: "pointer",
            fontWeight: 700, fontSize: 15, marginBottom: 24,
          }}
        >
          {t("trial.purchase")} — $29
        </button>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20 }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
            {t("trial.haveKey")}
          </p>
          <input
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(""); }}
            placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
            style={{
              width: "100%", padding: "10px 14px", fontSize: 14,
              fontFamily: "monospace", textAlign: "center",
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 8, color: "var(--text)", marginBottom: 8,
            }}
          />
          {error && <p style={{ color: "var(--danger)", fontSize: 12 }}>{error}</p>}
          <button
            onClick={handleActivate}
            disabled={key.trim().length < 20}
            style={{
              background: "var(--surface2)", color: "var(--text)",
              border: "1px solid var(--border)", borderRadius: 8,
              padding: "8px 24px", cursor: "pointer", fontSize: 13,
            }}
          >
            {t("trial.activate")}
          </button>
          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 12 }}>
            Machine ID: {machineId}
          </p>
        </div>
      </div>
    </div>
  );
}

function openPurchasePage() {
  // Abre Stripe Checkout en el navegador
  import("@tauri-apps/api/core").then(({ invoke }) =>
    invoke("open_application", {
      path: "https://buy.stripe.com/TU_LINK_DE_CHECKOUT_AQUI"
    })
  );
}
```

---

## Parte 2: Stripe Checkout (pago)

### 2.1 Crear producto en Stripe Dashboard

1. Ir a https://dashboard.stripe.com/products
2. Click "Add product"
3. Nombre: `Desktop Automator — License`
4. Precio: $29.00 (one-time payment)
5. Guardar

### 2.2 Crear Checkout Link (sin servidor)

La forma más simple — un Payment Link de Stripe:

1. Ir a https://dashboard.stripe.com/payment-links
2. Click "Create payment link"
3. Seleccionar tu producto ($29)
4. En "After payment" → Redirect to: `https://tudominio.com/success?session_id={CHECKOUT_SESSION_ID}`
5. Copiar el link (formato: `https://buy.stripe.com/xxxxx`)
6. Usarlo en `openPurchasePage()` de arriba

### 2.3 Recoger el Machine ID del comprador

Para vincular la clave al hardware del comprador, añade un campo custom al checkout:

```
En Payment Link settings → "Custom fields":
  Label: "Machine ID (from the app)"
  Type: Text
  Required: Yes
```

El usuario copia el Machine ID de la pantalla de la app y lo pega en el checkout.

---

## Parte 3: Generación automática de claves (servidor)

### 3.1 Opción A — Cloudflare Worker (gratis hasta 100k requests/día)

```javascript
// worker.js — Cloudflare Worker
// Endpoint: POST /api/generate-license

const LICENSE_SECRET = "TU_SECRETO_MUY_LARGO_2026_CAMBIAR_ESTO";

export default {
  async fetch(request, env) {
    // Verificar que viene de Stripe (webhook)
    if (request.method === "POST" && new URL(request.url).pathname === "/webhook/stripe") {
      return handleStripeWebhook(request, env);
    }
    return new Response("Not found", { status: 404 });
  }
};

async function handleStripeWebhook(request, env) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  // Verificar firma del webhook (simplificado, usar stripe SDK en producción)
  // En producción: usar crypto.subtle para verificar HMAC

  const event = JSON.parse(body);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details.email;
    const machineId = session.custom_fields?.[0]?.text?.value || "";

    if (!machineId) {
      console.error("No machine ID provided");
      return new Response("OK", { status: 200 });
    }

    // Generar clave de licencia
    const licenseKey = await generateLicenseKey(machineId);

    // Guardar en KV store
    await env.LICENSES.put(licenseKey, JSON.stringify({
      email,
      machineId,
      createdAt: new Date().toISOString(),
      product: "desktop-automator",
    }));

    // Enviar email con la clave (via Resend, SendGrid, etc.)
    await sendLicenseEmail(email, licenseKey, env);

    return new Response("OK", { status: 200 });
  }

  return new Response("OK", { status: 200 });
}

async function generateLicenseKey(machineId) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(LICENSE_SECRET);
  const data = encoder.encode(machineId + "|desktop-automator");

  const key = await crypto.subtle.importKey(
    "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, data);
  const bytes = new Uint8Array(signature);

  // Convertir a formato de clave: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin I,O,0,1 para evitar confusión
  let result = "";
  for (let i = 0; i < 25; i++) {
    result += chars[bytes[i % bytes.length] % chars.length];
  }

  return result.match(/.{5}/g).join("-");
}

async function sendLicenseEmail(email, licenseKey, env) {
  // Ejemplo con Resend API
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Desktop Automator <license@desktopautomator.com>",
      to: email,
      subject: "Your Desktop Automator License Key",
      html: `
        <h2>Thank you for your purchase!</h2>
        <p>Your license key:</p>
        <pre style="font-size:18px;background:#f4f4f4;padding:16px;border-radius:8px;text-align:center;">
${licenseKey}
        </pre>
        <p>Open Desktop Automator and paste this key in the activation screen.</p>
        <p>If you need help, contact support@desktopautomator.com</p>
      `,
    }),
  });
}
```

### 3.2 Configurar Stripe Webhook

1. Ir a https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://tu-worker.tudominio.workers.dev/webhook/stripe`
4. Events: seleccionar `checkout.session.completed`
5. Copiar el "Signing secret" para verificar la firma

### 3.3 Opción B — Sin servidor (manual)

Si prefieres no montar servidor al principio:

1. Stripe te envía email cuando alguien paga
2. Ves el Machine ID en los custom fields del checkout
3. Generas la clave con un script local:

```python
# generate_key.py — Script local para generar claves
import hmac, hashlib

SECRET = b"TU_SECRETO_MUY_LARGO_2026"
CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

def generate_key(machine_id):
    data = f"{machine_id}|desktop-automator".encode()
    sig = hmac.new(SECRET, data, hashlib.sha256).digest()
    key = ""
    for i in range(25):
        key += CHARS[sig[i % len(sig)] % len(CHARS)]
    return "-".join([key[i:i+5] for i in range(0, 25, 5)])

# Uso:
machine_id = input("Machine ID del cliente: ")
print(f"\nClave: {generate_key(machine_id)}")
```

4. Envías la clave por email al cliente manualmente

---

## Parte 4: Flujo completo paso a paso

### Para el desarrollador (una vez):

1. **Stripe:** Crear producto + Payment Link
2. **Servidor:** Deploy del Cloudflare Worker (o usar modo manual)
3. **App:** Implementar módulo de licencia en Rust + UI de trial
4. **Email:** Configurar Resend/SendGrid para envío automático

### Para el usuario:

```
1. Descarga Desktop Automator (desde tu web o MS Store)
2. Ejecuta la app → Funciona 30 días gratis, barra dice "28 días restantes"
3. Al día 31 → Pantalla "Trial expirado" con Machine ID visible
4. Click "Comprar licencia — $29" → Se abre Stripe en el navegador
5. Pega su Machine ID en el campo del checkout
6. Paga con tarjeta/Apple Pay/Google Pay
7. Recibe email con clave: "ABCDE-FGHIJ-KLMNO-PQRST-UVWXY"
8. Pega la clave en la app → ¡Activada para siempre!
```

---

## Parte 5: Consideraciones importantes

### Qué pasa si el usuario cambia de PC

Opciones:
1. **Self-service:** Página web donde pone su email y recibe nueva clave para el nuevo Machine ID (limitar a 2-3 activaciones)
2. **Soporte manual:** Te escriben, verificas la compra en Stripe, generas nueva clave
3. **Deactivar + Reactivar:** Botón en la app que "desvincula" la licencia del PC actual (requiere online)

### Qué pasa si manipulan el reloj del sistema

```rust
// Protección: guardar timestamp de última ejecución
// Si el reloj retrocede significativamente, flag de manipulación

pub fn detect_clock_tampering() -> bool {
    let last_run = read_last_run_timestamp();
    let now = Local::now().date_naive();

    if now < last_run {
        // El reloj retrocedió → posible manipulación
        return true;
    }

    save_last_run_timestamp(now);
    false
}
```

### Precios y tasas de Stripe

| Concepto | Tasa |
|---|---|
| Comisión por transacción | 2.9% + $0.30 |
| Tu producto: $29 | |
| Stripe se lleva | $1.14 |
| Tú recibes | **$27.86** |
| Payout a tu cuenta | Cada semana automáticamente |

### Monedas

Stripe convierte automáticamente. Si el comprador está en Europa, puede pagar en EUR. Tú recibes en la moneda de tu cuenta.

---

## Parte 6: Dependencias Rust a añadir

```toml
# En Cargo.toml añadir:
[dependencies]
# ... (existentes)
winreg = "0.52"     # Registro de Windows
sha2 = "0.10"       # Hash SHA-256
hmac = "0.12"       # HMAC para generar/validar claves
hex = "0.4"         # Encoding hex
chrono = { version = "0.4", features = ["serde"] }  # Ya lo tienes
```

---

## Resumen: coste y tiempo

| Componente | Tiempo | Coste mensual |
|---|---|---|
| Trial 30 días en Rust | 1 día | €0 |
| UI de trial/activación (React) | 1 día | €0 |
| Stripe producto + Payment Link | 30 min | 2.9% + $0.30 por venta |
| Cloudflare Worker (generación de claves) | 2-3 horas | €0 (plan gratis) |
| Resend email (envío de claves) | 1 hora | €0 (3000 emails/mes gratis) |
| **Total** | **~3 días** | **~€0 fijo + comisión por venta** |

Sin servidor propio, sin base de datos compleja, sin suscripciones mensuales.
