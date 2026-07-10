use chrono::{Local, NaiveDate};
use std::process::Command;

// ═══════════════════════════════════════════════════════════════════════════════
// Machine ID — Hardware fingerprint
// ═══════════════════════════════════════════════════════════════════════════════

pub fn get_machine_id() -> String {
    // Check cache first (registry)
    use winreg::enums::*;
    use winreg::RegKey;
    const CACHE_PATH: &str = r"Software\Classes\CLSID\{F4A2B8C1-3D5E-4A7F-9B1C-2E8D6F0A3C5B}\MID";

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok(key) = hkcu.open_subkey(CACHE_PATH) {
        if let Ok(cached) = key.get_value::<String, _>("v") {
            if cached.len() == 32 {
                return cached;
            }
        }
    }

    // Generate fresh
    let script = r#"
        $uuid = (Get-WmiObject Win32_ComputerSystemProduct).UUID
        $disk = (Get-WmiObject Win32_DiskDrive | Select-Object -First 1).SerialNumber
        $board = (Get-WmiObject Win32_BaseBoard).SerialNumber
        "$uuid|$disk|$board"
    "#;

    let output = Command::new("powershell")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
        .output();

    let raw = match output {
        Ok(o) => String::from_utf8_lossy(&o.stdout).trim().to_string(),
        Err(_) => String::new(),
    };

    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(raw.as_bytes());
    let result = hasher.finalize();
    let id = hex::encode(&result[..16]);

    // Cache it
    if let Ok((key, _)) = hkcu.create_subkey(CACHE_PATH) {
        let _ = key.set_value("v", &id);
    }

    id
}

// ═══════════════════════════════════════════════════════════════════════════════
// License key generation / validation (HMAC-SHA256)
// ═══════════════════════════════════════════════════════════════════════════════

// IMPORTANT: Change this secret before distributing!
const LICENSE_SECRET: &[u8] = b"DesktopAutomator2026SecretKey!ChangeThis!";
const KEY_CHARS: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

pub fn generate_license_key(machine_id: &str) -> String {
    use hmac::{Hmac, Mac};
    use sha2::Sha256;

    type HmacSha256 = Hmac<Sha256>;

    let mut mac = HmacSha256::new_from_slice(LICENSE_SECRET).unwrap();
    mac.update(format!("{}|desktop-automator", machine_id).as_bytes());
    let result = mac.finalize().into_bytes();

    let mut key = String::with_capacity(29);
    for i in 0..25 {
        let idx = result[i % result.len()] as usize % KEY_CHARS.len();
        key.push(KEY_CHARS[idx] as char);
        if (i + 1) % 5 == 0 && i < 24 {
            key.push('-');
        }
    }
    key
}

pub fn validate_license_key(key: &str, machine_id: &str) -> bool {
    let expected = generate_license_key(machine_id);
    let clean_key = key.replace("-", "").to_uppercase();
    let clean_expected = expected.replace("-", "").to_uppercase();
    clean_key == clean_expected
}

// ═══════════════════════════════════════════════════════════════════════════════
// Trial management — Windows Registry
// ═══════════════════════════════════════════════════════════════════════════════

const REG_PATH: &str = r"Software\Classes\CLSID\{F4A2B8C1-3D5E-4A7F-9B1C-2E8D6F0A3C5B}\InProcServer";
const XOR_KEY: u8 = 0x5A;
const TRIAL_DAYS: i64 = 30;

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

pub fn get_install_date() -> NaiveDate {
    use winreg::enums::*;
    use winreg::RegKey;

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
    use winreg::enums::*;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok((key, _)) = hkcu.create_subkey(REG_PATH) {
        let _ = key.set_value("ts", &encode_date(date));
    }
}

pub fn trial_days_remaining() -> i64 {
    let install = get_install_date();
    let today = Local::now().date_naive();
    let elapsed = (today - install).num_days();
    TRIAL_DAYS - elapsed
}

// ═══════════════════════════════════════════════════════════════════════════════
// License storage
// ═══════════════════════════════════════════════════════════════════════════════

const LICENSE_REG_PATH: &str = r"Software\Classes\CLSID\{F4A2B8C1-3D5E-4A7F-9B1C-2E8D6F0A3C5B}\License";

pub fn store_license(key: &str) {
    use winreg::enums::*;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    if let Ok((reg, _)) = hkcu.create_subkey(LICENSE_REG_PATH) {
        // XOR encode the key before storing
        let encoded: String = key.bytes().map(|b| format!("{:02x}", b ^ XOR_KEY)).collect();
        let _ = reg.set_value("d", &encoded);
    }
}

pub fn read_stored_license() -> Option<String> {
    use winreg::enums::*;
    use winreg::RegKey;

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let reg = hkcu.open_subkey(LICENSE_REG_PATH).ok()?;
    let encoded: String = reg.get_value("d").ok()?;
    let bytes = hex::decode(&encoded).ok()?;
    let decoded: Vec<u8> = bytes.iter().map(|b| b ^ XOR_KEY).collect();
    String::from_utf8(decoded).ok()
}

// ═══════════════════════════════════════════════════════════════════════════════
// License state (what the frontend uses)
// ═══════════════════════════════════════════════════════════════════════════════

#[derive(serde::Serialize)]
pub struct LicenseStatus {
    pub status: String,       // "trial", "licensed", "expired"
    pub days_left: i64,       // only relevant for trial
    pub machine_id: String,   // for display / purchase
}

pub fn get_license_status() -> LicenseStatus {
    let machine_id = get_machine_id();

    // Check stored license
    if let Some(key) = read_stored_license() {
        if validate_license_key(&key, &machine_id) {
            return LicenseStatus {
                status: "licensed".to_string(),
                days_left: 0,
                machine_id: machine_id[..8].to_string(),
            };
        }
    }

    // Check trial
    let days = trial_days_remaining();
    if days > 0 {
        LicenseStatus {
            status: "trial".to_string(),
            days_left: days,
            machine_id: machine_id[..8].to_string(),
        }
    } else {
        LicenseStatus {
            status: "expired".to_string(),
            days_left: 0,
            machine_id: machine_id[..8].to_string(),
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tauri commands
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub fn check_license() -> LicenseStatus {
    get_license_status()
}

#[tauri::command]
pub fn activate_license(key: String) -> Result<String, String> {
    let machine_id = get_machine_id();
    if validate_license_key(&key.trim(), &machine_id) {
        store_license(key.trim());
        Ok("License activated".to_string())
    } else {
        Err("Invalid license key for this machine".to_string())
    }
}

#[tauri::command]
pub fn get_full_machine_id() -> String {
    get_machine_id()
}

/// Generates and stores a license key for the given machine ID.
/// Called after payment is confirmed via Stripe polling.
#[tauri::command]
pub fn generate_license_from_payment(machine_id: String) -> Result<String, String> {
    let key = generate_license_key(&machine_id);
    store_license(&key);
    Ok(key)
}
