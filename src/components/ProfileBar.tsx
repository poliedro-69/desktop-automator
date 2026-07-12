import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { Save, FolderOpen, Clock, X, ChevronDown, Loader } from "lucide-react";
import type { RecentProfile } from "../hooks/useProfiles";

interface Props {
  recents:      RecentProfile[];
  saving:       boolean;
  loading:      boolean;
  lastError:    string | null;
  onSave:       () => void;
  onOpen:       () => void;
  onLoadRecent: (path: string) => void;
  onRemoveRecent: (path: string) => void;
}

export function ProfileBar({
  recents, saving, loading, lastError,
  onSave, onOpen, onLoadRecent, onRemoveRecent,
}: Props) {
  const { t } = useTranslation();
  const [showRecents, setShowRecents] = useState(false);
  const [menuPos, setMenuPos]         = useState({ top: 0, left: 0 });
  const recentsBtn                    = useRef<HTMLButtonElement>(null);
  const menuRef                       = useRef<HTMLDivElement>(null);

  const openRecentsMenu = () => {
    if (!recentsBtn.current) return;
    const rect = recentsBtn.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 6, left: rect.right - 280 });
    setShowRecents((s) => !s);
  };

  // Close on outside click
  useEffect(() => {
    if (!showRecents) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current   && !menuRef.current.contains(e.target as Node) &&
        recentsBtn.current && !recentsBtn.current.contains(e.target as Node)
      ) setShowRecents(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showRecents]);

  const busy = saving || loading;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>

        {/* Save */}
        <button
          onClick={onSave}
          disabled={busy}
          title={t("profiles.saveTip")}
          style={btnStyle(busy)}
        >
          {saving
            ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
            : <Save size={14} />
          }
          <span>{t("profiles.save")}</span>
        </button>

        {/* Open */}
        <button
          onClick={onOpen}
          disabled={busy}
          title={t("profiles.openTip")}
          style={btnStyle(busy)}
        >
          {loading
            ? <Loader size={14} style={{ animation: "spin 1s linear infinite" }} />
            : <FolderOpen size={14} />
          }
          <span>{t("profiles.open")}</span>
        </button>

        {/* Recents dropdown */}
        {recents.length > 0 && (
          <button
            ref={recentsBtn}
            onClick={openRecentsMenu}
            disabled={busy}
            title={t("profiles.recentsTip")}
            style={{
              ...btnStyle(busy),
              paddingRight: 6,
              color: showRecents ? "var(--text)" : "var(--text-muted)",
              background: showRecents ? "var(--surface2)" : "transparent",
            }}
          >
            <Clock size={14} />
            <ChevronDown size={11} />
          </button>
        )}
      </div>

      {/* Error toast */}
      {lastError && (
        <div style={{
          position: "fixed", bottom: 16, right: 16, zIndex: 9999,
          background: "var(--danger)", color: "white",
          padding: "8px 14px", borderRadius: 8, fontSize: 13,
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)", maxWidth: 360,
        }}>
          ⚠️ {lastError}
        </div>
      )}

      {/* Recents portal menu */}
      {showRecents && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menuPos.top,
            left: Math.max(8, menuPos.left),
            width: 280,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            zIndex: 9999,
            boxShadow: "var(--shadow)",
            overflow: "hidden",
            animation: "menuFadeIn 0.12s ease-out",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "9px 12px", borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{t("profiles.recentsTitle")}</span>
            <X size={13} style={{ cursor: "pointer", color: "var(--text-muted)" }}
              onClick={() => setShowRecents(false)} />
          </div>

          {/* List */}
          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {recents.map((r) => (
              <div
                key={r.path}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 12px", cursor: "pointer",
                  borderBottom: "1px solid var(--border)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--surface2)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")}
              >
                {/* Click on name → load */}
                <div
                  style={{ flex: 1, overflow: "hidden" }}
                  onClick={() => { onLoadRecent(r.path); setShowRecents(false); }}
                >
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {r.name}
                  </div>
                  <div style={{
                    fontSize: 11, color: "var(--text-muted)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {formatDate(r.savedAt)} · {shortPath(r.path)}
                  </div>
                </div>

                {/* Remove from recents */}
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveRecent(r.path); }}
                  title={t("profiles.removeRecent")}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    color: "var(--text-muted)", padding: 4, borderRadius: 4,
                    display: "flex", flexShrink: 0,
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color = "var(--danger)")}
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)")}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function btnStyle(disabled: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 5,
    background: "transparent", border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    color: "var(--text-muted)", padding: "5px 8px",
    borderRadius: 6, fontSize: 13, opacity: disabled ? 0.5 : 1,
    transition: "background 0.12s, color 0.12s",
  };
}

function shortPath(p: string): string {
  const parts = p.replace(/\\/g, "/").split("/");
  return parts.length > 3
    ? "…/" + parts.slice(-2).join("/")
    : p;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}
