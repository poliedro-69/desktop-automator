use std::process::Command;

/// Executes a PowerShell script and returns its output (stdout + stderr).
/// Runs in a hidden window, no user interaction needed.
#[tauri::command]
pub fn run_powershell(script: String) -> Result<String, String> {
    let output = Command::new("powershell")
        .args([
            "-NonInteractive",
            "-NoProfile",
            "-WindowStyle",
            "Hidden",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            &script,
        ])
        .output()
        .map_err(|e| format!("Error al ejecutar PowerShell: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if output.status.success() {
        if stdout.is_empty() {
            Ok("Script ejecutado (sin salida)".to_string())
        } else {
            // Return first 500 chars to avoid flooding the UI
            let trimmed = if stdout.len() > 500 {
                format!("{}...", &stdout[..500])
            } else {
                stdout
            };
            Ok(trimmed)
        }
    } else {
        Err(if stderr.is_empty() {
            format!("PowerShell terminó con código: {:?}", output.status.code())
        } else {
            stderr
        })
    }
}
