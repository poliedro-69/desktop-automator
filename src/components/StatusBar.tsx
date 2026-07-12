import { useTranslation } from "react-i18next";
import { Activity, CheckCircle, RefreshCw } from "lucide-react";
import type { SimulationStatus } from "../types";

interface Props {
  status: SimulationStatus;
}

export function StatusBar({ status }: Props) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        display: "flex",
        gap: 20,
        padding: "10px 16px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        marginBottom: 16,
        alignItems: "center",
      }}
    >
      {/* Estado */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: status.running ? "var(--success)" : "var(--text-muted)",
            display: "inline-block",
            boxShadow: status.running ? "0 0 6px var(--success)" : "none",
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {status.running ? t("status.running") : t("status.stopped")}
        </span>
      </div>

      <div style={{ width: 1, height: 20, background: "var(--border)" }} />

      {/* Actividad actual */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
        <Activity size={13} color="var(--accent)" />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {status.currentActivity ?? "—"}
        </span>
      </div>

      <div style={{ width: 1, height: 20, background: "var(--border)" }} />

      {/* Acciones completadas */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <CheckCircle size={13} color="var(--success)" />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {t("status.actions", { count: status.totalActions })}
        </span>
      </div>

      <div style={{ width: 1, height: 20, background: "var(--border)" }} />

      {/* Ciclos */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <RefreshCw size={13} color="var(--warning)" />
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {t("status.cycle", { n: status.completedCycles })}
        </span>
      </div>
    </div>
  );
}
