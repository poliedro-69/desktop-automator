// ═══════════════════════════════════════════════════════════════════════════════
// Stripe keys: loaded from stripe.key file next to the exe (not in git)
// Create the file manually: put your sk_live_... key in it
// ═══════════════════════════════════════════════════════════════════════════════

fn get_stripe_secret_key() -> String {
    // Try reading from stripe.key file next to the executable (bundled as resource)
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            // Check next to exe (NSIS install or portable)
            let key_file = dir.join("stripe.key");
            if let Ok(key) = std::fs::read_to_string(&key_file) {
                let trimmed = key.trim().to_string();
                if !trimmed.is_empty() {
                    return trimmed;
                }
            }
            // Check in resources subfolder (MSI install)
            let res_file = dir.join("resources").join("stripe.key");
            if let Ok(key) = std::fs::read_to_string(&res_file) {
                let trimmed = key.trim().to_string();
                if !trimmed.is_empty() {
                    return trimmed;
                }
            }
        }
    }
    // Fallback: environment variable
    std::env::var("STRIPE_SECRET_KEY").unwrap_or_default()
}

const STRIPE_PRICE_ID: &str = "price_1TsGVnL8zmBQ5Z9q1LKl6VrR";

// ═══════════════════════════════════════════════════════════════════════════════
// Create Stripe Checkout Session
// ═══════════════════════════════════════════════════════════════════════════════

/// Creates a Stripe Checkout Session and returns the URL for the user to pay.
/// Embeds the machine_id in metadata so we can verify payment belongs to this machine.
#[tauri::command]
pub fn create_checkout_session(machine_id: String) -> Result<String, String> {
    let client = reqwest::blocking::Client::new();

    let params = [
        ("mode", "payment"),
        ("line_items[0][price]", STRIPE_PRICE_ID),
        ("line_items[0][quantity]", "1"),
        ("metadata[machine_id]", &machine_id),
        ("metadata[product]", "desktop-automator"),
        ("success_url", "https://desktopautomator.com/thankyou"),
        ("cancel_url", "https://desktopautomator.com/cancel"),
    ];

    let resp = client
        .post("https://api.stripe.com/v1/checkout/sessions")
        .header("Authorization", format!("Bearer {}", get_stripe_secret_key()))
        .form(&params)
        .send()
        .map_err(|e| format!("Network error: {}", e))?;

    let status = resp.status();
    let body: serde_json::Value = resp
        .json()
        .map_err(|e| format!("Parse error: {}", e))?;

    if !status.is_success() {
        let msg = body["error"]["message"]
            .as_str()
            .unwrap_or("Unknown Stripe error");
        return Err(format!("Stripe error: {}", msg));
    }

    // Return the checkout session ID and URL
    let url = body["url"]
        .as_str()
        .ok_or("No URL in Stripe response")?
        .to_string();
    let session_id = body["id"]
        .as_str()
        .ok_or("No session ID")?
        .to_string();

    Ok(serde_json::json!({
        "url": url,
        "sessionId": session_id
    }).to_string())
}

// ═══════════════════════════════════════════════════════════════════════════════
// Check if a Checkout Session has been paid
// ═══════════════════════════════════════════════════════════════════════════════

/// Polls Stripe to check if the checkout session has been paid.
/// Returns: "paid", "unpaid", "expired", or "error:message"
#[tauri::command]
pub fn check_payment_status(session_id: String) -> Result<String, String> {
    let client = reqwest::blocking::Client::new();

    let url = format!("https://api.stripe.com/v1/checkout/sessions/{}", session_id);

    let resp = client
        .get(&url)
        .header("Authorization", format!("Bearer {}", get_stripe_secret_key()))
        .send()
        .map_err(|e| format!("Network error: {}", e))?;

    let status = resp.status();
    let body: serde_json::Value = resp
        .json()
        .map_err(|e| format!("Parse error: {}", e))?;

    if !status.is_success() {
        let msg = body["error"]["message"]
            .as_str()
            .unwrap_or("Unknown error");
        return Err(format!("Stripe error: {}", msg));
    }

    let payment_status = body["payment_status"]
        .as_str()
        .unwrap_or("unknown");

    Ok(payment_status.to_string())
}
