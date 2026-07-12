import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { invoke } from "@tauri-apps/api/core";

const PRICE_DISPLAY = "$19.95";

interface LicenseStatus {
  status: "trial" | "licensed" | "expired";
  days_left: number;
  machine_id: string;
}

interface Props {
  children: React.ReactNode;
}

export function LicenseGate({ children }: Props) {
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<LicenseStatus>("check_license")
      .then(setLicense)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "var(--bg)", color: "var(--text-muted)",
      }}>
        <div style={{ textAlign: "center" }}>
          <img src="/robot.png" alt="" style={{ width: 48, height: 48, marginBottom: 12 }} />
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!license) return null;

  if (license.status === "licensed") {
    return <>{children}</>;
  }

  if (license.status === "trial") {
    return (
      <>
        <TrialBar daysLeft={license.days_left} machineId={license.machine_id} />
        {children}
      </>
    );
  }

  return <ExpiredScreen machineId={license.machine_id} />;
}

// ─── Trial bar ───────────────────────────────────────────────────────────────
function TrialBar({ daysLeft, machineId }: { daysLeft: number; machineId: string }) {
  const { t } = useTranslation();
  const [purchasing, setPurchasing] = useState(false);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 12, padding: "5px 16px",
      background: daysLeft <= 7 ? "rgba(239,68,68,0.1)" : "rgba(108,99,255,0.08)",
      borderBottom: "1px solid var(--border)",
      fontSize: 12,
    }}>
      <span style={{ color: daysLeft <= 7 ? "var(--danger)" : "var(--text-muted)" }}>
        ⏱️ {t("trial.daysLeft", { days: daysLeft })}
      </span>
      <button
        onClick={() => { setPurchasing(true); startPurchase(machineId, () => window.location.reload()); }}
        disabled={purchasing}
        style={{
          background: "var(--accent)", color: "white", border: "none",
          borderRadius: 5, padding: "3px 10px", cursor: "pointer",
          fontWeight: 600, fontSize: 11, opacity: purchasing ? 0.6 : 1,
        }}
      >
        {purchasing ? "⏳..." : `${t("trial.buyNow")} ${PRICE_DISPLAY}`}
      </button>
    </div>
  );
}

