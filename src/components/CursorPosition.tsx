import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Crosshair } from "lucide-react";

export function CursorPosition() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const [x, y] = await invoke<[number, number]>("get_cursor_position");
        setPos({ x, y });
      } catch {
        // ignore errors (e.g. not on Windows)
      }
    };

    poll(); // initial
    intervalRef.current = window.setInterval(poll, 100); // 10 fps

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!pos) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 6,
        right: 12,
        display: "flex",
        alignItems: "center",
        gap: 5,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "3px 10px",
        fontSize: 11,
        fontFamily: "'Consolas', monospace",
        color: "var(--text-muted)",
        zIndex: 50,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <Crosshair size={11} />
      <span>X: <strong style={{ color: "var(--text)" }}>{pos.x}</strong></span>
      <span>Y: <strong style={{ color: "var(--text)" }}>{pos.y}</strong></span>
    </div>
  );
}
