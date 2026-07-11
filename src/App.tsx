import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Play, Square, Settings, EyeOff, Sun, Moon, HelpCircle, ChevronsUp, ChevronsDown } from "lucide-react";
import { TitleBar } from "./components/TitleBar";
import { ActivityCard } from "./components/ActivityCard";
import { AddActivityMenu } from "./components/AddActivityMenu";
import { LogPanel } from "./components/LogPanel";
import { StatusBar } from "./components/StatusBar";
import { ProfileBar } from "./components/ProfileBar";
import { SampleProfilesMenu } from "./components/SampleProfilesMenu";
import { LanguageSelector } from "./components/LanguageSelector";
import { CursorPosition } from "./components/CursorPosition";
import { ResizablePanels } from "./components/ResizablePanels";
import { AboutButton } from "./components/AboutModal";
import { LicenseGate } from "./components/LicenseGate";
import { UpdateNotification } from "./components/UpdateNotification";
import { useSimulation } from "./hooks/useSimulation";
import { hideToTray } from "./hooks/useWindow";
import { useTheme } from "./hooks/useTheme";
import { useProfiles } from "./hooks/useProfiles";
import { invoke } from "@tauri-apps/api/core";
import type { Activity, SimulationConfig } from "./types";

const DEFAULT_ACTIVITIES: Activity[] = [];

