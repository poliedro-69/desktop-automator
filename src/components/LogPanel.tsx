import { useTranslation } from "react-i18next";
import { Terminal, Trash2 } from "lucide-react";
import type { LogEntry } from "../types";

const LEVEL_COLORS: Record<LogEntry["level"], string> = {
  info:    "var(--log-info)",
  success: "var(--log-success)",
  warning: "var(--log-warning)",
  error:   "var(--log-error)",
};

interface Props {
  logs: LogEntry[];
  onClear: () => void;
}

export function LogPanel({ logs, onClear }: Props) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Terminal size={15} color="var(--accent)" />
          <span style={{ fontWeight: 600 }}>{t("log.title")}</span>
          <span
            style={{
              background: "var(--surface2)",
              borderRadius: 99,
              padding: "1px 8px",
              fontSize: 11,
              color: "var(--text-muted)",
            }}
          >
            {logs.length}
          </span>
        </div>
        <button
          onClick={onClear}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
          }}
        >
          <Trash2 size={12} />
          {t("log.clear")}
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "10px 14px",
          fontFamily: "'Consolas', 'Courier New', monospace",
          fontSize: 12,
          lineHeight: 1.7,
          background: "var(--log-bg)",
          borderRadius: "0 0 var(--radius) var(--radius)",
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: "var(--text-muted)", textAlign: "center", marginTop: 40 }}>
            {t("log.empty")}
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} style={{ color: LEVEL_COLORS[log.level] }}>
              <span style={{ color: "var(--log-time)", marginRight: 8 }}>[{log.timestamp}]</span>
              {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
