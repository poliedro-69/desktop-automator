use std::process::Command;
use std::thread;
use std::time::Duration;
use rand::Rng;
use enigo::{Direction::Click, Enigo, Key, Keyboard, Mouse, Settings};

/// Opens multiple URLs in browser tabs and alternates between them.
/// Opens the first URL, then cycles through the rest using Ctrl+Tab with pauses.
#[tauri::command]
pub fn browse_multiple_tabs(urls: Vec<String>, interval_secs: u32) -> Result<String, String> {
    let mut rng = rand::thread_rng();

    if urls.is_empty() {
        return Err("No se proporcionaron URLs".to_string());
    }

    // Open all URLs (each opens in a new tab)
    for url in &urls {
        Command::new("cmd")
            .args(["/C", "start", "", url])
            .spawn()
            .map_err(|e| format!("Error al abrir URL '{}': {}", url, e))?;
        thread::sleep(Duration::from_millis(rng.gen_range(800..1500)));
    }

    // Wait for tabs to load
    thread::sleep(Duration::from_secs(2));

    // Cycle through tabs
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    let cycles = urls.len().max(2); // At least go through all tabs once

    for _ in 0..cycles {
        // Wait the configured interval (with some randomness)
        let wait = (interval_secs as u64) * 1000 + rng.gen_range(0..2000);
        thread::sleep(Duration::from_millis(wait));

        // Ctrl+Tab to switch to next tab
        enigo.key(Key::Control, enigo::Direction::Press).ok();
        thread::sleep(Duration::from_millis(rng.gen_range(30..60)));
        enigo.key(Key::Tab, Click).ok();
        thread::sleep(Duration::from_millis(rng.gen_range(30..60)));
        enigo.key(Key::Control, enigo::Direction::Release).ok();

        // Small scroll to simulate reading
        if rng.gen_bool(0.6) {
            thread::sleep(Duration::from_millis(rng.gen_range(500..1500)));
            enigo.scroll(rng.gen_range(2..6), enigo::Axis::Vertical).ok();
        }
    }

    Ok(format!("Navegación por {} pestañas completada", urls.len()))
}
