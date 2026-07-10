import { useState, useEffect, useCallback } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

export interface UpdateInfo {
  status: UpdateStatus;
  version?: string;
  notes?: string;
  progress?: number;
  error?: string;
}

export function useUpdater(autoCheck = true, delayMs = 30000) {
  const [info, setInfo] = useState<UpdateInfo>({ status: "idle" });
  const [update, setUpdate] = useState<Update | null>(null);

  const checkForUpdates = useCallback(async () => {
    setInfo({ status: "checking" });
    try {
      const result = await check();
      if (result?.available) {
        setUpdate(result);
        setInfo({
          status: "available",
          version: result.version,
          notes: result.body ?? undefined,
        });
      } else {
        setInfo({ status: "idle" });
      }
    } catch (err) {
      setInfo({ status: "error", error: String(err) });
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    if (!update) return;
    setInfo((prev) => ({ ...prev, status: "downloading", progress: 0 }));
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === "Progress") {
          setInfo((prev) => ({ ...prev, progress: (prev.progress ?? 0) + 5 }));
        }
      });
      setInfo((prev) => ({ ...prev, status: "ready" }));
    } catch (err) {
      setInfo({ status: "error", error: String(err) });
    }
  }, [update]);

  const restartApp = useCallback(async () => {
    await relaunch();
  }, []);

  const dismiss = useCallback(() => {
    setInfo({ status: "idle" });
    setUpdate(null);
  }, []);

  // Auto-check on mount after delay
  useEffect(() => {
    if (!autoCheck) return;
    const timer = setTimeout(checkForUpdates, delayMs);
    return () => clearTimeout(timer);
  }, [autoCheck, delayMs, checkForUpdates]);

  return { info, checkForUpdates, downloadAndInstall, restartApp, dismiss };
}
