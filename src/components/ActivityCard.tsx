import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from "lucide-react";
import { FileInput } from "./FileInput";
import type { Activity, ActivityType } from "../types";

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  open_app: "🖥️",
  open_file: "📄",
  open_spreadsheet: "📊",
  open_browser: "🌐",
  browse_intranet: "🏢",
  mouse_move: "🖱️",
  mouse_click: "🎯",
  mouse_double_click: "👆",
  keyboard_shortcut: "⌨️",
  copy_paste: "📋",
  copy_file: "📂",
  scroll_window: "📜",
  type_text: "✍️",
  take_screenshot: "📸",
  run_powershell: "⚡",
  browse_tabs: "🔄",
  set_variable: "📌",
  random_pause: "🎲",
  idle_break: "⏸️",
};

interface Props {
  activity: Activity;
  onChange: (updated: Activity) => void;
  onDelete: () => void;
  onMoveUp: (() => void) | null;
  onMoveDown: (() => void) | null;
  forceExpanded?: boolean | null;
  onToggle?: () => void;
}

export function ActivityCard({ activity, onChange, onDelete, onMoveUp, onMoveDown, forceExpanded, onToggle }: Props) {
  const { t } = useTranslation();
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = forceExpanded != null ? forceExpanded : localExpanded;

  const update = (patch: Partial<Activity>) =>
    onChange({ ...activity, ...patch });

  const updateParam = (key: string, value: string | number | boolean) =>
    onChange({ ...activity, params: { ...activity.params, [key]: value } });

  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid ${activity.enabled ? "var(--border)" : "#2a2d3a"}`,
        borderRadius: "var(--radius)",
        marginBottom: 8,
        opacity: activity.enabled ? 1 : 0.5,
        transition: "opacity 0.2s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 12px",
          cursor: "pointer",
        }}
        onClick={() => {
          setLocalExpanded((e) => !e);
          if (onToggle) onToggle(); // Reset "expand/collapse all" mode
        }}
      >
        {/* Reorder buttons */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
            disabled={!onMoveUp}
            style={{
              background: "transparent", border: "none", cursor: onMoveUp ? "pointer" : "default",
              color: onMoveUp ? "var(--text-muted)" : "var(--border)", padding: 0, display: "flex",
              opacity: onMoveUp ? 1 : 0.3,
            }}
            title={t("activities.moveUp")}
          >
            <ArrowUp size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
            disabled={!onMoveDown}
            style={{
              background: "transparent", border: "none", cursor: onMoveDown ? "pointer" : "default",
              color: onMoveDown ? "var(--text-muted)" : "var(--border)", padding: 0, display: "flex",
              opacity: onMoveDown ? 1 : 0.3,
            }}
            title={t("activities.moveDown")}
          >
            <ArrowDown size={12} />
          </button>
        </div>

        <span style={{ fontSize: 18 }}>{ACTIVITY_ICONS[activity.type]}</span>
        <span style={{ flex: 1, fontWeight: 500 }}>{activity.label}</span>

        {/* Toggle enabled */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            update({ enabled: !activity.enabled });
          }}
          style={{
            width: 36,
            height: 20,
            borderRadius: 10,
            background: activity.enabled ? "var(--accent)" : "var(--border)",
            position: "relative",
            cursor: "pointer",
            transition: "background 0.2s",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 2,
              left: activity.enabled ? 18 : 2,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "white",
              transition: "left 0.2s",
            }}
          />
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--danger)",
            display: "flex",
            padding: 4,
          }}
        >
          <Trash2 size={14} />
        </button>

        {expanded ? (
          <ChevronUp size={14} color="var(--text-muted)" />
        ) : (
          <ChevronDown size={14} color="var(--text-muted)" />
        )}
      </div>

      {/* Params */}
      {expanded && (
        <div
          style={{
            padding: "0 12px 12px",
            borderTop: "1px solid var(--border)",
            paddingTop: 12,
          }}
        >
          <ParamFields activity={activity} updateParam={updateParam} update={update} />
        </div>
      )}
    </div>
  );
}

function ParamFields({
  activity,
  updateParam,
  update,
}: {
  activity: Activity;
  updateParam: (k: string, v: string | number | boolean) => void;
  update: (p: Partial<Activity>) => void;
}) {
  const { t } = useTranslation();
  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text)",
    padding: "6px 10px",
    fontSize: 13,
    marginTop: 4,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginTop: 8,
    display: "block",
  };

  const row = (label: string, content: React.ReactNode) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {content}
    </div>
  );

  // Label rename
  const labelEdit = (
    <div style={{ marginBottom: 10 }}>
      <label style={labelStyle}>{t("activities.activityName")}</label>
      <input
        style={inputStyle}
        value={activity.label}
        onChange={(e) => update({ label: e.target.value })}
      />
    </div>
  );

  switch (activity.type) {
    case "open_app":
    case "open_file":
    case "open_spreadsheet":
      return (
        <>
          {labelEdit}
          {row(
            t("params.path"),
            <FileInput
              value={(activity.params.path as string) || ""}
              onChange={(v) => updateParam("path", v)}
              placeholder={
                activity.type === "open_app"
                  ? "C:\\Windows\\System32\\notepad.exe"
                  : "C:\\Documentos\\informe.xlsx"
              }
              filters={
                activity.type === "open_app"
                  ? [{ name: t("params.filterExe"), extensions: ["exe", "bat", "cmd", "msi"] }, { name: t("params.filterAll"), extensions: ["*"] }]
                  : activity.type === "open_spreadsheet"
                  ? [{ name: t("params.filterSpreadsheets"), extensions: ["xlsx", "xls", "csv", "ods"] }, { name: t("params.filterAll"), extensions: ["*"] }]
                  : [{ name: t("params.filterDocuments"), extensions: ["docx", "doc", "pdf", "txt", "pptx"] }, { name: t("params.filterAll"), extensions: ["*"] }]
              }
            />
          )}
        </>
      );

    case "open_browser":
    case "browse_intranet":
      return (
        <>
          {labelEdit}
          {row(
            t("params.url"),
            <input
              style={inputStyle}
              placeholder="https://intranet.empresa.com"
              value={(activity.params.url as string) || ""}
              onChange={(e) => updateParam("url", e.target.value)}
            />
          )}
        </>
      );

    case "mouse_move":
      return (
        <>
          {labelEdit}
          {row(
            t("params.duration"),
            <input
              style={inputStyle}
              type="number"
              min={1}
              max={300}
              value={(activity.params.duration as number) || 10}
              onChange={(e) => updateParam("duration", parseInt(e.target.value))}
            />
          )}
        </>
      );

    case "mouse_click":
      return (
        <>
          {labelEdit}
          <div style={{ display: "flex", gap: 10 }}>
            {row(
              t("params.coordX"),
              <input
                style={{ ...inputStyle, width: 90 }}
                type="number"
                min={0}
                max={3840}
                value={(activity.params.x as number) || 0}
                onChange={(e) => updateParam("x", parseInt(e.target.value) || 0)}
              />
            )}
            {row(
              t("params.coordY"),
              <input
                style={{ ...inputStyle, width: 90 }}
                type="number"
                min={0}
                max={2160}
                value={(activity.params.y as number) || 0}
                onChange={(e) => updateParam("y", parseInt(e.target.value) || 0)}
              />
            )}
          </div>
          {row(
            t("params.mouseButton"),
            <select
              style={inputStyle}
              value={(activity.params.button as string) || "left"}
              onChange={(e) => updateParam("button", e.target.value)}
            >
              <option value="left">{t("params.mouseLeft")}</option>
              <option value="right">{t("params.mouseRight")}</option>
              <option value="middle">{t("params.mouseMiddle")}</option>
            </select>
          )}
        </>
      );

    case "type_text":
      return (
        <>
          {labelEdit}
          {row(
            t("params.text"),
            <textarea
              style={{ ...inputStyle, height: 80, resize: "vertical" }}
              placeholder={t("params.textPlaceholder")}
              value={(activity.params.text as string) || ""}
              onChange={(e) => updateParam("text", e.target.value)}
            />
          )}
        </>
      );

    case "take_screenshot":
      return (
        <>
          {labelEdit}
          {row(
            t("params.outputPath"),
            <FileInput
              value={(activity.params.outputPath as string) || ""}
              onChange={(v) => updateParam("outputPath", v)}
              placeholder="C:\\Capturas"
              mode="folder"
            />
          )}
        </>
      );

    case "run_powershell":
      return (
        <>
          {labelEdit}
          {row(
            t("params.script"),
            <textarea
              style={{ ...inputStyle, height: 100, fontFamily: "monospace", resize: "vertical" }}
              placeholder="Get-Process | Select-Object -First 5"
              value={(activity.params.script as string) || ""}
              onChange={(e) => updateParam("script", e.target.value)}
            />
          )}
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.6 }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                import("@tauri-apps/api/core").then(({ invoke }) =>
                  invoke("open_application", { path: "https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management" })
                );
              }}
              style={{ color: "var(--accent)", textDecoration: "none", fontSize: 11 }}
            >
              📖 {t("params.psRef")}
            </a>
            <br />
            {t("params.psExamples")} <code style={{ background: "var(--surface2)", padding: "1px 4px", borderRadius: 3 }}>Get-Date</code>{" "}
            <code style={{ background: "var(--surface2)", padding: "1px 4px", borderRadius: 3 }}>Get-Process</code>{" "}
            <code style={{ background: "var(--surface2)", padding: "1px 4px", borderRadius: 3 }}>Test-Connection</code>{" "}
            <code style={{ background: "var(--surface2)", padding: "1px 4px", borderRadius: 3 }}>Get-ChildItem</code>
          </div>
        </>
      );

    case "idle_break":
      return (
        <>
          {labelEdit}
          {row(
            t("params.seconds"),
            <input
              style={inputStyle}
              type="number"
              min={1}
              max={3600}
              value={(activity.params.seconds as number) || 30}
              onChange={(e) => updateParam("seconds", parseInt(e.target.value))}
            />
          )}
        </>
      );

    case "mouse_double_click":
      return (
        <>
          {labelEdit}
          <div style={{ display: "flex", gap: 10 }}>
            {row(
              t("params.coordX"),
              <input
                style={{ ...inputStyle, width: 90 }}
                type="number"
                min={0}
                max={3840}
                value={(activity.params.x as number) || 0}
                onChange={(e) => updateParam("x", parseInt(e.target.value) || 0)}
              />
            )}
            {row(
              t("params.coordY"),
              <input
                style={{ ...inputStyle, width: 90 }}
                type="number"
                min={0}
                max={2160}
                value={(activity.params.y as number) || 0}
                onChange={(e) => updateParam("y", parseInt(e.target.value) || 0)}
              />
            )}
          </div>
        </>
      );

    case "keyboard_shortcut":
      return (
        <>
          {labelEdit}
          {row(
            t("params.shortcut"),
            <input
              style={{ ...inputStyle, fontFamily: "monospace" }}
              placeholder="ctrl+s, alt+tab, ctrl+shift+n, f5..."
              value={(activity.params.shortcut as string) || ""}
              onChange={(e) => updateParam("shortcut", e.target.value)}
            />
          )}
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
            {t("params.shortcutHelp")}
          </div>
        </>
      );

    case "scroll_window":
      return (
        <>
          {labelEdit}
          <div style={{ display: "flex", gap: 10 }}>
            {row(
              t("params.scrollDirection"),
              <select
                style={{ ...inputStyle, width: 120 }}
                value={(activity.params.direction as string) || "down"}
                onChange={(e) => updateParam("direction", e.target.value)}
              >
                <option value="down">{t("params.scrollDown")}</option>
                <option value="up">{t("params.scrollUp")}</option>
              </select>
            )}
            {row(
              t("params.scrollAmount"),
              <input
                style={{ ...inputStyle, width: 80 }}
                type="number"
                min={1}
                max={50}
                value={(activity.params.amount as number) || 5}
                onChange={(e) => updateParam("amount", parseInt(e.target.value) || 5)}
              />
            )}
          </div>
        </>
      );

    case "copy_paste":
      return (
        <>
          {labelEdit}
          {row(
            t("params.textCopy"),
            <textarea
              style={{ ...inputStyle, height: 70, resize: "vertical" }}
              placeholder={t("params.textCopyPlaceholder")}
              value={(activity.params.text as string) || ""}
              onChange={(e) => updateParam("text", e.target.value)}
            />
          )}
          {row(
            t("params.pasteDelay"),
            <input
              style={{ ...inputStyle, width: 120 }}
              type="number"
              min={100}
              max={10000}
              value={(activity.params.pasteDelay as number) || 500}
              onChange={(e) => updateParam("pasteDelay", parseInt(e.target.value) || 500)}
            />
          )}
        </>
      );

    case "copy_file":
      return (
        <>
          {labelEdit}
          {row(
            t("params.source"),
            <FileInput
              value={(activity.params.source as string) || ""}
              onChange={(v) => updateParam("source", v)}
              placeholder="C:\\Documentos\\informe.xlsx"
            />
          )}
          {row(
            t("params.dest"),
            <FileInput
              value={(activity.params.dest as string) || ""}
              onChange={(v) => updateParam("dest", v)}
              placeholder="C:\\Backup\\informe_{{date}}.xlsx"
              mode="folder"
            />
          )}
        </>
      );

    case "browse_tabs":
      return (
        <>
          {labelEdit}
          {row(
            t("params.urls"),
            <textarea
              style={{ ...inputStyle, height: 80, fontFamily: "monospace", resize: "vertical" }}
              placeholder={"https://google.com,\nhttps://github.com,\nhttps://stackoverflow.com"}
              value={(activity.params.urls as string) || ""}
              onChange={(e) => updateParam("urls", e.target.value)}
            />
          )}
          {row(
            t("params.urlsInterval"),
            <input
              style={{ ...inputStyle, width: 100 }}
              type="number"
              min={2}
              max={120}
              value={(activity.params.interval as number) || 10}
              onChange={(e) => updateParam("interval", parseInt(e.target.value) || 10)}
            />
          )}
        </>
      );

    case "set_variable":
      return (
        <>
          {labelEdit}
          {row(
            t("params.varName"),
            <input
              style={{ ...inputStyle, fontFamily: "monospace" }}
              placeholder="mi_variable"
              value={(activity.params.name as string) || ""}
              onChange={(e) => updateParam("name", e.target.value.replace(/\s/g, "_"))}
            />
          )}
          {row(
            t("params.varValue", { interpolation: { escapeValue: false } }),
            <input
              style={{ ...inputStyle, fontFamily: "monospace" }}
              placeholder="informe_{{date}}_{{counter}}"
              value={(activity.params.value as string) || ""}
              onChange={(e) => updateParam("value", e.target.value)}
            />
          )}
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>
            {t("params.varUsage", { interpolation: { escapeValue: false } })}
            <br />
            {t("params.varAvailable", { interpolation: { escapeValue: false } })}
          </div>
        </>
      );

    case "random_pause":
      return (
        <>
          {labelEdit}
          <div style={{ display: "flex", gap: 10 }}>
            {row(
              t("params.minSeconds"),
              <input
                style={{ ...inputStyle, width: 90 }}
                type="number"
                min={1}
                max={3600}
                value={(activity.params.minSeconds as number) || 5}
                onChange={(e) => updateParam("minSeconds", parseInt(e.target.value) || 5)}
              />
            )}
            {row(
              t("params.maxSeconds"),
              <input
                style={{ ...inputStyle, width: 90 }}
                type="number"
                min={1}
                max={3600}
                value={(activity.params.maxSeconds as number) || 30}
                onChange={(e) => updateParam("maxSeconds", parseInt(e.target.value) || 30)}
              />
            )}
          </div>
        </>
      );

    default:
      return null;
  }
}