export default function App() {
  const { t, i18n } = useTranslation();
  const [activities, setActivities] = useState<Activity[]>(DEFAULT_ACTIVITIES);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<Omit<SimulationConfig, "activities">>({
    minDelay: 3,
    maxDelay: 10,
    loop: true,
    loopCount: 0,
    humanize: true,
  });

  const { status, logs, start, stop } = useSimulation();
  const { theme, toggle: toggleTheme } = useTheme();

  const handleLoad = useCallback(
    (newActivities: Activity[], newConfig: Omit<SimulationConfig, "activities">) => {
      setActivities(newActivities);
      setConfig(newConfig);
    },
    []
  );

  const { recents, saving, loading, lastError, saveProfile, openProfile, loadFromPath, removeRecent } =
    useProfiles(activities, config, handleLoad);

  const [logList, setLogList] = useState(logs);
  const clearLogs = useCallback(() => setLogList([]), []);

  // Sync logs from hook
  React.useEffect(() => {
    setLogList(logs);
  }, [logs]);

  const handleStart = () => {
    start({ activities, ...config });
  };

  const addActivity = (a: Activity) => setActivities((prev) => [...prev, a]);
  const updateActivity = (id: string, updated: Activity) =>
    setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
  const deleteActivity = (id: string) =>
    setActivities((prev) => prev.filter((a) => a.id !== id));
  const moveActivity = (index: number, direction: "up" | "down") => {
    setActivities((prev) => {
      const arr = [...prev];
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return prev;
      [arr[index], arr[target]] = [arr[target], arr[index]];
      return arr;
    });
  };

  // null = individual control, true = all expanded, false = all collapsed
  const [allExpanded, setAllExpanded] = useState<boolean | null>(null);

  return (
    <LicenseGate>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Custom title bar */}
      <TitleBar />

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <img src="/robot.png" alt="logo" style={{ width: 20, height: 20, borderRadius: 4 }} />
        <span style={{ fontWeight: 700, fontSize: 14 }}>Desktop Automator</span>
        <span
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            background: "var(--surface2)",
            padding: "1px 6px",
            borderRadius: 99,
          }}
        >
          v1.0
        </span>

        <div style={{ flex: 1 }} />

        {/* Language selector */}
        <LanguageSelector />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? t("toolbar.lightTheme") : t("toolbar.darkTheme")}
          style={{
            ...iconBtnStyle,
            color: theme === "dark" ? "#f59e0b" : "#6b7280",
          }}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <div style={{ width: 1, height: 20, background: "var(--border)" }} />

        {/* Hide to tray button */}
        <button
          onClick={hideToTray}
          title={t("toolbar.hideTip")}
          style={{
            ...iconBtnStyle,
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 6,
            gap: 5,
            padding: "4px 10px",
            fontSize: 12,
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "var(--surface2)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
          }}
        >
          <EyeOff size={13} />
          {t("toolbar.hide")}
        </button>

        <div style={{ width: 1, height: 20, background: "var(--border)" }} />

        <ProfileBar
          recents={recents}
          saving={saving}
          loading={loading}
          lastError={lastError}
          onSave={saveProfile}
          onOpen={openProfile}
          onLoadRecent={loadFromPath}
          onRemoveRecent={removeRecent}
        />

        <SampleProfilesMenu onLoad={handleLoad} />

        <div style={{ width: 1, height: 20, background: "var(--border)" }} />

        <button
          onClick={() => setShowSettings((s) => !s)}
          title={t("toolbar.settings")}
          style={{
            ...iconBtnStyle,
            background: showSettings ? "var(--surface2)" : "transparent",
          }}
        >
          <Settings size={15} />
        </button>
        <button
          onClick={() => invoke("open_help", { lang: i18n.language })}
          title={t("toolbar.help")}
          style={iconBtnStyle}
        >
          <HelpCircle size={15} />
        </button>
        <AboutButton />
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--surface)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <ConfigField
            label={t("config.minDelay")}
            type="number"
            value={config.minDelay}
            onChange={(v) => setConfig((c) => ({ ...c, minDelay: Number(v) }))}
          />
          <ConfigField
            label={t("config.maxDelay")}
            type="number"
            value={config.maxDelay}
            onChange={(v) => setConfig((c) => ({ ...c, maxDelay: Number(v) }))}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={config.loop}
              onChange={(e) => setConfig((c) => ({ ...c, loop: e.target.checked }))}
            />
            {t("config.loop")}
          </label>
          {config.loop && (
            <ConfigField
              label={t("config.cycles")}
              type="number"
              value={config.loopCount}
              onChange={(v) => setConfig((c) => ({ ...c, loopCount: Math.max(0, Number(v) || 0) }))}
            />
          )}
          {!config.loop && (
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>
              {t("config.singleRun")}
            </span>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={config.humanize}
              onChange={(e) => setConfig((c) => ({ ...c, humanize: e.target.checked }))}
            />
            {t("config.humanize")}
          </label>
        </div>
      )}

      {/* Main content */}
      <ResizablePanels
        left={
          <>
          {/* Activity list header */}
          <div
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600 }}>
              {t("activities.title")}{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                ({activities.filter((a) => a.enabled).length}/{activities.length})
              </span>
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {activities.length > 0 && (
                <>
                  <button
                    onClick={() => setAllExpanded(allExpanded === true ? null : true)}
                    title={t("activities.expandAll")}
                    style={{
                      background: allExpanded === true ? "var(--surface2)" : "transparent",
                      border: "none", cursor: "pointer", color: "var(--text-muted)",
                      display: "flex", padding: 4, borderRadius: 4,
                    }}
                  >
                    <ChevronsDown size={14} />
                  </button>
                  <button
                    onClick={() => setAllExpanded(allExpanded === false ? null : false)}
                    title={t("activities.collapseAll")}
                    style={{
                      background: allExpanded === false ? "var(--surface2)" : "transparent",
                      border: "none", cursor: "pointer", color: "var(--text-muted)",
                      display: "flex", padding: 4, borderRadius: 4,
                    }}
                  >
                    <ChevronsUp size={14} />
                  </button>
                </>
              )}
              <AddActivityMenu onAdd={addActivity} />
            </div>
          </div>

          {/* Activity list */}
          <div style={{ flex: 1, overflow: "auto", padding: "10px 14px" }}>
            {activities.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "var(--text-muted)",
                  marginTop: 60,
                  lineHeight: 2,
                }}
              >
                <div style={{ fontSize: 32 }}>📋</div>
                <div>{t("activities.empty")}</div>
                <div style={{ fontSize: 12 }}>{t("activities.emptyHint")}</div>
              </div>
            ) : (
              activities.map((a, index) => (
                <ActivityCard
                  key={a.id}
                  activity={a}
                  onChange={(updated) => updateActivity(a.id, updated)}
                  onDelete={() => deleteActivity(a.id)}
                  onMoveUp={index > 0 ? () => moveActivity(index, "up") : null}
                  onMoveDown={index < activities.length - 1 ? () => moveActivity(index, "down") : null}
                  forceExpanded={allExpanded}
                  onToggle={() => setAllExpanded(null)}
                />
              ))
            )}
          </div>

          {/* Control buttons */}
          <div
            style={{
              padding: "12px 14px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: 10,
            }}
          >
            {status.running ? (
              <button
                onClick={stop}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: "var(--danger)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius)",
                  padding: "10px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                <Square size={16} />
                {t("controls.stop")}
              </button>
            ) : (
              <button
                onClick={handleStart}
                disabled={activities.filter((a) => a.enabled).length === 0}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background:
                    activities.filter((a) => a.enabled).length === 0
                      ? "var(--border)"
                      : "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius)",
                  padding: "10px",
                  cursor:
                    activities.filter((a) => a.enabled).length === 0 ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                <Play size={16} />
                {t("controls.start")}
              </button>
            )}
          </div>
          </>
        }
        right={
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "14px",
              overflow: "hidden",
              height: "100%",
            }}
          >
            <StatusBar status={status} />
            <div style={{ flex: 1, overflow: "hidden" }}>
              <LogPanel logs={logList} onClear={clearLogs} />
            </div>
          </div>
        }
      />

      {/* Cursor position indicator */}
      <CursorPosition />
      <UpdateNotification />
    </div>
    </LicenseGate>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--text-muted)",
  display: "flex",
  alignItems: "center",
  padding: 6,
  borderRadius: 6,
};

function ConfigField({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: number | string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12 }}>
      <span style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 80,
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          color: "var(--text)",
          padding: "4px 8px",
          fontSize: 13,
        }}
      />
    </label>
  );
}
