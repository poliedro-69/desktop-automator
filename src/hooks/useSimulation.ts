import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";
import type { Activity, LogEntry, SimulationConfig, SimulationStatus } from "../types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function timestampStr() {
  return new Date().toLocaleTimeString("es-ES", { hour12: false });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Execution context — shared state between activities
// ═══════════════════════════════════════════════════════════════════════════════

interface ExecutionContext {
  timestamp: string;   // ISO full: 2026-07-03T14:30:22
  date: string;        // 2026-07-03
  time: string;        // 14:30:22
  counter: number;     // sequential activity count within cycle
  cycle: number;       // current cycle number (1-based)
  prevResult: string;  // result string from previous activity
  clipboard: string;   // last known clipboard text
  randomId: string;    // refreshed per activity
  randomNumber: string; // refreshed per activity
  custom: Record<string, string>; // user-defined variables
}

function createContext(cycle: number): ExecutionContext {
  const now = new Date();
  return {
    timestamp: now.toISOString().replace("T", " ").slice(0, 19),
    date: now.toISOString().slice(0, 10),
    time: now.toLocaleTimeString("es-ES", { hour12: false }),
    counter: 0,
    cycle,
    prevResult: "",
    clipboard: "",
    randomId: uid(),
    randomNumber: String(Math.floor(Math.random() * 9999) + 1),
    custom: {},
  };
}

