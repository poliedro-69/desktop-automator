import { useEffect, useRef, memo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Crosshair } from "lucide-react";

/**
 * Displays global cursor position. Optimized to avoid React re-renders:
 * - Uses direct DOM manipulation instead of useState
 * - Polls every 500ms instead of 100ms
 * - Wrapped in memo to prevent parent re-renders from affecting it
 */
export const CursorPosition = memo(function CursorPosition() {
  const xRef = useRef<HTMLSpanElement>(null);
  const yRef = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let lastX = -1;
    let lastY = -1;

    const poll = async () => {
      try {
        const [x, y] = await invoke<[number, number]>("get_cursor_position");
        // Only update DOM if position actually changed
        if (x !== lastX || y !== lastY) {
          lastX = x;
          lastY = y;
          if (xRef.current) xRef.current.textContent = String(x);
          if (yRef.current) yRef.current.textContent = String(y);
        }
      } catch {
        // ignore
      }
    };

    poll();
    intervalRef.current = window.setInterval(poll, 500); // 2 fps — sufficient for coordinate display

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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
      <span>X: <strong ref={xRef} style={{ color: "var(--text)" }}>0</strong></span>
      <span>Y: <strong ref={yRef} style={{ color: "var(--text)" }}>0</strong></span>
    </div>
  );
});
