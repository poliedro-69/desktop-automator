import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { Info, X, ExternalLink } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { APP_VERSION } from "../version";

export function AboutButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState<string>("trial");

  useEffect(() => {
    invoke<{ status: string }>("check_license").then((r) => setLicenseStatus(r.status));
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={t("about.title")}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          padding: 6,
          borderRadius: 6,
        }}
      >
        <Info size={15} />
      </button>

      {open && createPortal(
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 14,
              width: 440,
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 16px 60px rgba(0,0,0,0.5)",
              animation: "menuFadeIn 0.15s ease-out",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 20px", borderBottom: "1px solid var(--border)",
            }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>{t("about.title")}</span>
              <X size={16} style={{ cursor: "pointer", color: "var(--text-muted)" }}
                onClick={() => setOpen(false)} />
            </div>

            {/* Content */}
            <div style={{ padding: "20px" }}>
              {/* Logo + Name */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <img src="/robot.png" alt="logo" style={{ width: 56, height: 56, borderRadius: 12 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 20 }}>Desktop Automator</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>v{APP_VERSION}</span>
                    {licenseStatus === "licensed" && (
                      <span style={{
                        background: "rgba(239,68,68,0.1)",
                        color: "#ef4444",
                        border: "1px solid #ef4444",
                        borderRadius: 4,
                        padding: "1px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}>
                        {t("trial.registered")}
                      </span>
                    )}
                    {licenseStatus === "trial" && (
                      <span style={{
                        background: "rgba(108,99,255,0.1)",
                        color: "var(--accent)",
                        border: "1px solid var(--accent)",
                        borderRadius: 4,
                        padding: "1px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                      }}>
                        TRIAL
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-muted)", marginBottom: 16 }}>
                {t("about.description")}
              </p>

              {/* Tech stack */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: 6 }}>
                  {t("about.techStack")}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["Tauri 2.0", "Rust", "React", "TypeScript", "WebView2"].map((tech) => (
                    <span key={tech} style={{
                      background: "var(--surface2)", border: "1px solid var(--border)",
                      borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "var(--accent)",
                    }}>{tech}</span>
                  ))}
                </div>
              </div>

              {/* License */}
              <div style={{
                background: "var(--surface2)", borderRadius: 8, padding: "12px 14px", marginBottom: 16,
                border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: 6 }}>
                  {t("about.license")}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                  {t("about.licenseText")}
                </div>
              </div>

              {/* Links */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <AboutLink label={t("about.website")} url="https://desktopautomator.com" />
                <AboutLink label={t("about.support")} url="mailto:poliedro69@gmail.com" />
                <AboutLink label={t("about.privacy")} url="https://desktopautomator.com/privacy" />
                <AboutLink label={t("about.terms")} url="https://desktopautomator.com/terms" />
              </div>

              {/* Copyright */}
              <div style={{
                marginTop: 20, paddingTop: 14, borderTop: "1px solid var(--border)",
                fontSize: 11, color: "var(--text-muted)", textAlign: "center",
              }}>
                © 2026 Desktop Automator. {t("about.rights")}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function AboutLink({ label, url }: { label: string; url: string }) {
  const handleClick = () => {
    import("@tauri-apps/api/core").then(({ invoke }) =>
      invoke("open_application", { path: url })
    );
  };

  return (
    <button
      onClick={handleClick}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        background: "transparent", border: "none", cursor: "pointer",
        color: "var(--accent)", fontSize: 13, padding: "4px 0", textAlign: "left",
      }}
    >
      <ExternalLink size={12} />
      {label}
    </button>
  );
}
