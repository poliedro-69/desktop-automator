export type ActivityType =
  | "open_app"
  | "open_file"
  | "open_spreadsheet"
  | "open_browser"
  | "browse_intranet"
  | "mouse_move"
  | "mouse_click"
  | "mouse_double_click"
  | "keyboard_shortcut"
  | "copy_paste"
  | "copy_file"
  | "scroll_window"
  | "type_text"
  | "take_screenshot"
  | "run_powershell"
  | "browse_tabs"
  | "set_variable"
  | "random_pause"
  | "idle_break";

export interface Activity {
  id: string;
  type: ActivityType;
  label: string;
  params: Record<string, string | number | boolean>;
  enabled: boolean;
}

export interface SimulationConfig {
  activities: Activity[];
  minDelay: number; // seconds between actions
  maxDelay: number;
  loop: boolean;
  loopCount: number; // 0 = infinite
  humanize: boolean; // add random micro-pauses
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warning" | "error";
  message: string;
}

export interface SimulationStatus {
  running: boolean;
  currentActivity: string | null;
  completedCycles: number;
  totalActions: number;
}
