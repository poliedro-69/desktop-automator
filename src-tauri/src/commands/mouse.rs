use enigo::{
    Direction::{Click, Press, Release},
    Enigo, Key, Keyboard, Mouse, Settings,
};
use rand::Rng;
use std::thread;
use std::time::Duration;

/// Simulates natural human mouse movement (random bezier-like paths) for `duration_secs` seconds.
/// Also scrolls, clicks on random positions, and presses modifier keys occasionally.
#[tauri::command]
pub fn simulate_mouse_activity(duration_secs: u32) -> Result<String, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    let mut rng = rand::thread_rng();

    let end = std::time::Instant::now() + Duration::from_secs(duration_secs as u64);

    // Get approximate screen bounds (assume 1920x1080 safe area)
    let max_x = 1800_i32;
    let max_y = 1000_i32;

    let mut current_x = rng.gen_range(100..max_x);
    let mut current_y = rng.gen_range(100..max_y);

    while std::time::Instant::now() < end {
        let target_x = rng.gen_range(100..max_x);
        let target_y = rng.gen_range(100..max_y);

        // Move in small steps to simulate human movement
        let steps = rng.gen_range(15..40);
        for step in 0..=steps {
            if std::time::Instant::now() >= end {
                break;
            }
            let t = step as f64 / steps as f64;
            // Ease in-out cubic
            let ease = if t < 0.5 {
                4.0 * t * t * t
            } else {
                1.0 - (-2.0 * t + 2.0).powi(3) / 2.0
            };

            let x = current_x as f64 + (target_x - current_x) as f64 * ease;
            let y = current_y as f64 + (target_y - current_y) as f64 * ease;

            // Small random jitter to look human
            let jitter_x = rng.gen_range(-2..=2);
            let jitter_y = rng.gen_range(-2..=2);

            enigo
                .move_mouse(
                    (x as i32 + jitter_x).clamp(0, max_x),
                    (y as i32 + jitter_y).clamp(0, max_y),
                    enigo::Coordinate::Abs,
                )
                .ok();

            thread::sleep(Duration::from_millis(rng.gen_range(8..25)));
        }

        current_x = target_x;
        current_y = target_y;

        // Occasionally: click, scroll, or pause
        let action = rng.gen_range(0..10);
        match action {
            0 => {
                // Left click
                enigo.button(enigo::Button::Left, Click).ok();
                thread::sleep(Duration::from_millis(150));
            }
            1 => {
                // Scroll down
                enigo.scroll(rng.gen_range(2..6), enigo::Axis::Vertical).ok();
                thread::sleep(Duration::from_millis(200));
            }
            2 => {
                // Scroll up
                enigo
                    .scroll(-rng.gen_range(1..4), enigo::Axis::Vertical)
                    .ok();
                thread::sleep(Duration::from_millis(200));
            }
            _ => {}
        }

        // Random pause between movements (200ms - 1.5s)
        thread::sleep(Duration::from_millis(rng.gen_range(200..1500)));
    }

    Ok(format!("Actividad de mouse completada ({} segundos)", duration_secs))
}

/// Simulates human typing with variable speed and occasional corrections.
#[tauri::command]
pub fn simulate_typing(text: String) -> Result<String, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    let mut rng = rand::thread_rng();

    let chars: Vec<char> = text.chars().collect();
    let total = chars.len();

    for (i, ch) in chars.iter().enumerate() {
        // Occasionally simulate a typo and correction
        if rng.gen_bool(0.03) && i < total - 1 {
            // Type wrong character
            let wrong = (b'a' + rng.gen_range(0..26)) as char;
            enigo.text(&wrong.to_string()).ok();
            thread::sleep(Duration::from_millis(rng.gen_range(80..200)));

            // Backspace to delete
            enigo.key(Key::Backspace, Click).ok();
            thread::sleep(Duration::from_millis(rng.gen_range(100..300)));
        }

        // Type the actual character
        enigo.text(&ch.to_string()).ok();

        // Variable typing speed (40-120 WPM range ≈ 100-500ms per char)
        let delay = if rng.gen_bool(0.1) {
            // Occasional longer pause (thinking)
            rng.gen_range(500..1200)
        } else {
            rng.gen_range(60..180)
        };
        thread::sleep(Duration::from_millis(delay));
    }

    Ok(format!("Texto escrito: {} caracteres", total))
}

