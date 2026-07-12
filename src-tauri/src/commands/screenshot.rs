use chrono::Local;
use screenshots::Screen;
use std::path::PathBuf;

/// Takes a screenshot of all screens and saves them to output_path.
/// Files are named with a timestamp: screenshot_YYYYMMDD_HHMMSS.png
#[tauri::command]
pub fn take_screenshot(output_path: String) -> Result<String, String> {
    let screens = Screen::all().map_err(|e| format!("Error al enumerar pantallas: {}", e))?;

    if screens.is_empty() {
        return Err("No se encontraron pantallas".to_string());
    }

    let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let mut saved = Vec::new();

    // Ensure output directory exists
    std::fs::create_dir_all(&output_path)
        .map_err(|e| format!("No se pudo crear directorio '{}': {}", output_path, e))?;

    for (idx, screen) in screens.iter().enumerate() {
        let capture = screen
            .capture()
            .map_err(|e| format!("Error al capturar pantalla {}: {}", idx, e))?;

        let filename = format!("screenshot_{}_{}.png", timestamp, idx + 1);
        let path: PathBuf = [&output_path, &filename].iter().collect();

        capture
            .save(&path)
            .map_err(|e| format!("Error al guardar captura: {}", e))?;

        saved.push(path.to_string_lossy().to_string());
    }

    Ok(format!("Capturado: {}", saved.join(", ")))
}