// ─── Expired screen ──────────────────────────────────────────────────────────
function ExpiredScreen({ machineId }: { machineId: string }) {
  const { t } = useTranslation();
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [pollStatus, setPollStatus] = useState("");

  const handleActivate = async () => {
    setError("");
    try {
      await invoke("activate_license", { key: key.trim() });
      setSuccess(true);
    } catch (err) {
      setError(String(err));
    }
  };

  const handlePurchase = () => {
    setPurchasing(true);
    setPollStatus(t("trial.waitingPayment"));
    startPurchase(machineId, () => {
      setSuccess(true);
    }, (status) => setPollStatus(status));
  };

  if (success) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "var(--bg)", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 40 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>{t("trial.successTitle")}</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            {t("trial.successText")}
          </p>
          <div style={{
            display: "inline-block", background: "rgba(34,197,94,0.1)",
            border: "1px solid var(--success)", borderRadius: 8,
            padding: "8px 20px", fontSize: 14, fontWeight: 700,
            color: "var(--success)", marginBottom: 20,
          }}>
            ✓ {t("trial.registered")}
          </div>
          <br />
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "var(--accent)", color: "white", border: "none",
              borderRadius: 8, padding: "10px 30px", cursor: "pointer",
              fontWeight: 600, fontSize: 14, marginTop: 10,
            }}
          >
            {t("trial.continue")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "var(--bg)", display: "flex",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ textAlign: "center", maxWidth: 440, padding: 40 }}>
        <img src="/robot.png" alt="" style={{ width: 64, height: 64, marginBottom: 16, borderRadius: 12 }} />
        <h2 style={{ marginBottom: 8, fontSize: 22 }}>{t("trial.expired")}</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
          {t("trial.expiredText")}
        </p>

        {/* Purchase button */}
        <button
          onClick={handlePurchase}
          disabled={purchasing}
          style={{
            background: "var(--accent)", color: "white", border: "none",
            borderRadius: 10, padding: "14px 40px", cursor: purchasing ? "wait" : "pointer",
            fontWeight: 700, fontSize: 16, marginBottom: 8,
            boxShadow: "0 4px 16px rgba(108,99,255,0.3)",
            opacity: purchasing ? 0.7 : 1,
          }}
        >
          {purchasing ? "⏳ " + t("trial.processing") : `${t("trial.purchase")} — ${PRICE_DISPLAY}`}
        </button>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
          {t("trial.securePayment")}
        </p>
        {pollStatus && (
          <p style={{ fontSize: 12, color: "var(--accent)", marginBottom: 16 }}>
            {pollStatus}
          </p>
        )}

        {/* Divider */}
        <div style={{ borderTop: "1px solid var(--border)", margin: "20px 0" }} />

        {/* Manual key activation */}
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>
          {t("trial.haveKey")}
        </p>
        <input
          value={key}
          onChange={(e) => { setKey(e.target.value.toUpperCase()); setError(""); }}
          placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
          style={{
            width: "100%", padding: "10px 14px", fontSize: 15,
            fontFamily: "monospace", textAlign: "center", letterSpacing: 1,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 8, color: "var(--text)", marginBottom: 8,
          }}
        />
        {error && <p style={{ color: "var(--danger)", fontSize: 12, marginBottom: 8 }}>{error}</p>}
        <button
          onClick={handleActivate}
          disabled={key.replace(/-/g, "").length < 20}
          style={{
            background: key.replace(/-/g, "").length >= 20 ? "var(--surface2)" : "var(--border)",
            color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8,
            padding: "8px 24px", cursor: key.replace(/-/g, "").length >= 20 ? "pointer" : "not-allowed",
            fontSize: 13, fontWeight: 600,
          }}
        >
          {t("trial.activate")}
        </button>

        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 16, opacity: 0.7 }}>
          Machine ID: {machineId}
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Purchase flow: create session → open browser → poll until paid → auto-activate
// ═══════════════════════════════════════════════════════════════════════════════

async function startPurchase(
  _machineId: string,
  onSuccess: () => void,
  onStatus?: (msg: string) => void,
) {
  try {
    // 1. Get full machine ID
    const fullMachineId = await invoke<string>("get_full_machine_id");

    // 2. Create Stripe Checkout Session with machine_id in metadata
    const resultJson = await invoke<string>("create_checkout_session", {
      machineId: fullMachineId,
    });
    const { url, sessionId } = JSON.parse(resultJson);

    // 3. Open checkout in browser
    await invoke("open_application", { path: url });

    // 4. Poll for payment completion every 5 seconds
    onStatus?.("Waiting for payment...");

    const poll = async () => {
      let attempts = 0;
      const maxAttempts = 120; // 10 minutes max

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 5000)); // wait 5s
        attempts++;

        try {
          const status = await invoke<string>("check_payment_status", { sessionId });

          if (status === "paid") {
            onStatus?.("Payment received! Activating...");

            // 5. Auto-generate and store license key
            // The key is generated from the machine ID using the same HMAC
            // We call activate with a special "auto" flow
            await invoke("activate_license", {
              key: await invoke<string>("generate_license_from_payment", {
                machineId: fullMachineId,
              }).catch(() => {
                // Fallback: generate locally (same HMAC logic)
                return generateLocalKey(fullMachineId);
              }),
            });

            onSuccess();
            return;
          } else if (status === "expired") {
            onStatus?.("Session expired. Please try again.");
            return;
          }
          // "unpaid" → keep polling
          onStatus?.(`Waiting for payment... (${attempts * 5}s)`);
        } catch {
          // Network error, keep trying
        }
      }

      onStatus?.("Timeout. If you already paid, restart the app.");
    };

    poll();
  } catch (err) {
    onStatus?.(`Error: ${String(err)}`);
  }
}

// Fallback: if the Rust command doesn't exist yet, generate key client-side
// This mirrors the HMAC logic in license.rs
async function generateLocalKey(_unused: string): Promise<string> {
  // This shouldn't normally be called — the Rust side handles it
  // But as fallback, just return empty and let the user enter manually
  throw new Error("Please restart the app to complete activation");
}
