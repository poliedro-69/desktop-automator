import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import type { Activity, ActivityType } from "../types";

// ── Activity template ────────────────────────────────────────────────────────
interface ActivityTemplate {
  type: ActivityType;
  icon: string;
  params: Record<string, string | number | boolean>;
}

// ── Categories with their activities ─────────────────────────────────────────
interface Category {
  id: string;
  icon: string;
  items: ActivityTemplate[];
}

const CATEGORIES: Category[] = [
  {
    id: "apps",
    icon: "📁",
    items: [
      { type: "open_app",         icon: "🖥️", params: { path: "C:\\Windows\\System32\\notepad.exe" } },
      { type: "open_file",        icon: "📄", params: { path: "" } },
      { type: "open_spreadsheet", icon: "📊", params: { path: "" } },
      { type: "copy_file",        icon: "📂", params: { source: "", dest: "" } },
    ],
  },
  {
    id: "web",
    icon: "🌐",
    items: [
      { type: "open_browser",    icon: "🌐", params: { url: "https://www.google.com" } },
      { type: "browse_intranet", icon: "🏢", params: { url: "http://intranet/" } },
      { type: "browse_tabs",     icon: "🔄", params: { urls: "https://google.com,https://github.com,https://stackoverflow.com", interval: 10 } },
    ],
  },
  {
    id: "mouse",
    icon: "🖱️",
    items: [
      { type: "mouse_move",         icon: "🖱️", params: { duration: 15 } },
      { type: "mouse_click",        icon: "🎯", params: { x: 500, y: 400, button: "left" } },
      { type: "mouse_double_click", icon: "👆", params: { x: 500, y: 400 } },
      { type: "scroll_window",      icon: "📜", params: { direction: "down", amount: 5 } },
    ],
  },
  {
    id: "keyboard",
    icon: "⌨️",
    items: [
      { type: "keyboard_shortcut", icon: "⌨️", params: { shortcut: "ctrl+s" } },
      { type: "type_text",          icon: "✍️", params: { text: "Texto de ejemplo..." } },
      { type: "copy_paste",         icon: "📋", params: { text: "Texto copiado de ejemplo", pasteDelay: 500 } },
    ],
  },
  {
    id: "system",
    icon: "⚡",
    items: [
      { type: "run_powershell",  icon: "⚡", params: { script: "Get-Date" } },
      { type: "take_screenshot", icon: "📸", params: { outputPath: "C:\\Temp\\screenshots" } },
      { type: "set_variable",    icon: "📌", params: { name: "mi_variable", value: "valor_{{date}}" } },
    ],
  },
  {
    id: "pauses",
    icon: "⏸️",
    items: [
      { type: "random_pause", icon: "🎲", params: { minSeconds: 5, maxSeconds: 30 } },
      { type: "idle_break",   icon: "⏸️", params: { seconds: 30 } },
    ],
  },
];

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  onAdd: (activity: Activity) => void;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface MenuPos {
  top: number;
  left: number;
}

export function AddActivityMenu({ onAdd }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState<MenuPos>({ top: 0, left: 0 });
  const btnRef          = useRef<HTMLButtonElement>(null);
  const menuRef         = useRef<HTMLDivElement>(null);

  const calcPos = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuH = 480;
    const menuW = 300;
    const vpH = window.innerHeight;
    const vpW = window.innerWidth;

    const spaceBelow = vpH - rect.bottom;
    const top = spaceBelow < menuH + 8 && rect.top > menuH + 8
      ? rect.top - menuH - 6
      : rect.bottom + 6;
    const left = Math.min(rect.left, vpW - menuW - 8);

    setPos({ top, left });
  }, []);

  const handleOpen = () => {
    calcPos();
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const onScroll = () => calcPos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, calcPos]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleAdd = (template: ActivityTemplate) => {
    onAdd({
      id: uid(),
      type: template.type,
      label: t(`activityTypes.${template.type}`),
      params: { ...template.params },
      enabled: true,
    });
    setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "var(--accent)",
          color: "white",
          border: "none",
          borderRadius: "var(--radius)",
          padding: "8px 16px",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        <Plus size={15} />
        {t("activities.add")}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: 300,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              zIndex: 9999,
              boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
              overflow: "hidden",
              animation: "menuFadeIn 0.12s ease-out",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontWeight: 600 }}>{t("activities.selectActivity")}</span>
              <X
                size={14}
                style={{ cursor: "pointer", color: "var(--text-muted)" }}
                onClick={() => setOpen(false)}
              />
            </div>

            {/* Categorized items */}
            <div style={{ maxHeight: 420, overflowY: "auto" }}>
              {CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  {/* Category header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px 4px",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-muted)",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{t(`categories.${cat.id}`)}</span>
                  </div>

                  {/* Items in category */}
                  {cat.items.map((tmpl) => (
                    <div
                      key={tmpl.type}
                      onClick={() => handleAdd(tmpl)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "7px 14px 7px 24px",
                        cursor: "pointer",
                        transition: "background 0.12s",
                        fontSize: 13,
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background = "var(--surface2)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLDivElement).style.background = "transparent")
                      }
                    >
                      <span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{tmpl.icon}</span>
                      <span>{t(`activityTypes.${tmpl.type}`)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
