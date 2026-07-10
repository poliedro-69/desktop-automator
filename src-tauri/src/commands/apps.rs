use std::process::Command;

/// Launches a Windows application by its executable path.
#[tauri::command]
pub fn open_application(path: String) -> Result<String, String> {
    Command::new("cmd")
        .args(["/C", "start", "", &path])
        .spawn()
        .map(|_| format!("Aplicación iniciada: {}", path))
        .map_err(|e| format!("Error al abrir aplicación '{}': {}", path, e))
}

/// Opens any file with its default Windows handler (ShellExecute via start).
/// Works for .docx, .xlsx, .pdf, .txt, etc.
#[tauri::command]
pub fn open_file(path: String) -> Result<String, String> {
    // Use `explorer` to open file with its associated program
    Command::new("cmd")
        .args(["/C", "start", "", &path])
        .spawn()
        .map(|_| format!("Archivo abierto: {}", path))
        .map_err(|e| format!("Error al abrir archivo '{}': {}", path, e))
}

/// Opens a URL in the default browser.
#[tauri::command]
pub fn open_url(url: String) -> Result<String, String> {
    Command::new("cmd")
        .args(["/C", "start", "", &url])
        .spawn()
        .map(|_| format!("URL abierta: {}", url))
        .map_err(|e| format!("Error al abrir URL '{}': {}", url, e))
}

/// Copies a file from source to destination.
/// Creates destination directory if it doesn't exist.
#[tauri::command]
pub fn copy_file(source: String, dest: String) -> Result<String, String> {
    // Ensure destination directory exists
    if let Some(parent) = std::path::Path::new(&dest).parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Error al crear directorio destino: {}", e))?;
    }

    std::fs::copy(&source, &dest)
        .map(|bytes| format!("Archivo copiado: {} → {} ({} bytes)", source, dest, bytes))
        .map_err(|e| format!("Error al copiar '{}' → '{}': {}", source, dest, e))
}

/// Opens the help file in the default browser.
/// Accepts a lang parameter ("en" or "es") to open the correct version.
#[tauri::command]
pub fn open_help(app_handle: tauri::AppHandle, lang: String) -> Result<String, String> {
    use tauri::Manager;

    let filename = if lang.starts_with("es") { "help.html" } else { "help-en.html" };

    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| format!("Error resolving resources: {}", e))?;

    let help_path = resource_path.join(filename);

    // If the resource file exists (production build), open it
    if help_path.exists() {
        Command::new("cmd")
            .args(["/C", "start", "", &help_path.to_string_lossy()])
            .spawn()
            .map_err(|e| format!("Error: {}", e))?;
        return Ok(format!("Help opened: {}", filename));
    }

    // Fallback: dev mode via localhost
    let url = format!("http://localhost:1420/{}", filename);
    Command::new("cmd")
        .args(["/C", "start", "", &url])
        .spawn()
        .map_err(|e| format!("Error: {}", e))?;

    Ok(format!("Help opened (dev): {}", filename))
}