function refreshContext(ctx: ExecutionContext): void {
  const now = new Date();
  ctx.timestamp = now.toISOString().replace("T", " ").slice(0, 19);
  ctx.date = now.toISOString().slice(0, 10);
  ctx.time = now.toLocaleTimeString("es-ES", { hour12: false });
  ctx.randomId = uid();
  ctx.randomNumber = String(Math.floor(Math.random() * 9999) + 1);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Template resolver: replaces {{variable}} in strings
// ═══════════════════════════════════════════════════════════════════════════════

function resolveTemplate(template: string | number | boolean, ctx: ExecutionContext): string | number | boolean {
  if (typeof template !== "string") return template;
  if (!template.includes("{{")) return template;

  return template
    .replace(/\{\{timestamp\}\}/g, ctx.timestamp)
    .replace(/\{\{date\}\}/g, ctx.date)
    .replace(/\{\{time\}\}/g, ctx.time)
    .replace(/\{\{counter\}\}/g, String(ctx.counter))
    .replace(/\{\{cycle\}\}/g, String(ctx.cycle))
    .replace(/\{\{prev_result\}\}/g, ctx.prevResult)
    .replace(/\{\{clipboard\}\}/g, ctx.clipboard)
    .replace(/\{\{random_id\}\}/g, ctx.randomId)
    .replace(/\{\{random_number\}\}/g, ctx.randomNumber)
    .replace(/\{\{custom\.(\w+)\}\}/g, (_, key) => ctx.custom[key] ?? "");
}

function resolveParams(
  params: Record<string, string | number | boolean>,
  ctx: ExecutionContext
): Record<string, string | number | boolean> {
  const resolved: Record<string, string | number | boolean> = {};
  for (const [key, val] of Object.entries(params)) {
    resolved[key] = resolveTemplate(val, ctx);
  }
  return resolved;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main hook
// ═══════════════════════════════════════════════════════════════════════════════

export function useSimulation() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<SimulationStatus>({
    running: false,
    currentActivity: null,
    completedCycles: 0,
    totalActions: 0,
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const stopRef = useRef(false);

  const addLog = useCallback(
    (message: string, level: LogEntry["level"] = "info") => {
      setLogs((prev) => [
        { id: uid(), timestamp: timestampStr(), level, message },
        ...prev.slice(0, 199),
      ]);
    },
    []
  );

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const randomBetween = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  // ─── Execute a single activity with resolved params ─────────────────────────
  const executeActivity = useCallback(
    async (activity: Activity, ctx: ExecutionContext, humanize: boolean): Promise<string> => {
      // Resolve templates in all params
      const params = resolveParams(activity.params, ctx);

      addLog(`▶ ${activity.label}`, "info");
      setStatus((s) => ({ ...s, currentActivity: activity.label }));

      let result = "";

      try {
        switch (activity.type) {
          case "open_app": {
            result = await invoke<string>("open_application", {
              path: params.path as string,
            });
            break;
          }
          case "open_file":
          case "open_spreadsheet": {
            result = await invoke<string>("open_file", {
              path: params.path as string,
            });
            break;
          }
          case "copy_file": {
            result = await invoke<string>("copy_file", {
              source: params.source as string,
              dest: params.dest as string,
            });
            break;
          }
          case "open_browser":
          case "browse_intranet": {
            result = await invoke<string>("open_url", {
              url: params.url as string,
            });
            break;
          }
          case "mouse_move": {
            result = await invoke<string>("simulate_mouse_activity", {
              durationSecs: Number(params.duration) || 15,
            });
            break;
          }
          case "mouse_click": {
            result = await invoke<string>("simulate_mouse_click", {
              x: Number(params.x) || 0,
              y: Number(params.y) || 0,
              button: (params.button as string) || "left",
            });
            break;
          }
          case "mouse_double_click": {
            result = await invoke<string>("simulate_double_click", {
              x: Number(params.x) || 0,
              y: Number(params.y) || 0,
            });
            break;
          }
          case "keyboard_shortcut": {
            result = await invoke<string>("send_keyboard_shortcut", {
              shortcut: params.shortcut as string,
            });
            break;
          }
          case "scroll_window": {
            result = await invoke<string>("simulate_scroll", {
              direction: (params.direction as string) || "down",
              amount: Number(params.amount) || 5,
            });
            break;
          }
          case "copy_paste": {
            result = await invoke<string>("simulate_copy_paste", {
              text: params.text as string,
              pasteDelayMs: Number(params.pasteDelay) || 500,
            });
            break;
          }
          case "type_text": {
            result = await invoke<string>("simulate_typing", {
              text: params.text as string,
            });
            break;
          }
          case "take_screenshot": {
            result = await invoke<string>("take_screenshot", {
              outputPath: params.outputPath as string,
            });
            break;
          }
          case "run_powershell": {
            result = await invoke<string>("run_powershell", {
              script: params.script as string,
            });
            // Store powershell output in clipboard context for chaining
            ctx.clipboard = result;
            break;
          }
          case "browse_tabs": {
            const urlsStr = params.urls as string;
            const urls = urlsStr.split(",").map((u) => u.trim()).filter(Boolean);
            const interval = Number(params.interval) || 10;
            result = await invoke<string>("browse_multiple_tabs", { urls, intervalSecs: interval });
            break;
          }
          case "set_variable": {
            const varName = params.name as string;
            const varValue = params.value as string;
            ctx.custom[varName] = varValue;
            result = `{{custom.${varName}}} = "${varValue}"`;
            addLog(t("simulation.varDefined", { result }), "info");
            break;
          }
          case "random_pause": {
            const min = Number(params.minSeconds) || 5;
            const max = Number(params.maxSeconds) || 30;
            const duration = randomBetween(min, max);
            addLog(t("simulation.randomPause", { s: duration, min, max }), "info");
            await sleep(duration * 1000);
            result = `Pausa de ${duration}s`;
            break;
          }
          case "idle_break": {
            const secs = Number(params.seconds) || 30;
            addLog(t("simulation.pause", { s: secs }), "info");
            await sleep(secs * 1000);
            result = "ok";
            break;
          }
        }

        addLog(`✓ ${activity.label}: ${result}`, "success");
        setStatus((s) => ({ ...s, totalActions: s.totalActions + 1 }));

        // Save result into context immediately for chaining
        ctx.prevResult = result;

        if (humanize) {
          await sleep(randomBetween(500, 2000));
        }
      } catch (err) {
        result = `ERROR: ${String(err)}`;
        ctx.prevResult = result;
        addLog(`✗ ${activity.label}: ${String(err)}`, "error");
      }

      return result;
    },
    [addLog, t]
  );

  // ─── Start simulation ───────────────────────────────────────────────────────
  const start = useCallback(
    async (config: SimulationConfig) => {
      stopRef.current = false;
      setStatus({ running: true, currentActivity: null, completedCycles: 0, totalActions: 0 });
      setLogs([]);
      addLog(t("simulation.started"), "info");

      const enabledActivities = config.activities.filter((a) => a.enabled);
      if (enabledActivities.length === 0) {
        addLog(t("simulation.noActivities"), "warning");
        setStatus((s) => ({ ...s, running: false }));
        return;
      }

      const maxCycles = config.loop
        ? (Number(config.loopCount) > 0 ? Number(config.loopCount) : Infinity)
        : 1;
      let cycle = 0;

      addLog(
        maxCycles === Infinity
          ? t("simulation.modeInfinite")
          : maxCycles === 1
          ? t("simulation.modeSingle")
          : t("simulation.modeCycles", { n: maxCycles }),
        "info"
      );

      while (cycle < maxCycles && !stopRef.current) {
        cycle++;
        if (config.loop) addLog(t("simulation.cycle", { n: cycle }), "info");

        // Create fresh context per cycle (preserves custom vars across cycle)
        const ctx = createContext(cycle);

        for (const activity of enabledActivities) {
          if (stopRef.current) break;

          // Refresh time-based vars before each activity
          refreshContext(ctx);
          ctx.counter++;

          const result = await executeActivity(activity, ctx, config.humanize);

          // Chain: save result for next activity
          ctx.prevResult = result;

          if (!stopRef.current) {
            const delay = randomBetween(config.minDelay, config.maxDelay) * 1000;
            addLog(t("simulation.waiting", { s: (delay / 1000).toFixed(1) }), "info");
            await sleep(delay);
          }
        }

        setStatus((s) => ({ ...s, completedCycles: cycle }));
      }

      setStatus((s) => ({ ...s, running: false, currentActivity: null }));
      addLog(t("simulation.completed"), "success");
    },
    [executeActivity, addLog, t]
  );

  const stop = useCallback(() => {
    stopRef.current = true;
    addLog(t("simulation.stopping"), "warning");
  }, [addLog, t]);

  return { status, logs, start, stop };
}
