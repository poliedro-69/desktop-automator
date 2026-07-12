import { invoke } from "@tauri-apps/api/core";

/** Hides the main window to the system tray */
export async function hideToTray() {
  await invoke("hide_window");
}

/** Shows and focuses the main window */
export async function showFromTray() {
  await invoke("show_window");
}