/// Moves the mouse to (x, y) and performs a click (left, right, or middle).
/// Movement is done in small steps to appear natural.
#[tauri::command]
pub fn simulate_mouse_click(x: i32, y: i32, button: String) -> Result<String, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    let mut rng = rand::thread_rng();

    // Get approximate current position (we'll move from a random nearby spot)
    let start_x = x + rng.gen_range(-80..80);
    let start_y = y + rng.gen_range(-80..80);

    // Move in smooth steps to the target
    let steps = rng.gen_range(12..25);
    for step in 0..=steps {
        let t = step as f64 / steps as f64;
        // Ease in-out
        let ease = if t < 0.5 {
            4.0 * t * t * t
        } else {
            1.0 - (-2.0 * t + 2.0).powi(3) / 2.0
        };

        let cx = start_x as f64 + (x - start_x) as f64 * ease;
        let cy = start_y as f64 + (y - start_y) as f64 * ease;

        let jx = rng.gen_range(-1..=1);
        let jy = rng.gen_range(-1..=1);

        enigo
            .move_mouse((cx as i32 + jx).max(0), (cy as i32 + jy).max(0), enigo::Coordinate::Abs)
            .ok();

        thread::sleep(Duration::from_millis(rng.gen_range(8..20)));
    }

    // Small pause before clicking (human reaction)
    thread::sleep(Duration::from_millis(rng.gen_range(50..200)));

    // Click the specified button
    let btn = match button.to_lowercase().as_str() {
        "right" => enigo::Button::Right,
        "middle" => enigo::Button::Middle,
        _ => enigo::Button::Left,
    };

    enigo.button(btn, Click).map_err(|e| e.to_string())?;

    // Small delay after click
    thread::sleep(Duration::from_millis(rng.gen_range(80..200)));

    Ok(format!("Click {} en ({}, {})", button, x, y))
}

/// Double-clicks at (x, y) with natural movement to the target.
#[tauri::command]
pub fn simulate_double_click(x: i32, y: i32) -> Result<String, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    let mut rng = rand::thread_rng();

    // Move to position with human-like curve
    let start_x = x + rng.gen_range(-60..60);
    let start_y = y + rng.gen_range(-60..60);
    let steps = rng.gen_range(10..20);

    for step in 0..=steps {
        let t = step as f64 / steps as f64;
        let ease = if t < 0.5 { 4.0 * t * t * t } else { 1.0 - (-2.0 * t + 2.0).powi(3) / 2.0 };
        let cx = start_x as f64 + (x - start_x) as f64 * ease;
        let cy = start_y as f64 + (y - start_y) as f64 * ease;
        enigo.move_mouse(cx as i32, cy as i32, enigo::Coordinate::Abs).ok();
        thread::sleep(Duration::from_millis(rng.gen_range(8..18)));
    }

    thread::sleep(Duration::from_millis(rng.gen_range(40..120)));

    // Double click = two clicks with short interval
    enigo.button(enigo::Button::Left, Click).ok();
    thread::sleep(Duration::from_millis(rng.gen_range(50..90)));
    enigo.button(enigo::Button::Left, Click).ok();

    thread::sleep(Duration::from_millis(rng.gen_range(80..200)));

    Ok(format!("Doble click en ({}, {})", x, y))
}

/// Scrolls in the active window.
/// direction: "up" or "down", amount: number of scroll steps.
#[tauri::command]
pub fn simulate_scroll(direction: String, amount: i32) -> Result<String, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    let mut rng = rand::thread_rng();

    let scroll_value = if direction.to_lowercase() == "up" { -1 } else { 1 };

    for _ in 0..amount {
        enigo.scroll(scroll_value * rng.gen_range(1..4), enigo::Axis::Vertical).ok();
        // Variable delay between scroll steps (human feel)
        thread::sleep(Duration::from_millis(rng.gen_range(80..300)));
    }

    Ok(format!("Scroll {} ({} pasos)", direction, amount))
}

