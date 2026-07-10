import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", flag: "🇬🇧" },
  { code: "es", flag: "🇪🇸" },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith("es") ? "es" : "en";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          title={lang.code === "en" ? "English" : "Español"}
          style={{
            background: current === lang.code ? "var(--surface2)" : "transparent",
            border: current === lang.code ? "1px solid var(--border)" : "1px solid transparent",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 16,
            padding: "2px 6px",
            opacity: current === lang.code ? 1 : 0.5,
            transition: "opacity 0.15s, background 0.15s",
            lineHeight: 1,
          }}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  );
}
