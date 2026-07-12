mod commands;
mod license;
mod stripe;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};
use commands::apps::{open_application, open_file, open_url, copy_file, open_help};
use commands::browser::browse_multiple_tabs;
use commands::mouse::{simulate_mouse_activity, simulate_mouse_click, simulate_double_click, simulate_scroll, send_keyboard_shortcut, simulate_typing, simulate_copy_paste, get_cursor_position};
use commands::powershell::run_powershell;
use commands::screenshot::take_screenshot;

/// Hide the main window (minimize to tray).
#[tauri::command]
fn hide_window(app: tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.hide();
    }
}

/// Show and focus the main window.
#[tauri::command]
fn show_window(app: tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                if let Some(win) = app.get_webview_window("main") {
                    win.open_devtools();
                }
            }

            // ── System tray ──────────────────────────────────────────────────
            let show_item = MenuItem::with_id(app, "show", "Mostrar ventana", true, None::<&str>)?;
            let sep       = tauri::menu::PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;

            let tray_menu = Menu::with_items(app, &[&show_item, &sep, &quit_item])?;

            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .tooltip("Desktop Automator")
                // Left-click on tray → toggle window
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            if win.is_visible().unwrap_or(false) {
                                let _ = win.hide();
                            } else {
                                let _ = win.show();
                                let _ = win.set_focus();
                            }
                        }
                    }
                })
                // Menu item clicks
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            hide_window,
            show_window,
            open_application,
            open_file,
            open_url,
            copy_file,
            open_help,
            simulate_mouse_activity,
            simulate_mouse_click,
            simulate_double_click,
            simulate_scroll,
            send_keyboard_shortcut,
            simulate_typing,
            simulate_copy_paste,
            take_screenshot,
            run_powershell,
            browse_multiple_tabs,
            get_cursor_position,
            license::check_license,
            license::activate_license,
            license::get_full_machine_id,
            license::generate_license_from_payment,
            stripe::create_checkout_session,
            stripe::check_payment_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