/// Sends a keyboard shortcut (e.g. "ctrl+s", "alt+tab", "ctrl+shift+n").
/// Supports: ctrl, alt, shift, win + any key.
#[tauri::command]
pub fn send_keyboard_shortcut(shortcut: String) -> Result<String, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    let mut rng = rand::thread_rng();

    let lower = shortcut.to_lowercase();
    let parts: Vec<&str> = lower.split('+').map(|s| s.trim()).collect();

    if parts.is_empty() {
        return Err("Shortcut vacío".to_string());
    }

    // Parse modifiers and the main key
    let mut modifiers: Vec<Key> = Vec::new();
    let mut main_key: Option<Key> = None;

    for part in &parts {
        match *part {
            "ctrl" | "control" => modifiers.push(Key::Control),
            "alt"              => modifiers.push(Key::Alt),
            "shift"            => modifiers.push(Key::Shift),
            "win" | "super" | "meta" => modifiers.push(Key::Meta),
            "tab"      => main_key = Some(Key::Tab),
            "enter"    => main_key = Some(Key::Return),
            "escape" | "esc" => main_key = Some(Key::Escape),
            "space"    => main_key = Some(Key::Space),
            "delete" | "del" => main_key = Some(Key::Delete),
            "backspace" => main_key = Some(Key::Backspace),
            "home"     => main_key = Some(Key::Home),
            "end"      => main_key = Some(Key::End),
            "pageup"   => main_key = Some(Key::PageUp),
            "pagedown" => main_key = Some(Key::PageDown),
            "up"       => main_key = Some(Key::UpArrow),
            "down"     => main_key = Some(Key::DownArrow),
            "left"     => main_key = Some(Key::LeftArrow),
            "right"    => main_key = Some(Key::RightArrow),
            "f1"       => main_key = Some(Key::F1),
            "f2"       => main_key = Some(Key::F2),
            "f3"       => main_key = Some(Key::F3),
            "f4"       => main_key = Some(Key::F4),
            "f5"       => main_key = Some(Key::F5),
            "f6"       => main_key = Some(Key::F6),
            "f7"       => main_key = Some(Key::F7),
            "f8"       => main_key = Some(Key::F8),
            "f9"       => main_key = Some(Key::F9),
            "f10"      => main_key = Some(Key::F10),
            "f11"      => main_key = Some(Key::F11),
            "f12"      => main_key = Some(Key::F12),
            k if k.len() == 1 => {
                main_key = Some(Key::Unicode(k.chars().next().unwrap()));
            }
            _ => return Err(format!("Tecla no reconocida: '{}'", part)),
        }
    }

    let main_key = main_key.ok_or_else(|| "No se encontró una tecla principal en el shortcut".to_string())?;

    // Press modifiers
    for m in &modifiers {
        enigo.key(*m, enigo::Direction::Press).ok();
        thread::sleep(Duration::from_millis(rng.gen_range(20..50)));
    }

    // Press and release main key
    enigo.key(main_key, Click).ok();
    thread::sleep(Duration::from_millis(rng.gen_range(30..80)));

    // Release modifiers in reverse order
    for m in modifiers.iter().rev() {
        enigo.key(*m, enigo::Direction::Release).ok();
        thread::sleep(Duration::from_millis(rng.gen_range(20..50)));
    }

    Ok(format!("Shortcut ejecutado: {}", shortcut))
}

/// Copies text to the clipboard, waits, then pastes it (Ctrl+V).
/// Simulates a realistic copy-paste workflow.
#[tauri::command]
pub fn simulate_copy_paste(text: String, paste_delay_ms: u32) -> Result<String, String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    let mut rng = rand::thread_rng();

    // Select all in current context (Ctrl+A)
    enigo.key(Key::Control, Press).ok();
    thread::sleep(Duration::from_millis(rng.gen_range(30..60)));
    enigo.key(Key::Unicode('a'), Click).ok();
    thread::sleep(Duration::from_millis(rng.gen_range(30..60)));
    enigo.key(Key::Control, Release).ok();
    thread::sleep(Duration::from_millis(rng.gen_range(100..300)));

    // Type the text first (so there's something to copy)
    for ch in text.chars() {
        enigo.text(&ch.to_string()).ok();
        thread::sleep(Duration::from_millis(rng.gen_range(40..120)));
    }

    thread::sleep(Duration::from_millis(rng.gen_range(200..500)));

    // Select all the typed text (Ctrl+A)
    enigo.key(Key::Control, Press).ok();
    thread::sleep(Duration::from_millis(rng.gen_range(30..60)));
    enigo.key(Key::Unicode('a'), Click).ok();
    thread::sleep(Duration::from_millis(rng.gen_range(30..60)));
    enigo.key(Key::Control, Release).ok();
    thread::sleep(Duration::from_millis(rng.gen_range(80..200)));

    // Copy (Ctrl+C)
    enigo.key(Key::Control, Press).ok();
    thread::sleep(Duration::from_millis(rng.gen_range(30..60)));
    enigo.key(Key::Unicode('c'), Click).ok();
    thread::sleep(Duration::from_millis(rng.gen_range(30..60)));
    enigo.key(Key::Control, Release).ok();

    // Wait the configured delay
    thread::sleep(Duration::from_millis(paste_delay_ms as u64));

    // Paste (Ctrl+V)
    enigo.key(Key::Control, Press).ok();
    thread::sleep(Duration::from_millis(rng.gen_range(30..60)));
    enigo.key(Key::Unicode('v'), Click).ok();
    thread::sleep(Duration::from_millis(rng.gen_range(30..60)));
    enigo.key(Key::Control, Release).ok();

    thread::sleep(Duration::from_millis(rng.gen_range(100..300)));

    Ok(format!("Copiar/Pegar completado ({} caracteres)", text.len()))
}

/// Returns the current global mouse cursor position as (x, y).
#[tauri::command]
pub fn get_cursor_position() -> Result<(i32, i32), String> {
    #[cfg(windows)]
    {
        use winapi::shared::windef::POINT;
        use winapi::um::winuser::GetCursorPos;
        let mut point = POINT { x: 0, y: 0 };
        let success = unsafe { GetCursorPos(&mut point) };
        if success != 0 {
            Ok((point.x, point.y))
        } else {
            Err("Failed to get cursor position".to_string())
        }
    }
    #[cfg(not(windows))]
    {
        Err("Not supported on this platform".to_string())
    }
}
