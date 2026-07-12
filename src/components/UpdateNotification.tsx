import { useTranslation } from "react-i18next";
import { Download, X, RefreshCw } from "lucide-react";
import { useUpdater } from "../hooks/useUpdater";

export function UpdateNotification() {
  const { t } = useTranslation();
  const { info, downloadAndInstall, restartApp, dismiss } = useUpdater();

  // Only show when there's something to show
  if (info.status === "idle" || info.status === "checking" || info.status === "error") {
    return null;
  }

  return (
    <div style={{
      position: "fixed",
      bottom: 40,
      right: 16,
      zIndex: 9990,
      background: "var(--surface)",
      border: "1px solid var(--accent)",
      borderRadius: 10,
      padding: "12px 16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      minWidth: 280,
      maxWidth: 340,
      animation: "menuFadeIn 0.2s ease-out",
    }}>
      {/* Close button */}
      {info.status === "available" && (
        <button
          onClick={dismiss}
          style={{
            position: "absolute", top: 8, right: 8,
            background: "transparent", border: "none", cursor: "pointer",
            color: "var(--text-muted)", display: "flex",
          }}
        >
          <X size={14} />
        </button>
      )}

      {/* Update available */}
      {info.status === "available" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Download size={16} color="var(--accent)" />
            <span style={{ fontWeight: 600, fontSize: 13 }}>
              {t("update.available", { version: info.version })}
            </span>
          </div>
          {info.notes && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10, lineHeight: 1.5 }}>
              {info.notes.slice(0, 150)}{info.notes.length > 150 ? "..." : ""}
            </p>
          )}
          <button
            onClick={downloadAndInstall}
            style={{
              width: "100%",
              background: "var(--accent)", color: "white", border: "none",
              borderRadius: 6, padding: "8px", cursor: "pointer",
              fontWeight: 600, fontSize: 13,
            }}
          >
            {t("update.download")}
          </button>
        </div>
      )}

      {/* Downloading */}
      {info.status === "downloading" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <RefreshCw size={14} color="var(--accent)" style={{ animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: 13 }}>{t("update.downloading")}</span>
          </div>
          {info.progress != null && (
            <div style={{
              height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", width: `${info.progress}%`,
                background: "var(--accent)", transition: "width 0.3s",
              }} />
            </div>
          )}
        </div>
      )}

      {/* Ready to restart */}
      {info.status === "ready" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{t("update.ready")}</span>
          </div>
          <button
            onClick={restartApp}
            style={{
              width: "100%",
              background: "var(--success)", color: "white", border: "none",
              borderRadius: 6, padding: "8px", cursor: "pointer",
              fontWeight: 600, fontSize: 13,
            }}
          >
            {t("update.restart")}
          </button>
        </div>
      )}
    </div>
  );
}
