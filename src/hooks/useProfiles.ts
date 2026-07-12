import { useState, useCallback } from "react";
import { save, open } from "@tauri-apps/plugin-dialog";
import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
import type { Activity, SimulationConfig } from "../types";

export interface Profile {
  version: number;
  name: string;
  savedAt: string;
  config: Omit<SimulationConfig, "activities">;
  activities: Activity[];
}

export interface RecentProfile {
  path: string;
  name: string;
  savedAt: string;
}

const RECENTS_KEY = "activitysim-recents";
const MAX_RECENTS = 8;

function loadRecents(): RecentProfile[] {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecents(recents: RecentProfile[]) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
  } catch {
    // ignore
  }
}

function pushRecent(recents: RecentProfile[], entry: RecentProfile): RecentProfile[] {
  // Remove duplicate path, add at front, cap to MAX_RECENTS
  const filtered = recents.filter((r) => r.path !== entry.path);
  return [entry, ...filtered].slice(0, MAX_RECENTS);
}

export function useProfiles(
  activities: Activity[],
  config: Omit<SimulationConfig, "activities">,
  onLoad: (activities: Activity[], config: Omit<SimulationConfig, "activities">, name: string) => void
) {
  const [recents, setRecents] = useState<RecentProfile[]>(loadRecents);
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveProfile = useCallback(
    async (suggestedName?: string) => {
      setLastError(null);
      setSaving(true);
      try {
        const filePath = await save({
          title: "Guardar perfil de simulación",
          defaultPath: `${suggestedName ?? "perfil-simulacion"}.json`,
          filters: [{ name: "Perfil de Activity Simulator", extensions: ["json"] }],
        });

        if (!filePath) return; // user cancelled

        const profileName = (filePath as string)
          .split(/[\\/]/)
          .pop()
          ?.replace(/\.json$/i, "") ?? "Perfil";

        const profile: Profile = {
          version:   1,
          name:      profileName,
          savedAt:   new Date().toISOString(),
          config,
          activities,
        };

        await writeTextFile(filePath as string, JSON.stringify(profile, null, 2));

        // Update recents
        const updated = pushRecent(recents, {
          path:    filePath as string,
          name:    profileName,
          savedAt: profile.savedAt,
        });
        setRecents(updated);
        saveRecents(updated);

        return profileName;
      } catch (err) {
        setLastError(String(err));
      } finally {
        setSaving(false);
      }
    },
    [activities, config, recents]
  );

  // ── Open via dialog ───────────────────────────────────────────────────────
  const openProfile = useCallback(async () => {
    setLastError(null);
    setLoading(true);
    try {
      const filePath = await open({
        title: "Abrir perfil de simulación",
        multiple: false,
        filters: [{ name: "Perfil de Activity Simulator", extensions: ["json"] }],
      });

      if (!filePath) return; // cancelled

      await loadFromPath(filePath as string);
    } catch (err) {
      setLastError(String(err));
    } finally {
      setLoading(false);
    }
  }, [recents]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load from known path (recents) ───────────────────────────────────────
  const loadFromPath = useCallback(
    async (filePath: string) => {
      setLastError(null);
      setLoading(true);
      try {
        const raw = await readTextFile(filePath);
        const parsed: Profile = JSON.parse(raw);

        if (!parsed.activities || !Array.isArray(parsed.activities)) {
          throw new Error("El archivo no es un perfil válido");
        }

        const cfg = parsed.config ?? {
          minDelay: 3, maxDelay: 10, loop: true, loopCount: 0, humanize: true,
        };

        onLoad(parsed.activities, cfg, parsed.name ?? "Perfil");

        // Update recents
        const entry: RecentProfile = {
          path:    filePath,
          name:    parsed.name ?? filePath.split(/[\\/]/).pop()?.replace(/\.json$/i, "") ?? "Perfil",
          savedAt: parsed.savedAt ?? new Date().toISOString(),
        };
        const updated = pushRecent(recents, entry);
        setRecents(updated);
        saveRecents(updated);
      } catch (err) {
        setLastError(String(err));
      } finally {
        setLoading(false);
      }
    },
    [onLoad, recents]
  );

  // ── Remove from recents ──────────────────────────────────────────────────
  const removeRecent = useCallback((path: string) => {
    const updated = recents.filter((r) => r.path !== path);
    setRecents(updated);
    saveRecents(updated);
  }, [recents]);

  return {
    recents,
    saving,
    loading,
    lastError,
    saveProfile,
    openProfile,
    loadFromPath,
    removeRecent,
  };
}
