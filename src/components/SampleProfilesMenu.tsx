import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { BookOpen, X } from "lucide-react";
import { SAMPLE_PROFILES, SampleProfile } from "../data/sampleProfiles";
import type { Activity, SimulationConfig } from "../types";

interface Props {
  onLoad: (activities: Activity[], config: Omit<SimulationConfig, "activities">) => void;
}

export function SampleProfilesMenu({ onLoad }: Props) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuW = 340;
      setPos({
        top: rect.bottom + 6,
        left: Math.min(rect.left, window.innerWidth - menuW - 8),
      });
    }
    setOpen((o) => !o);
  };

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

  const handleSelect = (profile: SampleProfile) => {
    onLoad(profile.activities, profile.config);
    setOpen(false);
  };

  // Show profiles matching current language, fallback to English
  const lang = i18n.language?.startsWith("es") ? "es" : "en";
  const filteredProfiles = SAMPLE_PROFILES.filter((p) => p.lang === lang);

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        title={t("profiles.samplesTip")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: open ? "var(--text)" : "var(--text-muted)",
          padding: "5px 8px",
          borderRadius: 6,
          fontSize: 13,
        }}
      >
        <BookOpen size={14} />
        <span>{t("toolbar.examples")}</span>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: 340,
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
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 14px", borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{t("profiles.samplesTitle")}</span>
            <X size={13} style={{ cursor: "pointer", color: "var(--text-muted)" }}
              onClick={() => setOpen(false)} />
          </div>

          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {filteredProfiles.map((p) => (
              <ProfileItem key={p.id} profile={p} onSelect={handleSelect} />
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function ProfileItem({ profile, onSelect }: { profile: SampleProfile; onSelect: (p: SampleProfile) => void }) {
  const { t } = useTranslation();
  return (
    <div
      onClick={() => onSelect(profile)}
      style={{
        padding: "8px 14px",
        cursor: "pointer",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface2)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ fontSize: 13, fontWeight: 500 }}>{profile.name}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
        {profile.description}
        <span style={{ marginLeft: 8, opacity: 0.7 }}>
          ({profile.activities.length} {t("profiles.activities_count")})
        </span>
      </div>
    </div>
  );
}
